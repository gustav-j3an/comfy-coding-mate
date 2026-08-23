O bloqueio acontece porque o sistema está tentando abrir `api.whatsapp.com`. Para o seu computador, onde você já está logado no WhatsApp Web, ele deve abrir diretamente `web.whatsapp.com`.

O WhatsApp Web é acessado pelo domínio `web.whatsapp.com`. [WhatsApp Web](https://web.whatsapp.com/mobile/)

Cole este prompt no Lovable:

CORREÇÃO DO CONVITE MANUAL POR WHATSAPP NO COMPUTADOR

O botão de convite está abrindo:

`https://api.whatsapp.com/send/...`

No Microsoft Edge isso retorna:

`ERR_BLOCKED_BY_RESPONSE`

Corrija o fluxo para abrir diretamente o WhatsApp Web quando o Admin estiver no computador.

REGRAS

- Nunca usar `api.whatsapp.com`.
- Em computador, usar:

`https://web.whatsapp.com/send?phone=[NUMERO]&text=[MENSAGEM_CODIFICADA]`

- Abrir esse link em nova aba, acionado diretamente pelo clique do Admin.
- O número deve continuar normalizado em formato internacional, somente dígitos, por exemplo `5561992910841`.
- A mensagem deve continuar personalizada com nome do promotor e link único de acesso.
- Não enviar automaticamente: o Admin revisa e toca no botão Enviar dentro do WhatsApp Web.
- Em celular, usar:

`https://wa.me/[NUMERO]?text=[MENSAGEM_CODIFICADA]`

- Não usar API do WhatsApp, automação de navegador ou envio automático.

FALLBACK

Se a abertura do WhatsApp Web for bloqueada ou falhar:

- exibir botão `Copiar mensagem de convite`;
- exibir botão `Copiar link de acesso`;
- mostrar orientação:
  `Abra o WhatsApp Web, localize o promotor e cole a mensagem.`

TESTES

1. No Edge com WhatsApp Web já logado, clicar no convite abre a conversa do promotor.
2. A mensagem já vem preenchida.
3. O link não usa `api.whatsapp.com`.
4. Em celular, o link abre o aplicativo WhatsApp.
5. O fallback de cópia funciona.
6. Nenhum envio ocorre sem o clique final do Admin no WhatsApp.

Informe os arquivos alterados e o resultado dos seis testes.

import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { MapPin, LogIn, Info } from 'lucide-react';
import { PWAInstallButton } from '@/components/common/pwa-install-button';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: "Rota do Promotor" },
      { name: "description", content: "Sistema inteligente para gestão, roteirização e execução de operações de trade marketing." },
      { property: "og:title", content: "Rota do Promotor" },
      { property: "og:description", content: "Gestão inteligente de operações de trade marketing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') {
        navigate({ to: '/admin' });
      } else if (role === 'promoter') {
        navigate({ to: '/promoter/' as any });
      } else if (role === 'industry') {
        navigate({ to: '/industry/' as any });
      }
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200">
              <MapPin className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Rota do Promotor
          </h1>
          <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
            Sistema inteligente para gestão, roteirização e execução de operações de trade marketing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button 
            asChild
            className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Link to={user ? (role === 'admin' ? '/admin' : role === 'promoter' ? ('/promoter/' as any) : ('/industry/' as any)) : '/login'}>
              <LogIn className="h-5 w-5" />
              Entrar no sistema
            </Link>
          </Button>
          
          <PWAInstallButton />
        </div>

        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl max-w-md w-full space-y-3">
          <div className="flex items-center gap-2 text-blue-700 font-bold justify-center">
            <Info className="h-5 w-5" />
            <span>Recebeu um convite?</span>
          </div>
          <p className="text-blue-600 text-sm leading-relaxed">
            Acesse o link enviado pelo administrador via WhatsApp ou E-mail para criar sua senha e ativar sua conta.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center border-t border-slate-100">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} Rota do Promotor • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
