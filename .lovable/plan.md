# Plan - Correção Bloqueadora: Ações do Roteiro e Simulação Semanal

Este plano aborda as falhas críticas identificadas na simulação semanal (visão do promotor) e nas ações administrativas de gestão de roteiros.

## Problemas Identificados

1.  **Simulação Semanal**: O filtro de data na simulação está consultando apenas a data real de hoje, ignorando o dia selecionado. Além disso, a simulação deve mostrar o que *seria* a agenda do dia, independente de visitas já geradas.
2.  **Duplicar Roteiro**: Falha ao criar cópia (provavelmente erro de permissão ou referencial).
3.  **Pausar/Arquivar/Excluir**: Erros de autorização ("não autorizado") mesmo para administradores válidos, devido a inconsistências nas verificações server-side ou RLS.
4.  **Integridade de Exclusão**: Melhorar a mensagem de erro ao tentar excluir roteiros com histórico.

## Proposta de Solução

### 1. Simulação Semanal (Frontend & Backend)
*   **Ajuste no `promoter/index.tsx`**: Alterar a query para que, em modo simulação, o sistema mostre o roteiro teórico para aquele dia da semana, buscando diretamente da tabela `route_stops` e `stop_tasks` do roteiro vigente do promotor, em vez de filtrar apenas a tabela `visits` por data fixa.
*   **UI**: Atualizar mensagens de "hoje" para o dia da semana correspondente.

### 2. Ações de Roteiro (Backend)
*   **`routes.functions.ts`**: Revisar as verificações de `user_roles`. O erro "não autorizado" sugere que o `userId` no contexto ou a consulta à tabela `user_roles` está falhando.
*   **`duplicateRoute`**: Garantir que o `created_by` e os relacionamentos de paradas/tarefas sejam inseridos corretamente em uma transação ou sequência garantida.
*   **`archiveRoute` & `toggleRouteActive`**: Simplificar a autorização para garantir que administradores logados sempre tenham acesso.

### 3. Exclusão e Feedbacks
*   **`deleteRouteSafely`**: Refinar a verificação de visitas executadas para incluir checagens em faturamentos/ocorrências e retornar erros amigáveis.
*   **Frontend**: Garantir que as toasts de erro capturem a mensagem real do backend.

## Detalhes Técnicos

*   **Simulação**: Criar uma nova `queryFn` ou lógica condicional no dashboard do promotor que, se `previewPromoter` e `simulatedDay !== today`, busque as paradas teóricas.
*   **Autorização**: Utilizar a função SQL `has_role` (já existente no banco) dentro das server functions para maior confiabilidade.
*   **Banco de Dados**: Verificar se as tabelas `route_stops` e `stop_tasks` possuem RLS permitindo leitura pelo Admin durante o preview.

## Testes de Validação

1.  Selecionar "SEG" na simulação do Lucas -> Deve aparecer "SUPER ADEGA QNL".
2.  Tentar duplicar o roteiro "LUCAS" -> Novo rascunho deve aparecer na lista.
3.  Pausar/Reativar -> Badge de status deve mudar instantaneamente.
4.  Arquivar um roteiro de teste -> Deve desaparecer da lista padrão.
5.  Excluir roteiro com visita -> Deve mostrar alerta explicativo.
