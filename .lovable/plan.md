# Plano de Implementação - Missão 8.1: Endurecimento de Segurança da Automação e Retenção

Este plano foca em reforçar a segurança das integrações com n8n, proteger segredos HMAC e tornar o processo de limpeza de dados mais seguro e auditável.

## Alterações Propostas

### 1. Segurança de Segredos e Webhook
- **Remover segredos do banco e UI**: O segredo HMAC e a URL completa do n8n não serão mais salvos na tabela `automation_settings`. Eles serão lidos exclusivamente de variáveis de ambiente (`N8N_WEBHOOK_URL`, `N8N_HMAC_SECRET`).
- **Assinatura HMAC-SHA256**: Implementar a assinatura de cada payload enviado ao n8n usando HMAC-SHA256 e um timestamp no header para proteção contra replay attacks.
- **Validação de URL**: Restringir a URL do webhook a HTTPS e domínios autorizados.
- **Sanitização de Logs**: Garantir que o `webhook_logs` não armazene dados sensíveis (PII, tokens, etc).

### 2. Retenção e Limpeza de Dados
- **Limpeza do Storage**: Atualizar a rotina de exclusão para remover fisicamente os arquivos do bucket do Supabase, garantindo que o registro no banco só seja removido após o sucesso da exclusão do arquivo.
- **Política de 90 Dias**: Impedir a configuração de prazos menores que 90 dias sem autorização especial e garantir a preservação de snapshots financeiros e logs de auditoria.
- **Alertas de Retenção**: Automatizar o registro de alertas internos com 15 e 3 dias de antecedência antes da expiração de dados operacionais.

### 3. Ação Manual (Painel Administrativo)
- **Prévia de Limpeza**: Substituir a exclusão direta por um modal de prévia que quantifica os registros afetados.
- **Confirmação Forte**: Exigir a digitação da frase `EXCLUIR DADOS EXPIRADOS` para autorizar a limpeza manual de dados fora do prazo de 90 dias.
- **Logs de Auditoria**: Registrar quem executou a limpeza, quando e o volume de dados removido.

## Detalhes Técnicos

### Banco de Dados (SQL)
- Criar tabela `retention_alerts` para controle de notificações.
- Criar função Postgres para exclusão física de arquivos via RPC (integrando com o Storage do Supabase).
- Atualizar `automation_settings` para remover campos sensíveis.

### Servidor (Server Functions)
- `src/lib/automation.server.ts`: Atualizar lógica de assinatura HMAC e leitura de `process.env`.
- `src/lib/automation.functions.ts`: Implementar RPC para prévia de limpeza e execução com confirmação forte.

### UI (React)
- `src/routes/_authenticated/admin/automation.tsx`: Reformular o painel para exibir status de configuração via env vars e logs sanitizados.

## Verificação e Testes
- Validar se o segredo HMAC não vaza para o frontend.
- Testar o fluxo de "Prévia de Limpeza" vs "Execução com Confirmação".
- Simular falha na exclusão do Storage e verificar se o metadado no banco é preservado.
