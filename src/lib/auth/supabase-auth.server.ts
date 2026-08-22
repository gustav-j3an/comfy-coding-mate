/**
 * requireSupabaseAuth for TanStack Start server functions and routes.
 * Decodes the session from the Authorization header or cookies.
 */
export async function requireSupabaseAuth({ request }: { request: Request }) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  
  // 1. Get token from Authorization header (for server functions/API)
  let token = '';
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const parts = authHeader.split('Bearer ');
    if (parts.length > 1 && parts[1]) {
      token = parts[1];
    }
  }
  
  // 2. Fallback to cookies (for browser requests to API routes)
  if (!token) {
    const cookie = request.headers.get('Cookie');
    if (cookie) {
      const match = cookie.match(/sb-[a-z0-9]+-auth-token=([^;]+)/);
      if (match) {
        try {
          const cookieVal = decodeURIComponent(match[1]);
          const session = JSON.parse(cookieVal);
          if (session && typeof session.access_token === 'string') {
            token = session.access_token;
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  if (!token) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return {
    user: data.user,
    session: { user: data.user, access_token: token }
  };
}
