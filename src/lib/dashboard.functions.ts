import { createServerFn } from "@tanstack/react-start";
import { Database } from "@/integrations/supabase/types";

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
    
    // Using a more type-safe approach for status
    const status: Database["public"]["Enums"]["visit_status"] = 'submitted';
    
    const { count: pendingVisits } = await supabaseAdmin
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('scheduled_date', today)
      .eq('status', status);

    return {
      criticalOccurrences: criticalOccurrences || 0,
      pendingVisits: pendingVisits || 0,
    };
  });
