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
A visualização como Promotor está com um erro de leitura.

Existe um roteiro ativo para Lucas Denis de Castro Alves com uma parada na segunda-feira:

- Loja: SUPER ADEGA QNL
- Indústria: INDÚSTRIA KING
- Dia: segunda-feira

Quando eu clico em “Visualizar como Promotor”, seleciono “SEG” e abro “Agenda de Segunda”, essa parada não aparece.

Corrija a query da simulação semanal para buscar as paradas cadastradas no roteiro ativo do promotor, não apenas registros existentes na tabela de visitas.

Regra:

- Se houver uma visita já gerada para a data simulada, mostre essa visita.
- Se ainda não houver visita gerada, mostre a parada prevista no roteiro semanal como “Prévia do roteiro”.
- Não crie visitas novas ao abrir essa tela.
- Não altere dados existentes.
- A tela deve mostrar a loja, indústria, frequência e observação da parada.
- Para Lucas, ao selecionar segunda-feira, SUPER ADEGA QNL e INDÚSTRIA KING devem aparecer obrigatoriamente.

Não altere os botões de editar, duplicar, pausar, arquivar ou excluir roteiro.

Teste no Preview com Lucas e confirme visualmente que a rota de segunda-feira aparece.
        </div>
      </div>
    </div>
  );
}
