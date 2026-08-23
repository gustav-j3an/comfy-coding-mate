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
Não clique novamente nem atualize a página agora. O sistema pode estar preso no processamento ou ter gravado apenas uma parte; uma nova tentativa sem verificação poderia duplicar cadastros.

Também há um alerta: a prévia tinha **409 linhas válidas**, mas a tela está processando apenas **336 paradas únicas**. Isso pode ser correto se ela estiver agrupando paradas repetidas, mas precisa provar que nenhum dia, indústria ou frequência foi perdido.

Cole este prompt no Lovable:

BUG CRÍTICO — IMPORTAÇÃO FICA PRESA EM “GRAVANDO...”

A importação foi iniciada e a interface ficou indefinidamente em:

`Gravando...`

Não permita nova tentativa, não limpe dados e não declare a importação concluída sem investigar o estado real do banco.

ETAPA 1 — VERIFICAR O ESTADO DA TENTATIVA ATUAL

Antes de alterar código, consulte o banco e informe:

- quantos promotores foram criados/atualizados;
- quantas lojas foram criadas/atualizadas;
- quantas indústrias foram criadas/atualizadas;
- quantos roteiros em rascunho foram criados;
- quantas paradas foram criadas;
- se houve erro, timeout ou operação pendente;
- se existem registros parciais da tentativa atual.

Se houver gravação parcial, não reinicie cegamente. Faça a próxima execução ser idempotente e capaz de continuar sem duplicar dados.

ETAPA 2 — DESCOBRIR A CAUSA DO TRAVAMENTO

Inspecione a função `executeImport` e identifique a causa real. Verifique especialmente:

- `await` ou Promise que nunca termina;
- inserções em sequência muito lentas;
- `Promise.all` grande demais;
- consulta dentro de loop;
- timeout de função server-side;
- erro do servidor que não está chegando ao frontend;
- erro de RLS, foreign key ou validação oculto;
- estado de loading que não é resetado em `finally`.

ETAPA 3 — CORRIGIR A IMPORTAÇÃO

Implemente um processo seguro, com progresso e idempotência:

- crie um identificador único de lote de importação;
- registre status: preparado, processando, concluído ou falhou;
- processe cadastros em ordem: indústrias → lojas → promotores → roteiros → paradas;
- use operações em lote ou chunks pequenos, evitando centenas de requisições individuais;
- cada etapa deve registrar progresso real;
- mostre na interface: etapa atual, quantidade processada e erros;
- se falhar, encerre o loading e mostre uma mensagem clara;
- permita retomar o mesmo lote sem duplicar dados;
- bloqueie clique duplo;
- ao concluir, atualize a tela com relatório final.

INTEGRIDADE DAS PARADAS

A tela mostra 409 linhas válidas, mas o resumo diz “Processar 336 paradas únicas”.

Antes de importar, explique a regra de agrupamento:

- mostre quantas das 409 linhas foram agrupadas;
- confirme que cada agrupamento preserva todos os dias marcados;
- confirme que não mistura indústrias, frequência ou promotores diferentes;
- se houver risco de perda de dados, importe as 409 linhas como paradas distintas ou corrija a chave de agrupamento;
- não reduza 409 para 336 sem relatório detalhado e validação.

TESTE OBRIGATÓRIO

Use uma execução controlada da planilha de referência e confirme:

1. A importação não fica mais indefinidamente em “Gravando...”.
2. O progresso mostra cada etapa.
3. Em caso de falha, o botão volta ao estado normal e mostra o motivo.
4. Repetir a mesma importação não duplica cadastros, roteiros ou paradas.
5. São criados/vinculados 28 roteiros em rascunho.
6. O relatório explica claramente a diferença entre 409 linhas válidas e 336 paradas únicas, se ela continuar existindo.
7. Nenhuma visita é criada automaticamente.
8. O resultado final informa exatamente o que foi criado, atualizado, ignorado, pendente e falhou.

ENTREGA

Informe a causa raiz real do travamento, o estado encontrado da tentativa atual, os arquivos alterados e o resultado dos oito testes.

Não marque como concluído sem realizar uma importação completa no Preview que termine com relatório final, sem ficar em “Gravando...”.
        </div>
      </div>
    </div>
  );
}
