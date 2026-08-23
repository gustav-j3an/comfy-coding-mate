# Auditoria e Correção de Segurança

Este plano descreve a análise e correção dos 10 alertas de segurança identificados no painel do Lovable, priorizando RLS, validações de servidor e proteção de dados.

## Alertas Identificados e Classificação

1. **RLS Disabled in Public (ERRO - Crítico)**
   - **Tabelas:** `retention_alerts`, `cleanup_audit`.
   - **Causa:** RLS não habilitado nestas tabelas no schema public.
   - **Risco:** Acesso total via PostgREST.

2. **Public Can Execute SECURITY DEFINER Function (WARN - Alto)**
   - **Funções:** `is_admin`, `can_delete_promoter`, `can_delete_store`, `can_delete_industry`, `get_admin_count`, `is_last_admin`, `has_role`, `can_access_evidence`, `cleanup_expired_data`, `cleanup_expired_exports`, `delete_user_safely`.
   - **Causa:** Permissão `EXECUTE` concedida ao papel `public` em funções sensíveis.
   - **Risco:** Invocação por usuários não autenticados via API.

3. **Signed-In Users Can Execute SECURITY DEFINER Function (WARN - Médio)**
   - **Funções:** As mesmas do item anterior.
   - **Causa:** Permissão `EXECUTE` concedida a usuários autenticados (`authenticated`).
   - **Risco:** Usuários com papéis restritos (promotores/indústria) invocando funções administrativas.

4. **RLS Enabled No Policy (INFO - Baixo)**
   - **Tabela:** `cleanup_audit` (após habilitar RLS).
   - **Causa:** RLS ativo mas sem políticas definidas.
   - **Risco:** Acesso negado por padrão (seguro), mas precisa de políticas se o app for ler/escrever.

5. **Function Search Path Mutable (WARN - Médio)**
   - **Funções:** `can_access_evidence`, `sync_occurrence_industry`, `update_updated_at_column`.
   - **Causa:** `search_path` não definido explicitamente nestas funções.
   - **Risco:** Ataques de "shadowing" de objetos em diferentes schemas.

6. **Leaked Password Protection Disabled (WARN - Baixo)**
   - **Local:** Configuração do Supabase Auth.
   - **Causa:** Proteção contra senhas vazadas desativada.
   - **Risco:** Uso de senhas inseguras/expostas em outros vazamentos.

## Ações de Correção

### 1. Segurança de Banco de Dados (SQL Migration)

- **RLS:** Habilitar RLS nas tabelas faltantes e criar políticas restritivas.
- **Grants:** Revogar `EXECUTE` de `public` e `anon` para funções sensíveis.
- **Search Path:** Fixar `search_path = public` em todas as funções `SECURITY DEFINER`.

```sql
-- 1. Habilitar RLS
ALTER TABLE public.retention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_audit ENABLE ROW LEVEL SECURITY;

-- 2. Revogar acessos públicos a funções
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- 3. Corrigir Search Path
ALTER FUNCTION public.can_access_evidence SET search_path = public;
ALTER FUNCTION public.sync_occurrence_industry SET search_path = public;
```

### 2. Validações de Servidor (TypeScript)

- Revisar `src/lib/users.functions.ts` e garantir que `requireSupabaseAuth` e verificações de `isAdmin` estão presentes em todas as funções que utilizam `supabaseAdmin`.

### 3. Página de Status

- Restaurar `src/routes/index.tsx` para o estado operacional limpo.

## Testes e Validação

- **Admin:** Validar gestão de usuários, indústrias e lojas.
- **Promotor:** Validar que não consegue invocar funções de exclusão ou auditoria.
- **Não Autenticado:** Validar que todas as funções RPC retornam 401 ou erro de permissão.
- **Linter:** Rodar `supabase--linter` novamente para confirmar a resolução dos alertas.

## Detalhes Técnicos
- Utilização de `REVOKE EXECUTE ON ALL FUNCTIONS` para garantir "deny-by-default".
- Aplicação de `GRANT EXECUTE` granular apenas para o que o frontend realmente precisa chamar (como `has_role` para interface reativa).
- Manutenção da política de `service_role` com acesso total para funções server-side do TanStack Start.
