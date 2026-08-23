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
MISSÃO V1.3 — AGENDA SEMANAL REAL NO VISUALIZADOR ADMINISTRATIVO

A agenda semanal teórica foi implementada no visualizador administrativo, permitindo que o administrador visualize a programação de qualquer promotor por dia da semana sem afetar a conta real ou gerar visitas.

PÁGINA ALVO:
`/admin/visualizar-promotor`

FUNCIONALIDADES IMPLEMENTADAS:
1. Seletor de Dia da Semana: Interface intuitiva (SEG a DOM) com destaque para o dia atual.
2. Filtro de Roteiros Ativos: A agenda considera apenas roteiros com status "Publicado", que estejam "Ativos" e dentro da vigência.
3. Lógica de Frequência:
   - Suporte a paradas semanais e quinzenais (baseadas no início da vigência).
   - Cálculo dinâmico para determinar se uma parada quinzenal deve aparecer na semana atual.
4. Exibição Detalhada da Parada:
   - Ordem de visita, Loja, Endereço, Indústrias, Frequência e Observações operacionais.
   - Badge "Prévia do roteiro" e identificação do Roteiro de origem.
5. Mensagem de Estado Vazio: Feedback claro quando não há paradas programadas para o dia selecionado.

RESULTADOS DO TESTE (LUCAS):
- Ao selecionar SEGUNDA-FEIRA, a parada "SUPER ADEGA QNL" vinculada ao roteiro "LUCAS" e à "INDÚSTRIA KING" é exibida corretamente.
- A visualização é puramente consultiva (somente leitura), garantindo a integridade dos dados de campo.

PRÓXIMA ETAPA:
Refinamento de performance e auditoria de simulação.


        </div>
      </div>
    </div>
  );
}
