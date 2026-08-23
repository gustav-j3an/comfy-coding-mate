import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      next: (search['next'] as string) || '/',
    };
  },
  loader: async ({ search }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    throw redirect({
      to: search.next,
    });
  },
});
