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
MISSÃO 0 — Corrigir banco de dados, relacionamentos e erros de carregamento.

Não criar telas novas nesta missão. Corrigir primeiro todos os erros de dados e garantir que as telas existentes carreguem corretamente.

Erro atual a corrigir:
“Could not find a relationship between 'visits' and 'promoter_id' in the schema cache”.

Tarefas:

1. Inspecionar o schema real já criado no Supabase e identificar:
- nome real da tabela de visitas;
- nome real da tabela de promotores;
- nome real das colunas de vínculo;
- se o campo está nomeado como `promoter_id`, `promotor_id` ou outro nome;
- se existe chave estrangeira válida entre visita e promotor.

2. Corrigir as migrations e consultas sem apagar dados existentes.
- A tabela de visitas deve ter vínculo válido com o promotor.
- O vínculo deve ser uma chave estrangeira real no Supabase.
- Ajustar as consultas do frontend para usar os nomes reais das tabelas e colunas.
- Se já houver dados de teste incompatíveis, corrigir ou recriar somente os dados de teste.
- Não apagar usuários, roteiros ou dados reais.

3. Validar relacionamentos necessários:
- visita → promotor;
- visita → loja;
- visita → indústria;
- visita → roteiro/parada, quando existir;
- ocorrência → visita;
- usuário → perfil;
- usuário de indústria → indústria.

4. Corrigir as seguintes telas, garantindo que não apresentem erro:
- Visitas Previstas Hoje;
- Visitas Enviadas Hoje;
- Pendentes de Conferência;
- Últimas Visitas Enviadas;
- Visitas para Conferência;
- visão da Indústria;
- Relatórios Mensais.

5. Para cada tela, implementar estados:
- carregando;
- sem dados;
- erro amigável;
- dados carregados.

6. Teste obrigatório antes de finalizar:
- criar ou usar um promotor de teste;
- criar uma loja de teste;
- criar uma indústria de teste;
- criar uma visita vinculada corretamente aos três;
- abrir Visitas Previstas Hoje;
- abrir Visitas para Conferência;
- abrir a visão da indústria;
- confirmar que nenhuma tela exibe erro de relacionamento.

Ao final, informar claramente:
- qual era a causa do erro;
- quais tabelas e campos foram corrigidos;
- quais telas foram testadas;
- quais dados de teste foram usados.
      </div>
    </div>
  );
}
