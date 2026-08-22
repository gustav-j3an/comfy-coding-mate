import { createServerFn } from "@tanstack/react-start";

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
    const today = new Date().toISOString().split('T')[0];
    const { count: pendingVisits } = await supabaseAdmin
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('scheduled_date', today)
      .eq('status', 'submitted');

    return {
      criticalOccurrences: criticalOccurrences || 0,
      pendingVisits: pendingVisits || 0,
    };
  });
