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
MISSÃO IMPORTAÇÃO 2 — CORRIGIR CONTAGEM E VALIDAÇÃO ANTES DE LIBERAR A GRAVAÇÃO

Ainda não implemente a gravação no banco.

A tela de importação reconhece as abas, mas os totais estão errados. Para o arquivo de referência, a prévia está exibindo números como 994 promotores, 999 lojas e 992 indústrias, o que não corresponde aos dados reais.

A causa provável é que o leitor está contando linhas vazias, células apenas formatadas, fórmulas, cabeçalhos, intervalos reservados ou valores de fallback como registros.

CORRIJA O LEITOR DO EXCEL

Considere registro válido somente quando os campos mínimos reais estiverem preenchidos:

PROMOTORES:
- contar apenas linhas com NOME preenchido;
- ignorar cabeçalho, linha vazia e células com fórmulas sem dado real.

LOJAS:
- contar apenas linhas com LOJA preenchida;
- ignorar cabeçalho e linhas vazias.

INDÚSTRIAS:
- contar apenas linhas com INDUSTRIA preenchida;
- ignorar cabeçalho e linhas vazias.

ROTEIROS:
- ler somente abas cujo nome começa com `ROTEIRO `;
- contar somente linhas que possuam, no mínimo:
  - INDUSTRIA;
  - LOJA;
  - PROMOTORES;
  - FREQ;
  - ao menos uma marcação de dia válida.
- aceitar `✓` como marcação válida;
- ignorar linhas vazias, totais, fórmulas, cabeçalhos e áreas formatadas além do fim dos dados.

RESULTADO ESPERADO PARA O ARQUIVO DE REFERÊNCIA

A prévia deve apresentar estes valores:

- Promotores: 42
- Lojas: 419
- Indústrias: 26
- Linhas de roteiro válidas: 413

Além disso, apresente:

- 28 promotores distintos presentes nas linhas de roteiro;
- 188 lojas distintas usadas nos roteiros;
- 20 indústrias distintas usadas nos roteiros;
- total de 522 marcações semanais de paradas.

DUPLICIDADE E INCONSISTÊNCIAS

- Detecte a duplicidade encontrada nas linhas de roteiro.
- Mostre a linha/origem da duplicidade na aba Inconsistências.
- Não bloqueie a prévia, mas marque a importação como “requer revisão” enquanto houver duplicidade ou vínculo ausente.
- Corrija a interface para não usar contadores fictícios, valores fixos ou fallback.

TESTE NO PREVIEW

1. Faça upload do arquivo de referência.
2. Confirme que os quatro totais principais são exatamente 42, 419, 26 e 413.
3. Confirme os quatro totais complementares: 28, 188, 20 e 522.
4. Confirme que a duplicidade aparece em Inconsistências.
5. Confirme que linhas vazias e fórmulas não entram na contagem.
6. Confirme que nenhuma tabela operacional é alterada.
7. Mantenha “Confirmar Importação” desabilitado nesta missão.

ENTREGA

Informe:

- causa raiz dos totais errados;
- regra usada para reconhecer uma linha válida;
- arquivos alterados;
- resultado dos sete testes;
- captura do Preview com os totais corretos.

Não implemente gravação enquanto os totais não coincidirem com os valores esperados.
        </div>
      </div>
    </div>
  );
}
