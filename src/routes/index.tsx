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
        Continue o projeto sem alterar o visual atual do dashboard administrativo. Agora transforme o painel em módulos administrativos reais, com rotas funcionais, navegação e operações ligadas ao Supabase.

IMPORTANTE:
- Todos os botões, cards e links devem funcionar.
- Não usar telas vazias ou apenas demonstrativas.
- Usar dados reais do Supabase quando existirem.
- Os dados de teste devem aparecer somente quando a base estiver vazia e devem ser claramente identificados.
- Depois de inserir dados reais, não mostrar “Dados de Teste” como recurso normal do administrador.

Criar menu lateral administrativo, responsivo para computador e celular, com os módulos:

1. Dashboard Geral
2. Rotas e Roteiros
3. Visitas para Conferência
4. Ocorrências
5. Cadastros
   - Promotores
   - Lojas
   - Indústrias
6. Usuários e Acessos
7. Relatórios Mensais
8. Exportações
9. Cobranças

Dashboard:
- Fazer os cards clicáveis.
- “Visitas Previstas Hoje” abre lista filtrada de visitas previstas para hoje.
- “Visitas Enviadas Hoje” abre lista de visitas enviadas hoje.
- “Pendentes de Conferência” abre a tela de conferência já filtrada.
- “Ocorrências Abertas” abre a tela de ocorrências já filtrada.
- Cada item em “Últimas Visitas Enviadas” deve abrir o detalhe daquela visita.
- Cada ocorrência recente deve abrir o detalhe da ocorrência.
- Manter botão “Novo Relatório”, levando para Relatórios Mensais.

Módulo Promotores:
- Listagem de promotores com nome, telefone, e-mail, status, quantidade de visitas previstas nesta semana e última atividade.
- Botão “Novo promotor”.
- Tela/formulário com nome completo, telefone, e-mail, região, observação e status ativo/inativo.
- Permitir editar e inativar, sem apagar o histórico.
- Botão “Ver roteiro” em cada promotor.
- Botão “Criar rota” em cada promotor.

Módulo Lojas:
- Listagem com nome, endereço, cidade, status e quantidade de indústrias vinculadas.
- Botão “Nova loja”.
- Cadastro com nome, endereço completo, cidade, estado, CEP, latitude, longitude e status.
- Permitir editar e inativar sem apagar histórico.

Módulo Indústrias:
- Listagem com nome, status, lojas atendidas, promotores vinculados e visitas no mês.
- Botão “Nova indústria”.
- Cadastro com nome, CNPJ opcional, contato principal, e-mail, telefone e status.
- Permitir editar e inativar sem apagar histórico.
- Botão “Acessar visão da indústria” para visualizar como a indústria verá seus dados.

Módulo Usuários e Acessos:
- Listar usuários com nome, e-mail, perfil, vínculo, status, último acesso e data de criação.
- Perfis possíveis: administrador, promotor e indústria.
- Botão “Convidar usuário”.
- Ao convidar promotor, obrigar vínculo com um promotor cadastrado.
- Ao convidar indústria, obrigar vínculo com uma indústria cadastrada.
- Permitir reenviar convite, bloquear, reativar e solicitar redefinição de senha.
- Não permitir cadastro público.
- Mostrar convites pendentes e expirados.

Módulo Rotas e Roteiros:
- Só permitir criar rota depois de selecionar um promotor cadastrado.
- Tela de roteiro semanal com segunda a domingo.
- Em cada dia: adicionar lojas, ordenar paradas e incluir indústrias por loja.
- Para cada indústria na loja: selecionar frequência semanal ou quinzenal.
- Permitir salvar como rascunho e publicar.
- Exigir data de vigência ao publicar uma alteração.
- Mostrar histórico de versões da rota.
- Nunca modificar visitas passadas ao alterar uma rota.
- Criar botão “Visualizar como promotor”.

Integração:
- Conectar cadastros, rotas, visitas e usuários ao Supabase.
- Exibir mensagens de sucesso e erro.
- Validar campos obrigatórios.
- Proteger todas as rotas administrativas para somente administradores autenticados.
- Criar navegação por URL para que cada módulo possa ser acessado diretamente.

Comece implementando e testando nesta ordem:
1. Menu administrativo;
2. Cadastros de Promotores, Lojas e Indústrias;
3. Usuários e Acessos;
4. Rotas e Roteiros;
5. Ligações dos cards do Dashboard.
      </div>
    </div>
  );
}
