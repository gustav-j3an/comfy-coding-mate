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
