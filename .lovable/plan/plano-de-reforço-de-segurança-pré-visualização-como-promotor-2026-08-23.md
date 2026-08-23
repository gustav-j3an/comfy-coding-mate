# Plano de Reforço de Segurança — Pré-visualização como Promotor

Este plano detalha as alterações para validar a autorização no servidor e garantir que o modo de pré-visualização seja seguro e restrito a administradores.

## Alterações Técnicas

### 1. Backend: Validação Autoritativa de Admin
- **Arquivo:** `src/lib/execution.functions.ts` e `src/lib/routes.functions.ts` (e qualquer outra server function usada na visualização).
- **Ação:** Em cada `createServerFn` que aceite ou use o contexto de um promotor, adicionar uma verificação explícita no handler:
  ```typescript
  const { data: userRole } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  const isAdmin = userRole?.role === 'admin';
  const effectivePromoterId = isAdmin && data.previewPromoterId ? data.previewPromoterId : actualUserPromoterId;
  ```
- **Segurança:** O servidor ignorará o `previewPromoterId` se o usuário logado não for um admin.

### 2. Backend: Bloqueio de Escrita na Pré-visualização
- **Arquivo:** `src/lib/execution.functions.ts`.
- **Ação:** Nas funções `submitVisit` e `auditVisit`, adicionar uma trava que impede a execução se um `previewPromoterId` for detectado no input, garantindo o estado "somente leitura".

### 3. Frontend: Limpeza de Contexto e Segurança de Persistência
- **Arquivo:** `src/lib/auth/auth-context.tsx`.
- **Ação:** 
  - Atualizar `signOut` para garantir que `previewPromoter` seja definido como `null`.
  - Garantir que o `previewPromoter` não seja salvo no `localStorage` persistente (ele já é apenas estado de memória, mas vou revisar se há algum `useEffect` escondido).
  - Adicionar um listener no `onAuthStateChange` para limpar o preview se o usuário mudar.

### 4. Frontend: Bloqueio de Acesso a Rotas
- **Arquivo:** `src/routes/_authenticated/promoter/index.tsx` e `src/routes/_authenticated/promoter/visit.$visitId.tsx`.
- **Ação:** Garantir que o `useSuspenseQuery` envie o token de admin e que o backend valide a permissão antes de retornar dados de terceiros.

## Testes de Validação
1. **Admin Real:** Iniciar visualização e ver apenas os dados do promotor alvo.
2. **Promotor Malicioso:** Tentar injetar um `previewPromoterId` via console/network e verificar se o backend retorna apenas os próprios dados dele.
3. **Indústria Maliciosa:** Tentar o mesmo e verificar se o backend bloqueia o acesso.
4. **Escrita:** Tentar enviar uma visita durante o preview e receber erro do servidor.
5. **Logout:** Verificar se ao deslogar e logar com outra conta, o modo de visualização sumiu.
