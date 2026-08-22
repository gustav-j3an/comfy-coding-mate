import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Briefing,
});

function Briefing() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') navigate({ to: '/admin' });
      else if (role === 'promoter') navigate({ to: '/promoter' });
      else if (role === 'industry') navigate({ to: '/industry' });
      else navigate({ to: '/admin' });
    }
  }, [user, role, loading, navigate]);

  if (loading) return null;

  if (user) return <div className="flex items-center justify-center min-h-screen font-sans">Redirecionando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200">
            <MapPin className="h-12 w-12 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Rota do Promotor</h1>
          <p className="text-slate-500 text-lg">Sistema de Gestão de Trade Marketing</p>
        </div>
        
        <div className="pt-4">
          <Link to="/admin">
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95">
              Acessar Sistema
            </Button>
          </Link>
        </div>

        <p className="text-sm text-slate-400">
          Acesso restrito a usuários autorizados.
        </p>
      </div>

      <div className="mt-20 p-8 max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed text-slate-300 text-[10px] border-t border-slate-200 opacity-50">
        Implemente o processo real de criação da primeira conta de administrador.

Situação atual:
A tela de login existe, mas ainda não há nenhum usuário para acessar o sistema.

Criar fluxo de “Primeiro acesso”:

- Criar rota `/primeiro-acesso`.
- Essa rota só pode ficar disponível enquanto não existir nenhuma conta ativa com perfil administrador.
- Quando já existir um administrador, bloquear essa rota e redirecionar para a tela de login.
- Não usar conta falsa, login simulado ou dados apenas visuais. Usar Supabase Auth real.

Tela “Criar conta do administrador inicial”:
- Nome completo;
- E-mail;
- Senha;
- Confirmar senha;
- Botão “Criar minha conta de administrador”.
- Validar senha forte.
- Criar usuário no Supabase Auth.
- Criar automaticamente o perfil com função `administrador`.
- Confirmar e-mail, conforme a configuração do Supabase.
- Após criar a conta, redirecionar para `/admin`.
- Exibir mensagem clara de sucesso.

Na tela de login:
- Enquanto não existir nenhum administrador, exibir discretamente o link:
  “Primeiro acesso? Criar conta do administrador inicial”.
- Depois que o primeiro administrador for criado, remover esse link definitivamente.
- Manter “Não possui acesso? Solicite seu cadastro ao administrador.” apenas como texto; não criar cadastro público.

Criar uma verificação segura no banco:
- Só pode existir criação aberta do primeiro administrador quando a contagem de administradores for zero.
- Assim que o primeiro administrador existir, bloquear permanentemente o cadastro inicial.
- Somente administradores autenticados podem convidar novos promotores, usuários de indústria ou outros administradores.

Antes de finalizar:
- Testar o fluxo de criar administrador inicial;
- testar login com esse administrador;
- confirmar que ele é redirecionado ao painel `/admin`;
- confirmar que a rota `/primeiro-acesso` fica bloqueada depois da criação.
      </div>
    </div>
  );
}
