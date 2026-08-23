import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({
  loader: async ({ search }: { search: any }) => {
    const { next } = search || {};
    
    // O Supabase Auth Helper já deve ter processado o token na URL 
    // antes deste loader rodar se estivermos no client, mas no loader
    // podemos forçar uma verificação de sessão.
    
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Se tiver sessão, redireciona para o destino solicitado ou dashboard
      throw redirect({
        to: next || '/',
      });
    }

    // Se não tiver sessão (token expirado ou inválido), vai para o login com erro
    return { error: 'Sessão expirada ou convite inválido.' };
  },
  component: AuthCallback,
});

function AuthCallback() {
  const { error } = Route.useLoaderData();

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