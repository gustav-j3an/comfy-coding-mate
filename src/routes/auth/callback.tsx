import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      next: (search['next'] as string) || '/',
    };
  },
  loader: async ({ search }: { search: { next: string } }) => {
    // Supabase handles the session from the URL fragment automatically.
    // We just wait for it to be ready.
    await supabase.auth.getSession();
    
    throw redirect({
      to: search.next,
    });
  },
});
