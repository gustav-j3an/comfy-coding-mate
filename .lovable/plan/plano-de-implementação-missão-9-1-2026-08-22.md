# Plano de Implementação - Missão 9.1

Correção final das políticas de retenção de dados (exclusão total de mídia após 90 dias) e aprimoramento da atualização do PWA para evitar interrupções de upload.

## Alterações Técnicas

### Retenção de Dados (90 Dias)
- Modificar `executeManualCleanup` e rotinas automáticas em `src/lib/automation.functions.ts` para remover a exceção de faturamento.
- Garantir que fotos, vídeos e PDFs sejam excluídos do Supabase Storage independentemente de estarem em uma cobrança.
- Atualizar `src/routes/_authenticated/admin/billing.tsx` e componentes de relatório para lidar com mídias expiradas, exibindo a mensagem "Evidência expirada conforme política de retenção de 90 dias".

### Atualização do PWA
- Configurar o Service Worker no `vite.config.ts` para usar o modo `prompt` em vez de `autoUpdate`.
- Criar um componente de notificação de atualização que verifica o estado global de upload.
- Bloquear a aplicação da atualização se houver um `isSubmitting` ativo no contexto de execução do promotor.

### Segurança e Compliance
- Reforçar a segregação de segredos (env vars) e a privacidade de mídia no `@security-memory`.

## Detalhes Técnicos (para desenvolvedores)
- **Database**: Nenhuma alteração de schema necessária, apenas ajuste na lógica de exclusão.
- **Frontend**: Implementação de `useRegisterSW` com lógica customizada de ativação.
- **UI**: Atualização de fallbacks de imagem e arquivo para estados expirados.
