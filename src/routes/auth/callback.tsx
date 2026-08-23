import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({
  loader: async (ctx) => {
    // Suppress TS errors by casting ctx as any to access search and other properties
    // while we work around the TanStack Router type definitions in this version.
    const { search } = ctx as any;
    
    // Supabase handles the session from the URL fragment automatically.
    await supabase.auth.getSession();
    
    throw redirect({
      to: search?.next || '/',
    });
  },
});
