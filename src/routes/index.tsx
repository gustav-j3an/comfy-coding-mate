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
MISSÃO IMPORTAÇÃO 3 — GRAVAÇÃO SEGURA DE PROMOTORES, LOJAS, INDÚSTRIAS E ROTEIROS

Implemente a etapa de confirmação e gravação da importação no módulo:

`/admin/import`

Objetivo: importar a base operacional do Excel sem gerar visitas automaticamente e sem apagar, duplicar ou substituir dados existentes de forma indevida.

ESTRATÉGIA DE IMPORTAÇÃO

A importação deve criar ou atualizar com segurança:

1. Promotores
- Importar a aba PROMOTORES.
- Usar MATRÍCULA como chave principal de correspondência quando ela existir.
- Se não houver matrícula, usar nome normalizado apenas para sugerir correspondência; não criar duplicidade automaticamente.
- Importar nome, UF, cidade atendida, contato e observação.
- Não alterar usuário, senha, papel ou acesso de login.

2. Lojas
- Importar a aba LOJAS.
- Identificar duplicidade pela combinação normalizada: REDE + LOJA + UF.
- Criar somente lojas inexistentes.
- Não apagar ou sobrescrever endereço, GPS ou dados operacionais já preenchidos no sistema sem confirmação explícita.

3. Indústrias
- Importar a aba INDUSTRIA.
- Identificar pela denominação normalizada.
- Criar somente indústrias inexistentes.

4. Roteiros
- Importar somente as linhas válidas das abas que começam com `ROTEIRO `.
- Criar um roteiro em RASCUNHO por promotor que possua linhas válidas.
- Vincular as paradas ao roteiro correto, preservando:
  - loja;
  - indústria;
  - frequência;
  - dias da semana marcados;
  - UF;
  - ordem estável de importação.
- Não publicar roteiros automaticamente.
- Não criar visitas automaticamente.
- Não alterar roteiros existentes durante esta primeira importação.
- Use um nome claro, como: `Importação Excel — [Nome do Promotor]`.

5. Linhas pendentes
Não importe como parada automática as quatro linhas sem nenhum dia marcado. Registre-as no relatório final como “Pendente de definição de dia”:

- KING — ATACADÃO - COSTA E SILVA — ANA LETICIA ORTIZ AVALO;
- ALLEZA — ASSAI GOIANIA T9 — FRANCISCO JOSE DOS SANTOS LOURENÇO;
- KING — ASSAI ANAPOLIS — MARCELO AUGUSTO DE OLIVEIRA PEREIRA GOMES;
- TERMOLAR — RIO VERMELHO MARACANA — MARCELO AUGUSTO DE OLIVEIRA PEREIRA GOMES.

INTERFACE DE CONFIRMAÇÃO

Antes de gravar, mostre uma tela final com:

- data de vigência inicial obrigatória, escolhida pelo Admin;
- resumo do que será criado, atualizado, ignorado e enviado para revisão;
- lista de conflitos e duplicidades;
- checkbox obrigatório:
  “Entendo que os roteiros serão importados como rascunho e não gerarão visitas automaticamente.”
- botão: `Confirmar Importação Segura`.

Durante a importação:

- mostre progresso;
- bloqueie clique duplo;
- se ocorrer falha, apresente relatório claro;
- a operação deve ser atômica por categoria ou possuir rollback seguro, sem deixar roteiros pela metade;
- registre um relatório de importação com data, Admin responsável, resumo, pendências e erros.

SEGURANÇA

- Somente Admin pode confirmar a importação.
- A gravação deve ocorrer exclusivamente por função server-side.
- Valide novamente no servidor todos os dados recebidos.
- Não exponha chaves administrativas.
- Não permita que upload ou campos manipulados pelo frontend alterem permissões, usuários ou dados financeiros.

VALIDAÇÃO NO PREVIEW

1. Importar a planilha de referência usando uma vigência escolhida pelo Admin.
2. Confirmar que promotores aparecem no módulo Promotores.
3. Confirmar que lojas aparecem no módulo Lojas.
4. Confirmar que indústrias aparecem no módulo Indústrias.
5. Confirmar criação de roteiros em rascunho para os promotores com roteiro.
6. Confirmar que as paradas aparecem no editor de cada roteiro importado.
7. Confirmar que nenhuma visita foi criada automaticamente.
8. Confirmar que as quatro linhas sem dia ficaram no relatório de pendências.
9. Repetir a mesma importação e confirmar que não duplica cadastros nem roteiros.
10. Confirmar que usuário não-Admin é bloqueado.

ENTREGA

Informe:

- quantidade criada, atualizada, ignorada e pendente em cada categoria;
- IDs ou nomes dos roteiros em rascunho criados;
- relatório das quatro pendências;
- resultado individual dos dez testes;
- confirmação explícita de que nenhuma visita foi gerada automaticamente.

Não publique roteiros nem gere visitas nesta missão.
        </div>
      </div>
    </div>
  );
}
