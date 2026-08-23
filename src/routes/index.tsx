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
      <div className="hidden">
        A imagem confirma que o bloqueio agora vem do próprio WhatsApp/WebView do navegador (`ERR_BLOCKED_BY_RESPONSE`), não do botão do sistema. Não dá para “forçar” o WhatsApp Web a aceitar esse link; insistir no mesmo endereço continuará bloqueando.

        A solução mais confiável sem API é usar o **WhatsApp Desktop** quando estiver instalado e, se ele não abrir, copiar a mensagem pronta para colar manualmente no WhatsApp Web.

        Cole este prompt no Lovable:

        CORREÇÃO FINAL — WHATSAPP WEB RETORNA `ERR_BLOCKED_BY_RESPONSE`

        A abertura de:

        `https://web.whatsapp.com/send?...`

        também está sendo bloqueada com `ERR_BLOCKED_BY_RESPONSE`.

        Não tente contornar bloqueios do WhatsApp, navegador, WebView ou política de rede. Não use iframe, automação, API não oficial ou envio automático.

        SUBSTITUA O FLUXO ATUAL POR DUAS OPÇÕES EXPLÍCITAS

        Após gerar o convite seguro, mostrar um diálogo com:

        1. Botão principal: `Abrir no WhatsApp Desktop`
        - usar link de protocolo:
          `whatsapp://send?phone=[NUMERO]&text=[MENSAGEM_CODIFICADA]`
        - abrir por clique direto do Admin;
        - funciona quando o aplicativo oficial WhatsApp Desktop estiver instalado e logado.

        2. Botão secundário: `Copiar mensagem para WhatsApp Web`
        - copiar para a área de transferência a mensagem completa, incluindo o link único de acesso;
        - confirmar visualmente: `Mensagem copiada. Abra o WhatsApp Web, selecione o promotor e cole a mensagem.`
        - incluir também botão separado `Copiar somente link de acesso`.

        3. Link auxiliar: `Abrir WhatsApp Web`
        - abrir apenas:
          `https://web.whatsapp.com/`
        - sem telefone e sem texto na URL;
        - o Admin encontra a conversa do promotor e cola a mensagem já copiada.

        NÃO usar:

        - `api.whatsapp.com`;
        - `web.whatsapp.com/send`;
        - iframe;
        - popup automático;
        - envio automático;
        - URL de acesso em logs, telas permanentes ou auditoria.

        TRATAMENTO DE BLOQUEIO

        - Se o WhatsApp Desktop não estiver instalado ou não abrir, não mostrar erro técnico.
        - Exibir:
          `Não foi possível abrir o WhatsApp Desktop. Use “Copiar mensagem para WhatsApp Web”.`
        - O diálogo deve sempre manter os botões de cópia disponíveis.

        TESTES

        1. Computador com WhatsApp Desktop instalado: abre conversa com mensagem pronta.
        2. Computador sem WhatsApp Desktop: mostra fallback claro.
        3. Copiar mensagem funciona.
        4. Abrir WhatsApp Web abre somente a página normal.
        5. Admin consegue colar a mensagem e enviar manualmente.
        6. Nenhum envio é feito sem ação final do Admin.
        7. Nenhum link usa `api.whatsapp.com` ou `web.whatsapp.com/send`.

        Informe os arquivos alterados e o resultado dos sete testes.
      </div>

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
