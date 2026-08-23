# Plano de Correção: Integridade Referencial em Rotas e Visitas

O erro `routes_promoter_id_fkey` ocorre porque o formulário de roteiros está enviando o ID da tabela `promoters`, enquanto o banco de dados (tabela `routes`) exige o ID da tabela `auth.users` (ou `profiles`). Além disso, há uma inconsistência entre as tabelas `routes` e `visits`, onde a primeira usa o User ID e a segunda usa o Promoter ID.

## Alterações Propostas

### 1. Banco de Dados (Schema)
* Ajustar as Foreign Keys para que tanto `routes` quanto `visits` apontem consistentemente para a tabela `promoters(id)`. Isso reflete a lógica de negócio onde uma rota pertence a uma entidade "Promotor", e não diretamente a um "Usuário do Auth".
* Garantir que as permissões (GRANTs) e políticas de RLS permitam que administradores gerenciem esses registros.

### 2. Backend (Server Functions)
* **`src/lib/routes.functions.ts`**: Atualizar a lógica de `publishRoute` para lidar com a nova estrutura, garantindo que a geração de visitas herde corretamente o ID do promotor da rota.

### 3. Frontend (Editor de Rotas)
* **`src/routes/_authenticated/admin/routes_new.tsx`**: Manter o uso do ID de promotor selecionado no `Select`, que agora será compatível com a nova constraint do banco.
* Adicionar logs de depuração para facilitar a rastreabilidade em caso de erros futuros.

## Detalhes Técnicos
* Alteração da constraint `routes_promoter_id_fkey` para referenciar `public.promoters(id)`.
* Sincronização da lógica de RLS em `routes` para permitir acesso baseado no vínculo entre `profiles` e `promoters`.
