import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold border-b border-slate-700 pb-4">
          ROTA DO PROMOTOR — STATUS DO PROJETO
        </h1>
        
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
MISSÃO V1.1 — RECRIAR DO ZERO O VISUALIZADOR DE ROTEIRO DO PROMOTOR

O visualizador antigo “Visualizar como Promotor” foi removido. A impersonação na tela real do promotor e o banner de simulação foram desativados para preservar a integridade da ferramenta de campo.

NOVA BASE ISOLADA CRIADA:
Uma nova página administrativa independente foi implementada em:
`/admin/visualizar-promotor`

FLUXO ATUAL:
1. Admin acessa a tela de Rotas e Roteiros.
2. Seleciona um promotor no filtro superior.
3. Clica no novo botão "Visualizar roteiro do promotor".
4. O sistema valida as permissões e redireciona para a nova página isolada.

SEGURANÇA E VALIDAÇÃO:
- A nova página valida no servidor (via Supabase RPC) se o usuário é Admin.
- O promoterId é validado para garantir que o promotor existe e está ativo.
- A sessão do Admin não é alterada e a tela real do promotor permanece limpa.

PRÓXIMA ETAPA:
Adicionar a agenda semanal simulada na nova página isolada.
        </div>
      </div>
    </div>
  );
}
