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
        Melhore a autenticação e a tela de login do sistema.

Regra de segurança:
Não permitir cadastro público com escolha de perfil. Nenhuma pessoa pode criar sozinha uma conta de administrador, promotor ou indústria.

Modelo de acesso:
- O primeiro administrador do sistema deve ser criado manualmente na configuração inicial.
- Depois disso, somente administradores podem criar, convidar, editar, bloquear, reativar ou remover acessos.
- Promotores e usuários de indústria devem receber um convite por e-mail para criar a própria senha.
- Após realizar login, cada usuário deve ser redirecionado automaticamente para o painel do seu perfil.

Criar uma área administrativa chamada “Usuários e acessos”.

Nesta área, o administrador deve poder:
- listar todos os usuários;
- pesquisar por nome, e-mail, perfil e status;
- criar convite para novo usuário;
- escolher perfil: administrador, promotor ou indústria;
- informar nome completo e e-mail;
- para promotor, vincular ao cadastro de promotor;
- para indústria, vincular obrigatoriamente a uma indústria específica;
- reenviar convite;
- bloquear acesso;
- reativar acesso;
- alterar e-mail;
- redefinir senha por envio de e-mail;
- visualizar data do último acesso;
- visualizar status: convite pendente, ativo, bloqueado.

Fluxo de convite:
- administrador clica em “Convidar usuário”;
- preenche nome, e-mail e perfil;
- sistema envia e-mail seguro de convite;
- usuário abre o link;
- cria a senha;
- conta fica ativa;
- ao entrar, é direcionado conforme o perfil:
  - promotor: /promotor;
  - administrador: /admin;
  - indústria: /industria.

Melhorar a tela de login atual:
- manter título “Rota do Promotor”;
- usar um visual moderno, profissional e adequado ao celular;
- incluir ícone/logo simples de rota ou localização;
- campos E-mail e Senha;
- botão para mostrar/ocultar senha;
- checkbox “Lembrar meu acesso”;
- link “Esqueci minha senha”;
- botão principal “Entrar”;
- abaixo, texto: “Não possui acesso? Solicite seu cadastro ao administrador.”
- não mostrar botão de cadastro público;
- mostrar mensagens claras para senha inválida, usuário bloqueado, convite pendente e erro de conexão;
- adicionar tela de criação de senha pelo convite;
- adicionar tela de recuperação de senha por e-mail.

Usar Supabase Auth para login, convite, recuperação de senha e gerenciamento de sessão. Garantir que cada usuário só consiga acessar dados permitidos pelo seu perfil.
      </div>
    </div>
  );
}
