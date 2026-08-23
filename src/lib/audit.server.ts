import { z } from "zod";

/**
 * Server-only helper to record audit logs.
 * Import this ONLY in .server files or inside .handler() of createServerFn.
 */

export async function recordAudit(params: {
  userId: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  details?: any;
  result?: string;
  request?: Request;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  
  let ip = null;
  let userAgent = null;
  
  if (params.request) {
    ip = params.request.headers.get('x-forwarded-for') || params.request.headers.get('x-real-ip');
    userAgent = params.request.headers.get('user-agent');
  }

  // Get user profile info if not provided
  let email = params.userEmail;
  let role = params.userRole;

  if (!email || !role) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, user_roles(role)')
      .eq('id', params.userId)
      .single();
    
    if (profile) {
      email = profile.email;
      role = (profile as any).user_roles?.[0]?.role || 'unknown';
    }
  }

  const { error } = await supabaseAdmin
    .from('admin_audit_logs' as any)
    .insert({
      user_id: params.userId,
      user_email: email,
      user_role: role,
      action: params.action,
      module: params.module,
      entity_type: params.entityType,
      entity_id: params.entityId,
      summary: params.summary,
      details: params.details,
      result: params.result || 'success',
      ip_address: ip || undefined,
      user_agent: userAgent || undefined
    } as any);

  if (error) {
    console.error("Failed to record audit log:", error);
  }
}
