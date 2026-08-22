import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Briefing,
});

function Briefing() {
  return (
    <div className="p-8 max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed text-slate-800">
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
  );
}
