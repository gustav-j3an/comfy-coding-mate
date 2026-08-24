import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPromoterVisitExecution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    visitId: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado");

    // 1. Resolve promoter_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('promoter_id')
      .eq('id', userId)
      .single();
    
    if (!profile?.promoter_id) {
      throw new Error("Usuário não vinculado a um promotor.");
    }

    // 2. Fetch visit with details
    const { data: visit, error: visitError } = await supabaseAdmin
      .from('visits')
      .select(`
        *,
        store:stores(*),
        industry:industries(*),
        route_stop:route_stops(
          *,
          stop_tasks(
            industry:industries(*)
          )
        )
      `)
      .eq('id', data.visitId)
      .single();

    if (visitError || !visit) {
      throw new Response("Visita não encontrada", { status: 404 });
    }

    if (visit.promoter_id !== profile.promoter_id) {
      throw new Response("Acesso negado a esta visita", { status: 403 });
    }

    // 3. Normalize industries from route_stop tasks
    const routeStop = (visit as any).route_stop;
    const tasks = routeStop?.stop_tasks || [];
    const industries = tasks.map((t: any) => t.industry).filter(Boolean);

    // If for some reason the industries array is empty, fallback to the industry_id on the visit
    if (industries.length === 0 && visit.industry) {
      industries.push(visit.industry);
    }

    // 4. Return normalized data
    return {
      visit: {
        id: visit.id,
        status: visit.status,
        scheduled_date: visit.scheduled_date,
        observation: visit.observation,
        checkin_at: visit.checkin_at,
        checkout_at: visit.checkout_at,
        industry_id: visit.industry_id
      },
      store: visit.store,
      industries: industries,
      evidences: [], // Missions E2/E3 will handle this
      occurrences: [] // Missions E2/E3 will handle this
    };
  });
