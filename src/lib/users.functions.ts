import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { recordAuditLog } from "./audit.functions";

const inviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(['admin', 'promoter', 'industry']),
  promoterId: z.string().optional(),
  industryId: z.string().optional(),
  redirectTo: z.string().optional(),
});

export const inviteUser = createServerFn({ method: "POST" })
  .inputValidator((data) => inviteUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // 1. Invite user to Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: data.redirectTo || `${process.env['SITE_URL'] || 'http://localhost:8080'}/auth/callback`,
        data: {
          full_name: data.fullName,
        }
      }
    );

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Assign Role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{ user_id: userId, role: data.role }]);

    if (roleError) throw roleError;

    // 3. Create/Update Profile with linked entity
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([{
        id: userId,
        full_name: data.fullName,
        email: data.email,
        promoter_id: data.promoterId || null,
        industry_id: data.industryId || null,
        status: 'pending' as any
      }]);

    if (profileError) throw profileError;

    // Record audit log
    await recordAuditLog({
      data: {
        action: 'invite_user',
        module: 'users',
        entityType: 'user',
        entityId: userId,
        summary: `Usuário convidado: ${data.email} com papel ${data.role}`,
        details: { email: data.email, role: data.role }
      },
      context: { userId: 'system' } // Fallback, context injection happens in handler
    } as any);
    
    return { success: true, userId, email: data.email };
  });

export const updateUserStatus = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ userId: z.string(), status: z.enum(['active', 'blocked', 'pending']) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status: data.status as any })
      .eq('id', data.userId);

    if (error) throw error;

    // Record audit log
    await recordAuditLog({
      data: {
        action: 'update_user_status',
        module: 'users',
        entityType: 'user',
        entityId: data.userId,
        summary: `Status do usuário ${data.userId} alterado para ${data.status}`,
        details: data
      },
      context
    });
    
    return { success: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ userId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (authError) throw authError;

    return { success: true };
  });
