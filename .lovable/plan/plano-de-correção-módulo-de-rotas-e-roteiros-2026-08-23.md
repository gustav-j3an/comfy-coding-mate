# Plano de Correção: Módulo de Rotas e Roteiros

O diagnóstico inicial revelou que as tabelas `routes`, `route_stops` e `stop_tasks` não possuíam políticas de RLS (Row Level Security) nem permissões de acesso (GRANTs) para usuários autenticados, o que impedia a criação de registros através do frontend, mesmo para administradores.

## Diagnóstico Real
- **Causa Raiz:** Falta de permissões de banco de dados (GRANTs) e políticas de RLS para as tabelas do módulo de rotas. O frontend tentava realizar as inserções, mas o Supabase bloqueava por falta de privilégios.

## Etapa 1: Correção de Banco de Dados
- Aplicar permissões (`GRANT ALL`) para os papéis `authenticated` e `service_role` nas tabelas `routes`, `route_stops` e `stop_tasks`.
- Criar políticas de RLS permitindo que apenas usuários com papel `admin` possam gerenciar (INSERT/UPDATE/DELETE) rotas e suas dependências.
- Criar política de RLS permitindo que promotores visualizem suas próprias rotas.

## Etapa 2: Estabilização do Frontend e Backend
- Corrigir o redirecionamento após a criação de uma rota em `src/routes/_authenticated/admin/routes.new.tsx` para garantir que a listagem seja atualizada.
- Garantir que a função `publishRoute` em `src/lib/routes.functions.ts` opere corretamente com o `supabaseAdmin` para evitar conflitos de RLS durante a geração automática de visitas.

## Arquivos e Tabelas Alterados
- **Tabelas:** `routes`, `route_stops`, `stop_tasks`.
- **Arquivos:** `src/routes/_authenticated/admin/routes.new.tsx`, `src/lib/routes.functions.ts`.
- **SQL:** Aplicação de GRANTs e políticas de RLS.

## Validação e Testes
1. Criar uma rota com um promotor e uma loja (Admin).
2. Criar uma rota com múltiplas paradas no mesmo dia (Admin).
3. Verificar se a rota aparece imediatamente na listagem `/admin/routes`.
4. Verificar se as visitas planejadas são geradas no roteiro do promotor.
5. Tentar criar rota sem campos obrigatórios (deve falhar no frontend).
6. Tentar acesso/criação com usuário não-Admin (deve falhar por RLS).
