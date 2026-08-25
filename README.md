# Rota do Promotor

Sistema de gestão de promotores, rotas e operações de trade marketing.

## Desenvolvimento local

Requisitos: Node.js 20+ e uma instância Supabase.

```sh
npm install
npm run dev
```

Antes de publicar no Lovable, execute `npm run verify`. O comando roda o typecheck, lint, build e testes existentes nessa ordem. Corrija qualquer erro antes de fazer commit e publicar.

Fluxo curto: desenvolver, executar `npm run verify`, corrigir erros, fazer commit e publicar no Lovable.

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
npm run start
# ou, para o preview integrado do Vite:
npm run preview
```

## Vercel

Configure o projeto da Vercel com **Root Directory** igual à pasta que contém
este `package.json` (`comfy-coding-mate` neste repositório), **Build Command**
`npm run build` e **Install Command** conforme o lockfile usado no projeto.
Não defina **Output Directory** nem um rewrite para `index.html`: o plugin
`nitro/vite` gera `.output` com o handler SSR, assets e configuração do Build
Output API. Na Vercel, o preset `vercel` é detectado automaticamente.

Cadastre no painel da Vercel as variáveis de `.env.example` para Production,
Preview e Development conforme necessário. `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_PUBLIC_APP_URL` são públicas;
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e principalmente
`SUPABASE_SERVICE_ROLE_KEY` são usadas server-side. Nunca publique valores
reais no repositório.
