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
MISSÃO V1.2 — LEITURA REAL DE ROTEIROS E PARADAS NO NOVO VISUALIZADOR

O novo visualizador administrativo agora carrega dados reais diretamente da estrutura de roteiros do banco de dados, garantindo total isolamento da tela real do promotor e da tabela de visitas.

PÁGINA ALVO:
`/admin/visualizar-promotor`

FUNCIONALIDADES IMPLEMENTADAS:
1. Leitura Server-Side: Criada server function `getPromoterItineraryData` que valida permissão de Admin e busca roteiros vinculados ao promotor.
2. Relacionamentos Reais: A consulta atravessa {"routes -> route_stops -> stores"} e {"stop_tasks -> industries"} para montar a visão completa.
3. Interface Detalhada:
   - Exibição clara do Status (Publicado, Rascunho, Arquivado, Pausado).
   - Listagem técnica de cada parada: Dia da Semana, Loja, Endereço, Indústria e Frequência.
   - Tratamento de estados vazios para promotores sem roteiro.
4. Segurança: Validação obrigatória de Admin no servidor e filtro estrito por `promoterId`.

STATUS DO ROTEIRO "LUCAS":
Confirmado como "Publicado", exibindo corretamente a parada "Segunda-feira — SUPER ADEGA QNL — INDÚSTRIA KING — Semanal".

PRÓXIMA ETAPA:
Montagem da Agenda Semanal Visual baseada nestes dados.

        </div>
      </div>
    </div>
  );
}
