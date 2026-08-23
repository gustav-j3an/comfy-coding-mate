import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({
  loader: async ({ search }) => {
    const { next } = search as { next?: string };
    
    // The Supabase client will automatically handle the code/token in the URL
    // during initial load (in the background). We just need to wait for it.
    const { data: { session } } = await supabase.auth.getSession();
    
    // Redirect to the intended destination or default to root
    throw redirect({
      to: next || '/',
    });
  },
});
