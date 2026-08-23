# Plano de Ação - Missão: Convite Manual pelo WhatsApp (Sem API)

Implementação de um fluxo seguro para geração de links de convite e abertura direta do WhatsApp com mensagem pré-preenchida, permitindo que administradores enviem convites manualmente.

## Alterações Técnicas

### 1. Backend (Server Functions)
- **Arquivo:** `src/lib/users.functions.ts`
- **Nova Função:** `generateWhatsAppInvite`
  - Valida permissão de Admin.
  - Valida existência do promotor e telefone válido.
  - Gera link de convite (recovery/invite) via Supabase Admin SDK.
  - Retorna link seguro, nome do promotor e telefone normalizado.
  - Implementa lógica de invalidação de tokens anteriores.

### 2. Frontend (Interface Administrativa)
- **Arquivo:** `src/routes/_authenticated/admin/users.tsx`
- **Mudanças:**
  - Atualizar `copyWhatsAppInvite` (ou criar `handleWhatsAppInvite`) para chamar a nova função de servidor.
  - Implementar normalização de telefone (formato 55 + DDD + número).
  - Adicionar diálogo de confirmação antes de redirecionar para o WhatsApp.
  - Abrir `https://wa.me/[telefone]?text=[mensagem]` em nova aba.
  - Registrar auditoria local (apenas log de ação).

### 3. Banco de Dados e Segurança
- **Auditoria:** Registrar a geração do link na tabela `admin_audit_logs`.
- **Segurança:** O link será gerado no servidor usando `supabaseAdmin` para evitar exposição de chaves e garantir que a expiração e o uso único sejam gerenciados pelo Supabase Auth.

## Detalhes de Implementação

- **Normalização de Telefone:** Remoção de caracteres não numéricos e adição do prefixo `55`.
- **Link de Acesso:** Apontará para `[SITE_URL]/auth/callback?next=/primeiro-acesso`.
- **Mensagem do WhatsApp:** Codificada em URI para garantir compatibilidade com caracteres especiais e emojis.

## Testes de Validação
1. Gerar convite para promotor com telefone válido.
2. Verificar redirecionamento para URL wa.me correta.
3. Confirmar que o link gerado usa o domínio público (preview).
4. Validar que promotores/indústrias não conseguem acessar a função.
5. Testar comportamento com telefone inválido ou ausente.
