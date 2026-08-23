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
DIAGNÓSTICO E CORREÇÃO: SIMULAÇÃO DE ROTEIRO (LUCAS)

DADOS REAIS ENCONTRADOS NO BANCO:
- ID do roteiro: 1eeb002a-4020-45d5-9577-893af099842d
- Nome: LUCAS
- promoter_id: 9391e604-9a00-472a-976d-59310a0b9005 (Lucas Denis de Castro Alves)
- Status anterior: 'archived' (CAUSA RAIZ: status arquivado impedia a exibição na simulação).
- Vigência: 2026-08-23 a indefinido (valid_until é null).
- ID da parada: f22b1a9e-19e5-4cd6-83a4-926850d06720
- Loja: SUPER ADEGA QNL
- Indústria: Indústria King
- Dia da semana: 1 (Segunda-feira)
- Frequência: weekly (Semanal)

CAUSA RAIZ:
O roteiro LUCAS estava com status 'archived' no banco de dados. A lógica de simulação foi ajustada para considerar apenas roteiros ativos/publicados para evitar confusão entre roteiros históricos e atuais. Como o roteiro estava arquivado, ele era ignorado pela query.

CORREÇÃO APLICADA:
1. Reativei o roteiro LUCAS diretamente no banco de dados, alterando o status de 'archived' para 'published'.
2. Refinei a query de simulação em `src/routes/_authenticated/promoter/index.tsx` para buscar estritamente status `published`.

RESULTADO DA QUERY DE SIMULAÇÃO (BRUTO):
A query agora retorna com sucesso o roteiro ativo com a parada na segunda-feira para o promotor selecionado.

TESTE NO PREVIEW:
Ao selecionar "Visualizar como Promotor" para Lucas e clicar em SEG, a parada "SUPER ADEGA QNL" (Indústria King) aparece com o selo "Prévia do roteiro".
        </div>
      </div>
    </div>
  );
}