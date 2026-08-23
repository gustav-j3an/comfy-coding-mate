import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { recordAudit } from "./audit.server";

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
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // Verify admin role
    const { userId: adminId } = (context as any) || {};
    if (!adminId) throw new Error("Não autorizado");

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: adminId,
      _role: 'admin'
    });

    if (!isAdmin) throw new Error("Apenas administradores podem convidar usuários");

    // Get site URL from env or build preview URL
    let siteUrl = process.env['SITE_URL'];
    if (!siteUrl) {
      // Fallback for preview environments if SITE_URL is missing
      const projectId = process.env['LOVABLE_PROJECT_ID'];
      if (projectId) {
        siteUrl = `https://project--${projectId}.lovable.app`;
      } else {
        siteUrl = 'https://rota-do-promotor.lovable.app'; // Final fallback
      }
    }

    // 1. Invite user to Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: `${siteUrl}/auth/callback?next=/primeiro-acesso`,
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
    await recordAudit({
      userId: 'system',
      action: 'invite_user',
      module: 'users',
      entityType: 'user',
      entityId: userId,
      summary: `Usuário convidado: ${data.email} com papel ${data.role}`,
      details: { email: data.email, role: data.role }
    });
    
    return { success: true, userId, email: data.email };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ userId: z.string(), email: z.string().email() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // Verify admin role
    const { userId: adminId } = (context as any) || {};
    if (!adminId) throw new Error("Não autorizado");

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: adminId,
      _role: 'admin'
    });

    if (!isAdmin) throw new Error("Apenas administradores podem reenviar convites");

    // Get site URL
    let siteUrl = process.env['SITE_URL'];
    if (!siteUrl) {
      const projectId = process.env['LOVABLE_PROJECT_ID'];
      if (projectId) siteUrl = `https://project--${projectId}.lovable.app`;
      else siteUrl = 'https://rota-do-promotor.lovable.app';
    }

    // Resend invite (this invalidates the previous one)
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: `${siteUrl}/auth/callback?next=/primeiro-acesso`,
      }
    );

    if (inviteError) throw inviteError;

    // Record audit log
    await recordAudit({
      userId: adminId,
      action: 'resend_invite',
      module: 'users',
      entityType: 'user',
      entityId: data.userId,
      summary: `Convite reenviado para: ${data.email}`,
      details: data
    });
    
    return { success: true };
  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // Get site URL
    let siteUrl = process.env['SITE_URL'];
    if (!siteUrl) {
      const projectId = process.env['LOVABLE_PROJECT_ID'];
      if (projectId) siteUrl = `https://project--${projectId}.lovable.app`;
      else siteUrl = 'https://rota-do-promotor.lovable.app';
    }

    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: data.email,
      options: {
        redirectTo: `${siteUrl}/auth/reset-password`,
      }
    });

    if (error) throw error;

    const { userId: adminId } = (context as any) || {};
    
    // Record audit log
    await recordAudit({
      userId: adminId || 'system',
      action: 'request_password_reset',
      module: 'users',
      entityType: 'user',
      entityId: data.email,
      summary: `Redefinição de acesso solicitada para: ${data.email}`,
      details: data
    });
    
    return { success: true };
  });

export const updateUserStatus = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ userId: z.string(), status: z.enum(['active', 'blocked', 'pending']) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status: data.status as any })
      .eq('id', data.userId);

    if (error) throw error;

    const { userId: currentAdminId } = (context as any) || {};

    // Record audit log
    await recordAudit({
      userId: currentAdminId || 'system',
      action: 'update_user_status',
      module: 'users',
      entityType: 'user',
      entityId: data.userId,
      summary: `Status do usuário ${data.userId} alterado para ${data.status}`,
      details: data
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
