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
Então não vamos insistir nessa versão. O erro mostra que o importador ainda está tentando fazer trabalho demais em uma única operação. Precisamos transformar a gravação em um processo por etapas, com lotes pequenos e retomáveis.

Não tente importar de novo agora. Cole este prompt no Lovable:

CORREÇÃO DEFINITIVA — IMPORTAÇÃO AINDA TRAVA, DEMORA E TERMINA EM ERRO

A importação continua falhando na prática: fica muito tempo em “Gravando...” e depois apresenta erro.

Não faça mais ajustes pequenos dentro da função atual. Reestruture a execução da importação para não depender de uma única função server-side longa.

PRESERVE OS DADOS JÁ EXISTENTES

Há registros parciais de tentativas anteriores. Não delete, recrie ou duplique dados automaticamente.

Primeiro, identifique e informe:

- quais roteiros/paradas foram criados parcialmente;
- a qual lote de importação pertencem;
- quais podem ser retomados com segurança;
- quais conflitos existem.

NOVA ARQUITETURA OBRIGATÓRIA

Implemente importação em etapas curtas e retomáveis:

1. Criar lote
- Ao confirmar, crie um `import_batch` com ID único.
- Salve origem, data, Admin responsável, vigência, status e resumo.

2. Processar por etapas
- Cada chamada server-side deve processar no máximo 25 registros ou um volume comprovadamente abaixo do timeout.
- Ordem:
  - indústrias;
  - lojas;
  - promotores;
  - roteiros;
  - paradas.
- Não faça loops longos, `Promise.all` gigante ou centenas de inserts em uma única chamada.

3. Progresso visível
- Mostrar etapa atual.
- Mostrar quantidade concluída / total.
- Mostrar erros por item sem travar toda a tela.
- O usuário deve ver avanço real, por exemplo:
  `Lojas: 125 de 419`.

4. Retomada segura
- Se a página fechar, internet cair ou uma chamada falhar, o lote deve ficar como `falhou` ou `pausado`, nunca preso em “processando”.
- Ao voltar à tela, o Admin deve poder clicar em `Retomar importação`.
- Retomar deve continuar apenas itens pendentes.
- Nenhum item já processado pode ser duplicado.

5. Finalização
- Só marque o lote como `concluído` após todas as etapas terminarem.
- Exiba relatório final com criados, vinculados, ignorados, pendentes e erros.
- Mantenha as quatro linhas sem dia como pendências; não tente importá-las.
- Não gere visitas e não publique roteiros.

TRATAMENTO DE ERROS

- Todo erro do servidor deve aparecer na tela em linguagem clara.
- Registre o detalhe técnico em log seguro para diagnóstico.
- Use `try/catch/finally` para sempre encerrar o estado de carregamento.
- Não deixe o botão permanentemente em “Gravando...”.
- Se houver timeout, mostre “Importação pausada; retome para continuar”, não uma mensagem genérica.

VALIDE NO PREVIEW

1. Inicie a importação da planilha.
2. Confirme progresso por etapa e por quantidade.
3. Simule falha no meio do processo.
4. Confirme que o lote fica pausado/falhou com erro visível.
5. Retome o mesmo lote.
6. Confirme que não duplica os registros já processados.
7. Confirme a criação total de 28 roteiros em rascunho.
8. Confirme que nenhuma visita foi criada.
9. Confirme relatório final e encerramento do loading.
10. Confirme que não existe mais cenário em que a tela fica indefinidamente “Gravando...”.

ENTREGA

Informe:

- causa exata do erro atual;
- estrutura criada para lotes;
- tamanho do chunk;
- estado dos dados parciais existentes;
- resultado individual dos dez testes;
- captura do Preview mostrando progresso e relatório final concluído.

Não declare concluído sem uma importação real terminando no Preview.
        </div>
      </div>
    </div>
  );
}
