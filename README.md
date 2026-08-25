# Rota do Promotor

Sistema de gestão de promotores, rotas e operações de trade marketing.

## Desenvolvimento local

Requisitos: Node.js 20+ e uma instância Supabase.

```sh
npm install
npm run dev
```

Configure as variáveis de ambiente em `.env` ou `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
VITE_PUBLIC_APP_URL=http://localhost:3000
```

Obtenha `SUPABASE_SERVICE_ROLE_KEY` no Supabase em **Project Settings > API > service_role**. Depois de alterar o arquivo, pare e reinicie `npm run dev` para o servidor carregar a nova variável.

Nunca publique `SUPABASE_SERVICE_ROLE_KEY` no frontend ou no repositório.

## Produção

```sh
npm run build
npm run preview
```
