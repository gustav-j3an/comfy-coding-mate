import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const searchSchema = z.object({
  next: z.string().optional().catch('/')
});

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async ({ search }) => {
    // Supabase handles the session from the URL fragment automatically.
    // We just wait for it to be ready.
    await supabase.auth.getSession();
    
    throw redirect({
      to: (search as any).next || '/',
    });
  },
});
