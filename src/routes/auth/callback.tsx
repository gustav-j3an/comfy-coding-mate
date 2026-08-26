import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      next: (search['next'] as string) || '/',
    };
  },
  component: AuthCallback,
});

function AuthCallback() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active) setError('Sessão expirada ou convite inválido.');
    }, 10000);

    const finishAuthentication = (session: unknown) => {
      if (!active || !session) return;
      window.clearTimeout(timeout);
      navigate({ to: next as any });
    };

    supabase.auth.getSession().then(({ data: { session } }) => finishAuthentication(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      finishAuthentication(session);
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [navigate, next]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-100 p-8 rounded-3xl shadow-sm space-y-4">
            <div className="text-red-600 font-bold text-xl">Ops! Algo deu errado.</div>
            <p className="text-red-500">{error}</p>
            <div className="pt-4">
              <a 
                href="/login" 
                className="inline-block bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Voltar para o Login
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 font-medium">Autenticando e preparando seu acesso...</p>
          </div>
        )}
      </div>
    </div>
  );
}
