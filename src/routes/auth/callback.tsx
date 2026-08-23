import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search) => z.object({
    next: z.string().optional().catch('/')
  }).parse(search),
  loader: async (ctx) => {
    // Supabase handles the session from the URL fragment automatically.
    // We just wait for it to be ready.
    await supabase.auth.getSession();
    
    throw redirect({
      to: (ctx.search as any).next || '/',
    });
  },
});
