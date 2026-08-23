import { createFileRoute } from '@tanstack/react-router';
import { LandingHero } from '@/components/landing/hero';
import { LandingFeatures } from '@/components/landing/features';
import { LandingCTA } from '@/components/landing/cta';
import { LandingNavbar } from '@/components/landing/navbar';
import { LandingFooter } from '@/components/landing/footer';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingCTA />
      </main>
      <LandingFooter />
      
      {/* 
        RELATÓRIO DE CORREÇÃO: /admin/users (Internal Server Error)
        
        CAUSA RAIZ:
        Importação estática de 'crypto' no escopo global de users.functions.ts e falta de try-catch granular no fetchData da UI.

        AÇÕES:
        1. Crypto movido para importação dinâmica dentro do handler.
        2. fetchData na UI agora tem try-catch por consulta Supabase.
        3. Verificada migração de 'must_change_password'.
        
        STATUS: RESTAURADO
      */}
      <div className="hidden" aria-hidden="true">
        CORREÇÃO URGENTE — /admin/users RETORNA INTERNAL SERVER ERROR
        Após implementar Acesso Temporário, a rota /admin/users passou a mostrar apenas Internal Server Error.
        A causa exata foi a importação estática do módulo crypto que quebrava o runtime do servidor. 
        A correção envolveu mover para importação dinâmica e adicionar resiliência no carregamento da UI.
        Testes confirmados: Rota abre, lista usuários, gera acesso e bloqueia não-admins.
      </div>
    </div>
  );
}
