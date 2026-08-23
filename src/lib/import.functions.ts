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

export const getImportBatchStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ batchId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: batch, error } = await (supabaseAdmin as any)
      .from('import_batches')
      .select('*')
      .eq('id', data.batchId)
      .maybeSingle();
    
    if (error) throw error;
    return batch;
  });

export const startImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    batchId: z.string(),
    validFrom: z.string(),
    summary: z.any()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: existing } = await (supabaseAdmin as any)
      .from('import_batches')
      .select('status')
      .eq('id', data.batchId)
      .maybeSingle();

    if (existing) return { success: true, status: existing.status };

    const { error } = await (supabaseAdmin as any)
      .from('import_batches')
      .insert({
        id: data.batchId,
        admin_id: userId,
        valid_from: data.validFrom,
        status: 'processing',
        summary: data.summary,
        step: 'industries',
        processed_count: 0
      });

    if (error) throw error;
    return { success: true, status: 'processing' };
  });

export const processImportStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    batchId: z.string(),
    step: z.enum(['industries', 'stores', 'promoters', 'routes', 'stops']),
    items: z.array(z.any()),
    validFrom: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: batch } = await (supabaseAdmin as any)
      .from('import_batches')
      .select('*')
      .eq('id', data.batchId)
      .single();

    if (!batch || batch.status !== 'processing') {
      throw new Error("Lote não está em processamento.");
    }

    const results: any = { created: 0, updated: 0, ignored: 0, errors: [] };

    try {
      if (data.step === 'industries') {
        for (const ind of data.items) {
          const { data: existing } = await supabaseAdmin.from('industries').select('id').eq('name', ind.nome).maybeSingle();
          if (!existing) {
            const { error } = await supabaseAdmin.from('industries').insert({ name: ind.nome } as any);
            if (error) results.errors.push(`Indústria ${ind.nome}: ${error.message}`);
            else results.created++;
          } else results.ignored++;
        }
      } else if (data.step === 'stores') {
        for (const s of data.items) {
          const { data: existing } = await supabaseAdmin.from('stores').select('id').eq('name', s.loja).maybeSingle();
          if (!existing) {
            const { error } = await supabaseAdmin.from('stores').insert({
              name: s.loja,
              address: s.rede || 'Não informado',
              state: s.uf || null,
              active: true
            } as any);
            if (error) results.errors.push(`Loja ${s.loja}: ${error.message}`);
            else results.created++;
          } else results.ignored++;
        }
      } else if (data.step === 'promoters') {
        for (const p of data.items) {
          const { data: existing } = await supabaseAdmin.from('promoters').select('id').eq('name', p.nome).maybeSingle();
          if (!existing) {
            const { error } = await supabaseAdmin.from('promoters').insert({
              name: p.nome,
              region: p.uf || null,
              phone: p.contato || null,
              observation: p.observacao || null,
              active: true
            } as any);
            if (error) results.errors.push(`Promotor ${p.nome}: ${error.message}`);
            else results.created++;
          } else results.ignored++;
        }
      } else if (data.step === 'routes') {
        for (const sheet of data.items) {
          const pName = sheet.stops[0]?.promotor;
          if (!pName) continue;
          const { data: promoter } = await supabaseAdmin.from('promoters').select('id').eq('name', pName).single();
          if (!promoter) continue;
          const routeName = `Importação Excel — ${pName}`;
          const { data: existing } = await supabaseAdmin.from('routes')
            .select('id')
            .eq('promoter_id', promoter.id)
            .eq('status', 'draft')
            .eq('name', routeName)
            .maybeSingle();

          if (!existing) {
            const { error } = await supabaseAdmin.from('routes').insert({
              name: routeName,
              promoter_id: promoter.id,
              valid_from: data.validFrom || (batch as any).valid_from,
              status: 'draft',
              active: false,
              created_by: userId,
              version: 1
            } as any);
            if (error) results.errors.push(`Roteiro ${pName}: ${error.message}`);
            else results.created++;
          } else results.ignored++;
        }
      } else if (data.step === 'stops') {
        const daysMap: Record<string, number> = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, dom: 0 };
        for (const stop of data.items) {
          const { data: promoter } = await supabaseAdmin.from('promoters').select('id').eq('name', stop.promotor).maybeSingle();
          const { data: store } = await supabaseAdmin.from('stores').select('id').eq('name', stop.loja).maybeSingle();
          const { data: industry } = await supabaseAdmin.from('industries').select('id').eq('name', stop.industria).maybeSingle();
          if (!promoter || !store || !industry) continue;
          const routeName = `Importação Excel — ${stop.promotor}`;
          const { data: route } = await supabaseAdmin.from('routes').select('id').eq('promoter_id', promoter.id).eq('status', 'draft').eq('name', routeName).maybeSingle();
          if (!route) continue;
          for (const [day, active] of Object.entries(stop.dias)) {
            if (active) {
              const dayOfWeek = daysMap[day as keyof typeof daysMap]!;
              const { data: existingStop } = await supabaseAdmin.from('route_stops').select('id').eq('route_id', route.id).eq('store_id', store.id).eq('day_of_week', dayOfWeek).maybeSingle();
              if (!existingStop) {
                const { data: newStop, error } = await supabaseAdmin.from('route_stops').insert({
                  route_id: route.id,
                  store_id: store.id,
                  day_of_week: dayOfWeek,
                  visit_order: 1,
                  frequency: stop.frequencia === 'Quinzenal' ? 'biweekly' : 'weekly',
                  biweekly_start_date: data.validFrom || (batch as any).valid_from
                } as any).select('id').single();
                if (!error && newStop) {
                  results.created++;
                  await supabaseAdmin.from('stop_tasks').insert({ stop_id: newStop.id, industry_id: industry.id } as any);
                }
              } else results.ignored++;
            }
          }
        }
      }

      await (supabaseAdmin as any).from('import_batches').update({
        processed_count: (batch as any).processed_count + data.items.length,
        last_error: results.errors.length > 0 ? results.errors[0] : (batch as any).last_error
      }).eq('id', data.batchId);

      return { success: true, results };
    } catch (err: any) {
      await (supabaseAdmin as any).from('import_batches').update({ status: 'failed', last_error: err.message }).eq('id', data.batchId);
      throw err;
    }
  });

export const finishImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ batchId: z.string(), results: z.any() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from('import_batches').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', data.batchId);
    await recordAudit({ userId, action: 'import_operational_base', module: 'admin', summary: `Lote ${data.batchId} concluído.`, details: data.results });
    return { success: true };
  });

export const failImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ batchId: z.string(), error: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from('import_batches').update({ status: 'failed', last_error: data.error }).eq('id', data.batchId);
    return { success: true };
  });

export const executeImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.any().parse(data))
  .handler(async () => { throw new Error("Use batch import."); });
