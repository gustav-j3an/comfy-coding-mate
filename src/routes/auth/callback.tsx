import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      next: (search.next as string) || '/',
    };
  },
  loader: async ({ context, search }) => {
    // Supabase JS client handles the fragment (#access_token=...) automatically
    // during session initialization. We just need to ensure the session is loaded.
    const { data: { session } } = await supabase.auth.getSession();
    
    throw redirect({
      to: search.next,
    });
  },
});
