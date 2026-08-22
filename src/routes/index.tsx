import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router';
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
Ótimo — a Missão 0 resolveu exatamente o bloqueio principal. Agora o dashboard e as telas passam a usar relações reais, não apenas cartões visuais.

Vamos para a Missão 1: fazer os três cadastros fundamentais funcionarem de ponta a ponta. Sem isso, não há como montar rotas reais.

Envie este comando ao Lovable:

MISSÃO 1 — Cadastros reais de Promotores, Lojas e Indústrias.

Objetivo:
Fazer os módulos de cadastro funcionarem completamente com Supabase: criar, listar, pesquisar, editar, inativar e excluir com segurança.

Não criar ainda roteiros, cobranças ou exportações nesta missão.

REGRAS GERAIS:
- Todos os formulários devem gravar dados reais no Supabase.
- Após criar ou editar, atualizar a lista automaticamente.
- Exibir mensagem clara de sucesso ou erro.
- Usar confirmação antes de excluir.
- Nunca usar dados falsos quando já existirem dados reais.
- Dados de teste devem permanecer identificados e não podem ser apagados acidentalmente por ações normais.
- Proteger todos os módulos para acesso exclusivo de administradores.

1. MÓDULO PROMOTORES

Criar tela funcional de listagem com:
- nome;
- telefone;
- e-mail;
- região;
- status ativo/inativo;
- usuário de login vinculado, quando existir;
- quantidade de visitas da semana;
- última atividade.

Criar botão “Novo promotor” com formulário:
- nome completo obrigatório;
- telefone obrigatório;
- e-mail;
- região/cidade;
- observação;
- status ativo/inativo.

Ações por promotor:
- visualizar detalhes;
- editar;
- inativar/reativar;
- excluir;
- criar rota;
- visualizar roteiro;
- convidar para acesso, caso ainda não possua usuário vinculado.

Regras:
- Promotor pode ser cadastrado antes de ter login.
- O login será vinculado posteriormente no módulo Usuários e Acessos.
- Se o promotor já possuir visitas, roteiros ou evidências, bloquear exclusão definitiva e oferecer inativação.
- Se o promotor não possuir vínculos, permitir exclusão definitiva após confirmação.

2. MÓDULO LOJAS

Criar listagem funcional com:
- nome da loja;
- endereço resumido;
- cidade/UF;
- status;
- quantidade de indústrias vinculadas;
- quantidade de visitas no mês.

Botão “Nova loja” com formulário:
- nome da loja obrigatório;
- endereço;
- número;
- complemento;
- bairro;
- cidade;
- estado;
- CEP;
- latitude;
- longitude;
- observação;
- status ativo/inativo.

Ações:
- visualizar detalhes;
- editar;
- inativar/reativar;
- excluir com confirmação.

Regras:
- Se houver visitas ou roteiros associados, bloquear exclusão definitiva e oferecer inativação.
- Exibir motivo claro quando a exclusão for bloqueada.

3. MÓDULO INDÚSTRIAS

Criar listagem funcional com:
- nome;
- CNPJ, quando informado;
- contato principal;
- e-mail;
- telefone;
- status;
- quantidade de lojas atendidas;
- quantidade de visitas no mês.

Botão “Nova indústria” com formulário:
- nome obrigatório;
- CNPJ opcional;
- nome do contato principal;
- e-mail;
- telefone;
- observação;
- status ativo/inativo.

Ações:
- visualizar detalhes;
- editar todos os dados;
- inativar/reativar;
- excluir com confirmação;
- acessar visão da indústria;
- convidar usuário da indústria.

Regras:
- Se houver visitas, roteiros, ocorrências, relatórios ou cobranças vinculadas, bloquear exclusão definitiva e oferecer inativação.
- Não limitar a ação a somente ativar/inativar: a edição completa deve funcionar.

4. QUALIDADE E TESTES

Implementar:
- pesquisa por nome;
- filtros por status;
- paginação ou carregamento progressivo, caso necessário;
- formulário com validação de campos obrigatórios;
- evitar e-mails duplicados quando houver vínculo de usuário;
- tratamento amigável de erro;
- estado vazio com botão para criar o primeiro registro.

Teste obrigatório:
- criar, editar e inativar um promotor;
- criar, editar e inativar uma loja;
- criar, editar e inativar uma indústria;
- testar exclusão de registro sem vínculos;
- testar bloqueio de exclusão de registro com visita ou roteiro vinculado;
- confirmar que tudo persiste após recarregar a página.

Ao finalizar, informe quais ações foram testadas e quais regras de exclusão foram implementadas.

Quando ele concluir, teste você mesmo criando uma loja, uma indústria e um promotor reais. Depois seguimos para a Missão 2, que vai ligar esses cadastros aos logins, aos convites por e-mail e ao convite compartilhável por WhatsApp.
      </div>
    </div>
  );
}
