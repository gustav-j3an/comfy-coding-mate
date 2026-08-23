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

// Chunks for batch processing
const BATCH_SIZE = 50;

export const executeImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    importBatchId: z.string(),
    validFrom: z.string(),
    promoters: z.array(PromoterSchema),
    stores: z.array(StoreSchema),
    industries: z.array(IndustrySchema),
    routes: z.array(RouteSchema),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: hasRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    if (!hasRole) throw new Error("Não autorizado.");

    const results = {
      promoters: { created: 0, updated: 0, ignored: 0 },
      stores: { created: 0, updated: 0, ignored: 0 },
      industries: { created: 0, updated: 0, ignored: 0 },
      routes: { created: 0, ignored: 0 },
      stops: { created: 0 },
      errors: [] as string[]
    };

    try {
      const promoterMap = new Map<string, string>();
      const storeMap = new Map<string, string>();
      const industryMap = new Map<string, string>();

      // 1. INDUSTRIES (Batch)
      for (let i = 0; i < data.industries.length; i += BATCH_SIZE) {
        const chunk = data.industries.slice(i, i + BATCH_SIZE);
        for (const ind of chunk) {
          const { data: existing } = await supabaseAdmin.from('industries').select('id').eq('name', ind.nome).maybeSingle();
          if (!existing) {
            const { data: created, error } = await supabaseAdmin.from('industries').insert({ name: ind.nome }).select('id').single();
            if (error) results.errors.push(`Erro Indústria ${ind.nome}: ${error.message}`);
            else {
              results.industries.created++;
              industryMap.set(ind.nome.toLowerCase(), created.id);
            }
          } else {
            results.industries.ignored++;
            industryMap.set(ind.nome.toLowerCase(), existing.id);
          }
        }
      }

      // 2. STORES (Batch)
      for (let i = 0; i < data.stores.length; i += BATCH_SIZE) {
        const chunk = data.stores.slice(i, i + BATCH_SIZE);
        for (const s of chunk) {
          const { data: existing } = await supabaseAdmin.from('stores').select('id').eq('name', s.loja).maybeSingle();
          if (!existing) {
            const { data: created, error } = await supabaseAdmin.from('stores').insert({
              name: s.loja,
              address: s.rede || 'Não informado',
              state: s.uf || null,
              active: true
            }).select('id').single();
            if (error) results.errors.push(`Erro Loja ${s.loja}: ${error.message}`);
            else {
              results.stores.created++;
              storeMap.set(s.loja.toLowerCase(), created.id);
            }
          } else {
            results.stores.ignored++;
            storeMap.set(s.loja.toLowerCase(), existing.id);
          }
        }
      }

      // 3. PROMOTERS (Batch)
      for (let i = 0; i < data.promoters.length; i += BATCH_SIZE) {
        const chunk = data.promoters.slice(i, i + BATCH_SIZE);
        for (const p of chunk) {
          const { data: existing } = await supabaseAdmin.from('promoters').select('id').eq('name', p.nome).maybeSingle();
          if (!existing) {
            const { data: created, error } = await supabaseAdmin.from('promoters').insert({
              name: p.nome,
              region: p.uf || null,
              phone: p.contato || null,
              observation: p.observacao || null,
              active: true
            }).select('id').single();
            if (error) results.errors.push(`Erro Promotor ${p.nome}: ${error.message}`);
            else {
              results.promoters.created++;
              promoterMap.set(p.nome.toLowerCase(), created.id);
            }
          } else {
            results.promoters.ignored++;
            promoterMap.set(p.nome.toLowerCase(), existing.id);
          }
        }
      }

      // 4. ROUTES & STOPS (Group by Promoter correctly)
      const promoterStops = new Map<string, any[]>();
      data.routes.forEach(sheet => {
        sheet.stops.forEach(stop => {
          const pKey = stop.promotor.toLowerCase();
          if (!promoterStops.has(pKey)) promoterStops.set(pKey, []);
          promoterStops.get(pKey)!.push(stop);
        });
      });

      for (const [pName, stops] of promoterStops.entries()) {
        const promoterId = promoterMap.get(pName);
        if (!promoterId) continue;

        // Check for existing DRAFT route for this promoter to ensure idempotency
        const routeName = `Importação Excel — ${stops[0].promotor}`;
        let { data: route } = await supabaseAdmin.from('routes')
          .select('id')
          .eq('promoter_id', promoterId)
          .eq('status', 'draft')
          .eq('name', routeName)
          .maybeSingle();

        if (!route) {
          const { data: newRoute, error: rError } = await supabaseAdmin.from('routes').insert({
            name: routeName,
            promoter_id: promoterId,
            valid_from: data.validFrom,
            status: 'draft',
            active: false,
            created_by: userId,
            version: 1
          }).select('id').single();

          if (rError) {
            results.errors.push(`Erro Roteiro ${stops[0].promotor}: ${rError.message}`);
            continue;
          }
          route = newRoute;
          results.routes.created++;
        } else {
          results.routes.ignored++;
        }

        // Process Stops (Idempotent check within the route)
        const daysMap: Record<string, number> = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, dom: 0 };
        
        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i];
          const storeId = storeMap.get(stop.loja.toLowerCase());
          const indId = industryMap.get(stop.industria.toLowerCase());

          if (!storeId || !indId) continue;

          for (const [day, active] of Object.entries(stop.dias)) {
            if (active) {
              const dayOfWeek = daysMap[day as keyof typeof daysMap]!;
              
              // Check if stop already exists in this route
              const { data: existingStop } = await supabaseAdmin.from('route_stops')
                .select('id')
                .eq('route_id', route.id)
                .eq('store_id', storeId)
                .eq('day_of_week', dayOfWeek)
                .maybeSingle();

              if (!existingStop) {
                const { data: newStop, error: rsError } = await supabaseAdmin.from('route_stops').insert({
                  route_id: route.id,
                  store_id: storeId,
                  day_of_week: dayOfWeek,
                  visit_order: i + 1,
                  frequency: stop.frequencia === 'Quinzenal' ? 'biweekly' : 'weekly',
                  biweekly_start_date: data.validFrom
                }).select('id').single();

                if (!rsError) {
                  results.stops.created++;
                  await supabaseAdmin.from('stop_tasks').insert({
                    stop_id: newStop.id,
                    industry_id: indId
                  });
                }
              }
            }
          }
        }
      }

      await recordAudit({
        userId,
        action: 'import_operational_base',
        module: 'admin',
        summary: `Importação ${data.importBatchId} concluída.`,
        details: results
      });

      return { success: true, results };
    } catch (err: any) {
      return { success: false, error: err.message, results };
    }
  });
