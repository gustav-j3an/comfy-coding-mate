import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
        status: 'pending'
      }]);

    if (profileError) throw profileError;

    // Generate invite link for WhatsApp
    // In a real scenario, we might need a specific "reset password" or "accept invite" link
    // Supabase invite emails usually contain a hash. For WhatsApp, we might need to 
    // generate a recovery link or similar if we want a direct "set password" flow.
    // For now, we'll return the user ID and email so the frontend can display success.
    
    return { success: true, userId, email: data.email };
  });

export const updateUserStatus = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ userId: z.string(), status: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status: data.status })
      .eq('id', data.userId);

    if (error) throw error;
    
    return { success: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ userId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // The safely check is in SQL, but we call auth deletion here
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (authError) throw authError;

    return { success: true };
  });
