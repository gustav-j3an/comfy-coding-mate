# Plano de Correção: Redirecionamento de Convites Supabase

A causa do problema foi identificada: as funções de servidor que geram convites e redefinições de senha no Supabase dependem de URLs configuradas manualmente que, em ambientes de desenvolvimento ou preview sem a variável `SITE_URL` definida, podem falhar ou apontar para locais incorretos. Além disso, a configuração do Supabase no dashboard do usuário precisa ser alinhada com as URLs do projeto no Lovable.

## Alterações Técnicas

### 1. Servidor (Server Functions)
- **Arquivo:** `src/lib/users.functions.ts`
- **Ação:** Refatorar a lógica de construção da `siteUrl`. Atualmente ela tenta ler `process.env['SITE_URL']` e falha para `https://project--${projectId}.lovable.app`.
- **Melhoria:** Garantir que a URL de redirecionamento para convites e redefinições seja sempre absoluta e aponte para o domínio público atual, preferencialmente detectado dinamicamente ou via configuração segura.

### 2. Fluxo de Autenticação (Callback)
- **Ação:** Criar ou atualizar a rota de callback para processar o `next` parameter e garantir que, após a confirmação do e-mail/token, o usuário seja levado para `/primeiro-acesso`.

### 3. Interface Administrativa
- **Arquivo:** `src/routes/_authenticated/admin/users.tsx`
- **Ação:** Verificar se os botões de "Copiar Link" e "WhatsApp" estão gerando URLs baseadas em `window.location.origin` corretamente para o ambiente de preview.

### 4. Instruções de Configuração no Supabase
- Fornecer um guia passo a passo para o usuário configurar o `Site URL` e `Redirect URLs` no dashboard do Supabase, já que o agente não tem permissão para alterar essas configurações externas diretamente.

## Configurações no Supabase (Ação do Usuário)
Para que o redirecionamento funcione, o usuário deve acessar o dashboard do Supabase e configurar:
1. **Site URL:** `https://id-preview--5928d4ca-7473-4651-beae-377d6a376863.lovable.app`
2. **Additional Redirect URLs:**
   - `https://id-preview--5928d4ca-7473-4651-beae-377d6a376863.lovable.app/**`
   - `http://localhost:8080/**` (apenas para testes locais se necessário)
