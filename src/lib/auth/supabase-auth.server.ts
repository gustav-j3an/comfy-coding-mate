import { createClient } from '@supabase/supabase-js';

/**
 * requireSupabaseAuth for TanStack Start server functions and routes.
 * Decodes the session from the Authorization header or cookies.
 */
export async function requireSupabaseAuth({ request }: { request: Request }) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  
  // 1. Get token from Authorization header (for server functions/API)
  let token = request.headers.get('Authorization')?.split('Bearer ')[1];
  
  // 2. Fallback to cookies (for browser requests to API routes)
  if (!token) {
    const cookie = request.headers.get('Cookie');
    if (cookie) {
      // Very basic cookie parsing for the access token
      // In a real app, use a proper cookie library
      const match = cookie.match(/sb-[a-z0-9]+-auth-token=([^;]+)/);
      if (match) {
        try {
          const session = JSON.parse(decodeURIComponent(match[1]));
          token = session.access_token;
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  if (!token) {
    throw new Error('Unauthorized');
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  // Fetch session-like object for compatibility
  return {
    user,
    session: { user, access_token: token }
  };
}
