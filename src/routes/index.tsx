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
MISSÃO V1.4 — VALIDAÇÃO FINAL E ACABAMENTO DO NOVO VISUALIZADOR

Finalize o novo visualizador administrativo de roteiro do promotor em:

`/admin/visualizar-promotor`

Não recrie módulos e não altere o comportamento real de roteiros, visitas, PWA, faturamento ou telas do Promotor.

OBJETIVO

Confirmar com evidência real que o Admin consegue abrir Lucas, selecionar segunda-feira e visualizar a parada SUPER ADEGA QNL / INDÚSTRIA KING.

VALIDAÇÃO FUNCIONAL OBRIGATÓRIA

No Preview, execute exatamente este fluxo:

1. Entre como Admin.
2. Abra Rotas e Roteiros.
3. Selecione Lucas Denis de Castro Alves.
4. Clique em “Visualizar roteiro do promotor”.
5. Confirme que a nova URL é `/admin/visualizar-promotor` com o promotor correto.
6. Confirme que a página mostra o nome de Lucas e os roteiros encontrados.
7. Clique em SEG.
8. Confirme visualmente que aparece:
   - SUPER ADEGA QNL;
   - INDÚSTRIA KING;
   - selo “Prévia do roteiro”;
   - dia Segunda-feira.
9. Clique em um dia sem parada e confirme a mensagem:
   “Nenhuma parada programada para [dia].”
10. Clique em voltar e confirme retorno a Rotas e Roteiros sem alterar dados.

VALIDAÇÃO DE INTEGRIDADE E SEGURANÇA

Confirme também:

1. Recarregar a página mantém o promotor selecionado pela URL validada.
2. Alterar manualmente o `promoterId` para um ID inexistente mostra erro claro.
3. Usuário Promotor e usuário Indústria não conseguem abrir o visualizador.
4. A página não possui botões de enviar visita, upload, editar, criar, pausar, arquivar ou excluir.
5. Abrir o visualizador não cria nem altera registros em `visits`, `routes` ou paradas.
6. Roteiro arquivado aparece identificado como arquivado e não é usado na agenda ativa.
7. Layout funciona em celular e desktop, sem rolagem horizontal indevida.

ACABAMENTO VISUAL

- Adicione título claro: “Visualizador de Roteiro”.
- Mostre o nome do promotor selecionado.
- Mostre botão “Voltar para Rotas e Roteiros”.
- Destaque o dia selecionado.
- Use estados de carregamento, vazio e erro claros.
- Mantenha a interface consistente com o painel administrativo.

ENTREGA

Não responda apenas que está concluído. Informe:

- resultado individual dos 17 itens de validação;
- arquivos alterados;
- captura do Preview com Lucas, segunda-feira selecionada, SUPER ADEGA QNL e INDÚSTRIA KING visíveis;
- confirmação de que nenhuma visita foi criada ou alterada durante o teste.

Se SUPER ADEGA QNL não aparecer na segunda-feira, continue corrigindo e não marque a missão como concluída.
        </div>
      </div>
    </div>
  );
}
