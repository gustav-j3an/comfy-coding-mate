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
O botão está desabilitado porque a tela está em **“Requer revisão”**. Mas há um problema mais importante: o resumo informa que vai gerar apenas **2 roteiros em rascunho**. Isso está errado.

Os dois são apenas as abas do Excel (`ROTEIRO LUCAS` e `ROTEIRO ALEXANDRE`). O sistema precisa criar roteiros por **promotor**: são 28 promotores com paradas válidas, portanto devem ser **28 roteiros em rascunho**, com as 409 paradas distribuídas entre eles.

Não confirme ainda. Cole este prompt no Lovable:

CORREÇÃO BLOQUEADORA DA IMPORTAÇÃO — BOTÃO DESABILITADO E QUANTIDADE DE ROTEIROS INCORRETA

A tela de importação está em “Requer revisão” e o botão “Confirmar Importação Segura” permanece desabilitado mesmo com:

- data de vigência preenchida;
- checkbox de ciência marcado.

Além disso, o resumo informa:

`Gerar 2 Roteiros em RASCUNHO`

Isso está incorreto. As duas abas de roteiro do Excel não representam dois roteiros. Elas contêm linhas de 28 promotores diferentes.

Não permita importação até corrigir esse mapeamento.

CORREÇÃO DO MODELO DE ROTEIROS

Para a planilha atual:

- criar 1 roteiro em rascunho por promotor com paradas válidas;
- expectativa: 28 roteiros em rascunho;
- distribuir as 409 linhas válidas como paradas desses 28 roteiros;
- manter loja, indústria, frequência e dias marcados;
- não criar visitas;
- não publicar roteiros automaticamente;
- o nome do roteiro deve identificar o promotor, por exemplo:
  `Importação Excel — [Nome do Promotor]`.

Nunca crie roteiro por nome de aba.

CORREÇÃO DO BLOQUEIO “REQUER REVISÃO”

Separe inconsistências bloqueadoras de pendências revisáveis.

Pendências revisáveis:

- linhas sem nenhum dia da semana marcado;
- duplicidade idêntica de parada;
- campos opcionais ausentes.

Para essas pendências:

- mostre a lista clara em “Inconsistências”;
- não importe as linhas sem dia;
- ignore duplicidades idênticas, registrando-as no relatório;
- permita que o Admin confirme a importação dos registros válidos após marcar um novo checkbox:

`Li e aceito importar os registros válidos; as pendências ficarão registradas para revisão posterior.`

Inconsistências bloqueadoras:

- arquivo inválido;
- ausência de aba obrigatória;
- promotor, loja ou indústria obrigatórios ausentes em uma linha que seria importada;
- falha de vínculo que impeça criar uma parada válida.

Somente inconsistências bloqueadoras devem manter o botão desabilitado.

INTERFACE

Após o arquivo válido, a tela deve mostrar:

- `28 roteiros em rascunho`;
- `409 paradas válidas`;
- quantidade de promotores, lojas e indústrias a criar/atualizar/ignorar;
- quantidade de pendências excluídas da importação;
- motivo claro caso o botão esteja bloqueado;
- botão habilitado quando:
  - data válida;
  - primeiro checkbox marcado;
  - checkbox de aceite das pendências marcado;
  - não existir inconsistência bloqueadora.

TESTES OBRIGATÓRIOS

1. Carregar a planilha de referência.
2. Confirmar que o resumo mostra 28 roteiros em rascunho, não 2.
3. Confirmar 409 paradas válidas.
4. Confirmar que as linhas sem dia aparecem como pendência revisável.
5. Confirmar que duplicidade idêntica aparece como pendência revisável.
6. Marcar os dois checkboxes e confirmar que o botão é habilitado.
7. Remover um checkbox e confirmar que o botão volta a ficar desabilitado.
8. Simular uma inconsistência bloqueadora e confirmar que o botão permanece bloqueado com motivo claro.
9. Confirmar que nenhuma importação é realizada nesta missão; apenas corrija a prévia e a habilitação.

ENTREGA

Informe:

- causa raiz de mostrar 2 roteiros;
- regra de agrupamento por promotor;
- quais pendências são bloqueadoras ou revisáveis;
- resultado individual dos nove testes;
- captura com “28 roteiros em rascunho” e botão habilitado após os dois checkboxes.
        </div>
      </div>
    </div>
  );
}
