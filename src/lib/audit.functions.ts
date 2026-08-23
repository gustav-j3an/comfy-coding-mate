import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Audit Log retrieval for the UI.
 * Writing logs is handled via recordAudit in audit.server.ts.
 */

export const getAuditLogs = createServerFn({ method: "GET" })
  .inputValidator((data: any) => z.object({
    page: z.number().default(1),
    pageSize: z.number().default(20),
    filters: z.object({
      userId: z.string().optional(),
      module: z.string().optional(),
      action: z.string().optional(),
      result: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      search: z.string().optional(),
    }).optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as any;

    if (!userId) throw new Error("Unauthorized");

    // Double check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!roleData) throw new Error("Access denied: Admins only");

    let query = supabaseAdmin
      .from('admin_audit_logs' as any)
      .select('*', { count: 'exact' });

    if (data.filters?.userId) query = query.eq('user_id', data.filters.userId);
    if (data.filters?.module) query = query.eq('module', data.filters.module);
    if (data.filters?.action) query = query.eq('action', data.filters.action);
    if (data.filters?.result) query = query.eq('result', data.filters.result);
    if (data.filters?.startDate) query = query.gte('created_at', data.filters.startDate);
    if (data.filters?.endDate) query = query.lte('created_at', data.filters.endDate);
    
    if (data.filters?.search) {
      query = query.or(`summary.ilike.%${data.filters.search}%,user_email.ilike.%${data.filters.search}%,entity_id.ilike.%${data.filters.search}%`);
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      logs: logs || [],
      totalCount: count || 0,
      page: data.page,
      pageSize: data.pageSize
    };
  });
