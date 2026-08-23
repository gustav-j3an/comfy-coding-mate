import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side helper to record audit logs.
 * This file is BROWSERSAFE to import because it only exports createServerFn wrappers,
 * but the actual implementation will use supabaseAdmin.
 */

export const recordAuditLog = createServerFn({ method: "POST" })
  .inputValidator((data: any) => z.object({
    action: z.string(),
    module: z.string(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    summary: z.string().optional(),
    details: z.record(z.any()).optional(),
    result: z.string().default('success'),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    
    const { userId } = context as any;
    if (!userId) return { success: false, error: "Unauthorized" };

    const request = getRequest();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    // Get user profile info for the log
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, user_roles(role)')
      .eq('id', userId)
      .single();

    const role = (profile as any)?.user_roles?.[0]?.role || 'unknown';

    const { error } = await supabaseAdmin
      .from('admin_audit_logs' as any)
      .insert({
        user_id: userId,
        user_email: profile?.email,
        user_role: role,
        action: data.action,
        module: data.module,
        entity_type: data.entityType,
        entity_id: data.entityId,
        summary: data.summary,
        details: data.details,
        result: data.result,
        ip_address: ip,
        user_agent: userAgent
      } as any);

    if (error) {
      console.error("Failed to record audit log:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  });

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
