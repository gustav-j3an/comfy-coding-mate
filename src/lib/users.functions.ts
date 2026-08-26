import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { recordAudit } from "./audit.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPublicAppUrl } from "./app-config";


const inviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(['admin', 'promoter', 'industry']),
  promoterId: z.string().optional(),
  industryId: z.string().optional(),
});

function getAuthRedirectTo() {
  return `${getPublicAppUrl()}/auth/callback?next=/primeiro-acesso`;
}

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

    // Use getPublicAppUrl() as the source of truth for the site URL
    const redirectTo = getAuthRedirectTo();

    // 1. Invite user to Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo,
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
  .middleware([requireSupabaseAuth])
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
    const redirectTo = getAuthRedirectTo();

    // Try to resend the invite (this invalidates the previous one)
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo,
      }
    );

    let mode: 'invite' | 'recovery' = 'invite';

    if (inviteError) {
      const alreadyRegistered = /already been registered|already registered|email_exists/i.test(
        inviteError.message || ''
      );
      if (!alreadyRegistered) throw inviteError;

      // User already exists: send a password-set (recovery) email instead.
      const { createClient } = await import('@supabase/supabase-js');
      const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
      const publicClient = createClient(process.env['SUPABASE_URL']!, key, {
        auth: { persistSession: false },
        global: {
          fetch: (input: any, init: any) => {
            const h = new Headers(init?.headers);
            if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
            h.set('apikey', key);
            return fetch(input, { ...init, headers: h });
          },
        },
      });

      const { error: recoveryError } = await publicClient.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      });

      if (recoveryError) {
        const rateLimited = /rate limit/i.test(recoveryError.message || '');
        if (rateLimited) {
          throw new Error('Limite de e-mails do Supabase atingido. Aguarde antes de reenviar o convite.');
        }
        throw recoveryError;
      }
      mode = 'recovery';
    }


    // Record audit log
    await recordAudit({
      userId: adminId,
      action: mode === 'invite' ? 'resend_invite' : 'request_password_reset',
      module: 'users',
      entityType: 'user',
      entityId: data.userId,
      summary: mode === 'invite'
        ? `Convite reenviado para: ${data.email}`
        : `E-mail de definição de senha enviado para: ${data.email}`,
      details: data
    });
    
    return { success: true, mode };


  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // Get site URL
    const redirectTo = getAuthRedirectTo();

    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: data.email,
      options: {
        redirectTo,
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

export const sendPasswordResetEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data }) => {
    const redirectTo = getAuthRedirectTo();
    const { createClient } = await import('@supabase/supabase-js');
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    const supabaseUrl = process.env['SUPABASE_URL'];

    if (!key || !supabaseUrl) {
      throw new Error('Configuração do Supabase não disponível no servidor.');
    }

    const publicClient = createClient(supabaseUrl, key, {
      auth: { persistSession: false },
    });
    const { error } = await publicClient.auth.resetPasswordForEmail(data.email, {
      redirectTo,
    });

    if (error) throw error;
    return { success: true };
  });

export const updateUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (authError) throw authError;

    return { success: true };
  });

export const generateWhatsAppInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ 
    userId: z.string(),
    email: z.string().email(),
    promoterId: z.string() 
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // 1. Verify admin role
    const { userId: adminId } = (context as any) || {};
    if (!adminId) throw new Error("Não autorizado");

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: adminId,
      _role: 'admin'
    });

    if (!isAdmin) throw new Error("Apenas administradores podem gerar links de WhatsApp");

    // 2. Get promoter data and phone
    const { data: promoter, error: promoterError } = await supabaseAdmin
      .from('promoters')
      .select('name, phone')
      .eq('id', data.promoterId)
      .single();

    if (promoterError || !promoter) throw new Error("Promotor não encontrado ou erro ao buscar dados");
    
    if (!promoter.phone) throw new Error("Promotor não possui telefone cadastrado");

    // 3. Normalize phone (digits only, Brazil 55 prefix)
    const digitsOnly = promoter.phone.replace(/\D/g, '');
    let normalizedPhone = digitsOnly;
    
    // Regra: manter somente dígitos no telefone, com 55 + DDD + número
    if (digitsOnly.length === 10 || digitsOnly.length === 11) {
      normalizedPhone = '55' + digitsOnly;
    } else if (digitsOnly.length > 11 && digitsOnly.startsWith('55')) {
      normalizedPhone = digitsOnly;
    } else {
      // Fallback: se tiver DDD mas não tiver 55 no início, adiciona 55
      normalizedPhone = '55' + digitsOnly.slice(-11);
    }

    if (normalizedPhone.length < 12) {
      throw new Error(`Telefone inválido para convite WhatsApp: ${promoter.phone}. Use DDD + Número.`);
    }

    // 4. Get site URL
    const redirectTo = getAuthRedirectTo();

    // 5. Generate Link
    // We'll use 'recovery' as it's the safest way to get a single-use link that forces password creation
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: data.email,
      options: { redirectTo },
    });

    if (linkError) throw linkError;

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) throw new Error("Não foi possível gerar o link de acesso");

    const message = `Olá, ${promoter.name}! 👋\n\nSeu acesso ao *Rota do Promotor* está pronto.\n\nPara criar sua senha e entrar no aplicativo, toque no link abaixo:\n\n${actionLink}\n\nDepois de entrar, você poderá consultar seu roteiro e instalar o aplicativo na tela inicial do celular.`;
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

    // 6. Record audit log
    await recordAudit({
      userId: adminId,
      action: 'generate_whatsapp_invite',
      module: 'users',
      entityType: 'user',
      entityId: data.userId,
      summary: `Link de WhatsApp gerado para promotor: ${promoter.name}`,
      details: { email: data.email, phone: normalizedPhone }
    });

    return { 
      success: true, 
      whatsappUrl,
      message,
      phone: normalizedPhone, 
      promoterName: promoter.name 
    };
  });

export const generateTemporaryAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ 
    userId: z.string(),
    email: z.string().email(),
    promoterId: z.string() 
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // 1. Verify admin role
    const { userId: adminId } = (context as any) || {};
    if (!adminId) throw new Error("Não autorizado");

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: adminId,
      _role: 'admin'
    });

    if (!isAdmin) throw new Error("Apenas administradores podem gerar acesso temporário");

    // 2. Get promoter data
    const { data: promoter, error: promoterError } = await supabaseAdmin
      .from('promoters')
      .select('name, phone')
      .eq('id', data.promoterId)
      .single();

    if (promoterError || !promoter) throw new Error("Promotor não encontrado");

    // 3. Generate random password (16 chars for strength)
    const { randomBytes } = await import('crypto');
    const tempPassword = randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    if (tempPassword.length < 12) throw new Error("Falha ao gerar senha segura");

    // 4. Update Supabase Auth password
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      data.userId,
      { 
        password: tempPassword,
        email_confirm: true 
      }
    );

    if (authError) throw authError;

    // 5. Update Profile flag
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true } as any)
      .eq('id', data.userId);

    if (profileError) throw profileError;

    // 6. Record audit log
    await recordAudit({
      userId: adminId,
      action: 'generate_temp_access',
      module: 'users',
      entityType: 'user',
      entityId: data.userId,
      summary: `Acesso temporário gerado para o promotor: ${promoter.name}`,
      details: { email: data.email, adminId }
    });

    return { 
      success: true, 
      email: data.email
    };
  });

export const changePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ 
    newPassword: z.string().min(8) 
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { userId } = (context as any) || {};
    
    if (!userId) throw new Error("Não autorizado");

    // 1. Update Auth password
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: data.newPassword }
    );

    if (authError) throw authError;

    // 2. Clear flag in profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: false } as any)
      .eq('id', userId);

    if (profileError) throw profileError;

    // 3. Record audit
    await recordAudit({
      userId: userId,
      action: 'change_password_mandatory',
      module: 'users',
      entityType: 'user',
      entityId: userId,
      summary: `Senha obrigatória alterada pelo usuário`,
      details: { userId }
    });

    return { success: true };
  });
