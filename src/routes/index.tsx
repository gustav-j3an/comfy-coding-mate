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
        O bloqueio provavelmente não é mais do WhatsApp: o navegador bloqueia quando o sistema tenta abrir uma nova aba **depois** de esperar a geração do convite no servidor. Para o navegador, isso parece um pop-up automático.

        A solução é não abrir o WhatsApp automaticamente após o carregamento. Primeiro o sistema gera o link; depois mostra um botão real para você clicar: **Abrir conversa no WhatsApp Web**.

        Cole este prompt no Lovable:

        CORREÇÃO DEFINITIVA — NAVEGADOR BLOQUEIA A ABERTURA DO WHATSAPP WEB

        O convite por WhatsApp continua sendo bloqueado.

        Não use `window.open()` automaticamente após `await`, resposta de servidor, timeout ou qualquer operação assíncrona. O navegador trata isso como pop-up e pode bloquear.

        IMPLEMENTE ESTE FLUXO:

        1. Admin clica em `Gerar convite por WhatsApp`.
        2. O backend gera o link seguro.
        3. A interface mostra um diálogo de confirmação com:
           - nome do promotor;
           - telefone parcialmente mascarado;
           - mensagem pronta;
           - botão real:
             `Abrir conversa no WhatsApp Web`;
           - botões:
             `Copiar mensagem` e `Copiar link de acesso`.
        4. O botão “Abrir conversa no WhatsApp Web” deve ser um link HTML real, não `window.open`:
           - `href="https://web.whatsapp.com/send?phone=[NUMERO]&text=[MENSAGEM]"`
           - `target="_blank"`
           - `rel="noopener noreferrer"`
5. O Admin clica diretamente nesse link para abrir a conversa.
6. Em celular, apresente link real para:
   - `https://wa.me/[NUMERO]?text=[MENSAGEM]`

REGRAS

- Remova qualquer referência a `api.whatsapp.com`.
- Não abra WhatsApp automaticamente.
- Não use iframe.
- Não use popup automático.
- Não use automação de navegador ou API.
- Preserve a geração segura do link de acesso no backend.
- O Admin continua sendo responsável pelo clique final de envio no WhatsApp.

TESTE NO SITE PUBLICADO

1. Gere convite para promotor.
2. Confirme que o diálogo aparece.
3. Clique em “Abrir conversa no WhatsApp Web”.
4. Confirme que abre nova aba em `web.whatsapp.com`, não `api.whatsapp.com`.
5. Confirme que a conversa e a mensagem aparecem.
6. Teste os botões de cópia.
7. Confirme que o mesmo fluxo funciona sem pop-up bloqueado.

Não declare concluído sem testar no domínio publicado e informar a URL aberta, sem incluir token.
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
