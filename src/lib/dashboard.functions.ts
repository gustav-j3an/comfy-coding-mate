import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get count of critical occurrences
    const { count: criticalOccurrences } = await supabaseAdmin
      .from('occurrences')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical')
      .eq('status', 'open');

    // Get count of submitted visits today
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const { count: pendingVisits } = await supabaseAdmin
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .filter('scheduled_date', 'eq', today)
      .filter('status', 'eq', 'submitted');

    return {
      criticalOccurrences: (criticalOccurrences as number) || 0,
      pendingVisits: (pendingVisits as number) || 0,
    };
  });

export const exportVisitReport = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    industryId: z.string(),
    month: z.number(),
    year: z.number()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // In a real scenario, this would use a library like jspdf or a specialized service.
    // For this implementation, we'll fetch the data and return a structured summary.
    
    const startDate = new Date(data.year, data.month - 1, 1).toISOString();
    const endDate = new Date(data.year, data.month, 0).toISOString();

    const { data: visits, error } = await supabaseAdmin
      .from('visits')
      .select(`
        *,
        store:stores(name),
        executor:profiles(full_name),
        evidences:visit_evidence(*)
      `)
      .eq('industry_id', data.industryId)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate);

    if (error) throw error;

    return {
      reportId: `REP-${data.industryId.slice(0,4)}-${data.month}-${data.year}`,
      generatedAt: new Date().toISOString(),
      visitCount: visits?.length || 0,
      visits: visits || []
    };
  });
