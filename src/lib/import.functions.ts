import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { recordAudit } from "./audit.server";

const PromoterSchema = z.object({
  nome: z.string(),
  matricula: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),
  cidade: z.string().nullable().optional(),
  contato: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

const StoreSchema = z.object({
  rede: z.string().nullable().optional(),
  loja: z.string(),
  uf: z.string().nullable().optional(),
});

const IndustrySchema = z.object({
  nome: z.string(),
});

const RouteStopSchema = z.object({
  industria: z.string(),
  loja: z.string(),
  promotor: z.string(),
  frequencia: z.string(),
  dias: z.object({
    seg: z.boolean(),
    ter: z.boolean(),
    qua: z.boolean(),
    qui: z.boolean(),
    sex: z.boolean(),
    sab: z.boolean(),
    dom: z.boolean(),
  }),
});

const RouteSchema = z.object({
  sheetName: z.string(),
  stops: z.array(RouteStopSchema),
});

export const executeImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    validFrom: z.string(),
    promoters: z.array(PromoterSchema),
    stores: z.array(StoreSchema),
    industries: z.array(IndustrySchema),
    routes: z.array(RouteSchema),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Verify admin role
    const { data: hasRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    if (!hasRole) throw new Error("Não autorizado.");

    const results = {
      promoters: { created: 0, updated: 0, ignored: 0 },
      stores: { created: 0, updated: 0, ignored: 0 },
      industries: { created: 0, updated: 0, ignored: 0 },
      routes: { created: 0, pending: 0 },
      errors: [] as string[]
    };

    try {
      // Mapping name/key to database UUID
      const promoterMap = new Map<string, string>();
      const storeMap = new Map<string, string>();
      const industryMap = new Map<string, string>();

      // --- IMPORT PROMOTERS ---
      for (const p of data.promoters) {
        let existing = null;
        if (p.matricula) {
          const { data: byMat } = await supabaseAdmin.from('promoters').select('id').eq('registration_number', p.matricula).maybeSingle();
          existing = byMat;
        }
        
        if (!existing) {
          const { data: created, error } = await supabaseAdmin.from('promoters').insert({
            name: p.nome,
            registration_number: p.matricula || null,
            uf: p.uf || null,
            city: p.cidade || null,
            contact: p.contato || null,
            observation: p.observacao || null
          }).select('id').single();
          
          if (error) results.errors.push(`Erro ao criar promotor ${p.nome}: ${error.message}`);
          else {
            results.promoters.created++;
            promoterMap.set(p.nome.toLowerCase(), created.id);
          }
        } else {
          results.promoters.ignored++;
          promoterMap.set(p.nome.toLowerCase(), existing.id);
        }
      }

      // --- IMPORT INDUSTRIES ---
      for (const ind of data.industries) {
        const { data: existing } = await supabaseAdmin.from('industries').select('id').eq('name', ind.nome).maybeSingle();
        if (!existing) {
          const { data: created, error } = await supabaseAdmin.from('industries').insert({ name: ind.nome }).select('id').single();
          if (error) results.errors.push(`Erro ao criar indústria ${ind.nome}: ${error.message}`);
          else {
            results.industries.created++;
            industryMap.set(ind.nome.toLowerCase(), created.id);
          }
        } else {
          results.industries.ignored++;
          industryMap.set(ind.nome.toLowerCase(), existing.id);
        }
      }

      // --- IMPORT STORES ---
      for (const s of data.stores) {
        // Combination: REDE + LOJA + UF
        const { data: existing } = await supabaseAdmin.from('stores')
          .select('id')
          .eq('name', s.loja)
          .eq('uf', s.uf || '')
          .maybeSingle();

        if (!existing) {
          const { data: created, error } = await supabaseAdmin.from('stores').insert({
            name: s.loja,
            network: s.rede || null,
            uf: s.uf || null
          }).select('id').single();
          
          if (error) results.errors.push(`Erro ao criar loja ${s.loja}: ${error.message}`);
          else {
            results.stores.created++;
            storeMap.set(s.loja.toLowerCase(), created.id);
          }
        } else {
          results.stores.ignored++;
          storeMap.set(s.loja.toLowerCase(), existing.id);
        }
      }

      // --- IMPORT ROUTES (as DRAFT) ---
      // We group stops by promoter
      const promoterRoutes = new Map<string, any[]>();
      data.routes.forEach(sheet => {
        sheet.stops.forEach(stop => {
          const pKey = stop.promotor.toLowerCase();
          if (!promoterRoutes.has(pKey)) promoterRoutes.set(pKey, []);
          promoterRoutes.get(pKey)!.push(stop);
        });
      });

      for (const [pName, stops] of promoterRoutes.entries()) {
        const promoterId = promoterMap.get(pName);
        if (!promoterId) continue;

        // Create the Route header
        const { data: route, error: rError } = await supabaseAdmin.from('routes').insert({
          name: `Importação Excel — ${stops[0].promotor}`,
          promoter_id: promoterId,
          valid_from: data.validFrom,
          status: 'draft' as any,
          active: false,
          created_by: userId,
          version: 1
        }).select('id').single();

        if (rError) {
          results.errors.push(`Erro ao criar roteiro para ${stops[0].promotor}: ${rError.message}`);
          continue;
        }

        results.routes.created++;

        // Add stops
        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i];
          const storeId = storeMap.get(stop.loja.toLowerCase());
          const indId = industryMap.get(stop.industria.toLowerCase());

          if (!storeId || !indId) {
            results.errors.push(`Parada ignorada: Loja ou Indústria não encontrada para ${stop.loja}/${stop.industria}`);
            continue;
          }

          // Each mark in Excel corresponds to a day_of_week in our schema (0=Sun, 1=Mon...)
          const daysMap: Record<string, number> = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, dom: 0 };
          
          for (const [day, active] of Object.entries(stop.dias)) {
            if (active) {
              const { data: routeStop, error: rsError } = await supabaseAdmin.from('route_stops').insert({
                route_id: route.id,
                store_id: storeId,
                day_of_week: daysMap[day],
                visit_order: i + 1,
                frequency: stop.frequencia === 'Quinzenal' ? 'biweekly' : 'weekly',
                biweekly_start_date: data.validFrom
              }).select('id').single();

              if (!rsError) {
                await supabaseAdmin.from('stop_tasks').insert({
                  stop_id: routeStop.id,
                  industry_id: indId
                });
              }
            }
          }
        }
      }

      await recordAudit({
        userId,
        action: 'import_operational_base',
        module: 'admin',
        summary: 'Importação de base operacional via Excel concluída.',
        details: results
      });

      return { success: true, results };
    } catch (err: any) {
      return { success: false, error: err.message, results };
    }
  });
