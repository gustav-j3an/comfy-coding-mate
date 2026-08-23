# Missão 9.2.1 — Correção de Segurança e Integridade do Modo Offline

Este plano visa corrigir as vulnerabilidades de isolamento de dados no IndexedDB em aparelhos compartilhados e garantir a integridade das visitas que exigem mídias obrigatórias.

## Alterações Técnicas

### 1. Isolamento Local (Segurança)
- **Modificação em `src/lib/offline.ts`**:
    - Alterar as chaves do IndexedDB para incluir o `userId`. As chaves passarão de `visit_draft_{visitId}` para `user_{userId}_visit_draft_{visitId}`.
    - Implementar uma função `clearUserOfflineData(userId)` para limpar apenas os dados do usuário atual ao fazer logout.
    - Adicionar validação de `executorId` (ou `promoterId`) em todas as operações de leitura para garantir que o rascunho recuperado pertence ao usuário autenticado.
- **Modificação em `src/lib/auth/auth-context.tsx`**:
    - Chamar `clearUserOfflineData(user.id)` dentro da função `signOut`.

### 2. Integridade de Mídia Obrigatória
- **Modificação em `src/lib/offline.ts`**:
    - Expandir a interface `VisitDraft` para incluir uma lista de mídias obrigatórias pendentes.
    - Adicionar novos estados ao status da visita: `awaiting_media`, `ready_for_sync`.
- **Modificação em `src/routes/_authenticated/promoter/visit.$visitId.tsx`**:
    - Implementar lógica para identificar mídias obrigatórias (baseado no tipo da visita ou regras da indústria).
    - Impedir a finalização da visita se houver mídias obrigatórias não enviadas, alterando o status para "Aguardando envio de mídia".
    - Exibir avisos claros na interface sobre evidências pendentes.
- **Modificação em `src/lib/execution.functions.ts`** (ou função de submissão):
    - Validar no servidor a presença de todas as evidências antes de marcar a visita como `submitted`.

### 3. Rotina de Limpeza e PWA
- **Modificação em `src/lib/offline.ts`**:
    - Criar função para remover rascunhos com mais de 7 dias (expiração de cache local).
- **Modificação em `src/components/common/pwa-updater.tsx`**:
    - Garantir que o bloqueio de atualização considere também mídias pendentes na fila local.

## Testes de Validação
1. **Teste de Isolamento**: Logar como Promotor A, criar rascunho, deslogar. Logar como Promotor B e verificar se o rascunho do A está invisível.
2. **Teste de Mídia**: Preencher checklist offline, tentar finalizar sem fotos obrigatórias e verificar o bloqueio.
3. **Teste de Sincronização**: Recuperar conexão, enviar mídias e verificar se a visita é concluída corretamente uma única vez.
