# Missão 1: Cadastros Reais de Promotores, Lojas e Indústrias

Objetivo: Implementar módulos de CRUD funcionais e seguros para as entidades fundamentais do sistema, garantindo integridade de dados e proteção administrativa.

## Mudanças no Banco de Dados

### 1. Promores
- Já existe a tabela `promoters`.
- Adicionar RLS para permitir `DELETE` apenas para administradores.
- Adicionar trigger para evitar exclusão de promotores com vínculos ativos (visitas/roteiros).

### 2. Lojas
- Já existe a tabela `stores`.
- Garantir que todos os campos de endereço (`number`, `complement`, `neighborhood`, `zip_code`, `latitude`, `longitude`) estejam presentes.
- Adicionar RLS para `DELETE` admin-only.

### 3. Indústrias
- Já existe a tabela `industries`.
- Garantir campos como `cnpj`, `contact_name`, `email`, `phone`.
- Adicionar RLS para `DELETE` admin-only.

## Módulos Frontend (Admin)

### 1. Promotores (`admin/promoters.tsx`)
- Implementar formulário de criação/edição em modal ou drawer.
- Listagem com busca por nome/email e filtro de status.
- Ações: Editar, Inativar/Ativar, Excluir (com confirmação e validação de vínculos).
- Vincular `promoters` a `profiles` via `promoter_id` (exibindo se tem login).

### 2. Lojas (`admin/stores.tsx`)
- Formulário completo de endereço com validações Zod.
- Listagem com busca e filtro de status.
- Ações: Editar, Inativar, Excluir.
- Exibir contagem de visitas (via join ou RPC).

### 3. Indústrias (`admin/industries.tsx`)
- Formulário completo (CNPJ, Contato, etc).
- Listagem com métricas mensais.
- Ações: Editar, Inativar, Excluir, Acesso à visão da indústria.

## Segurança e Qualidade
- Todas as rotas sob `_authenticated/admin/` já estão protegidas.
- Validação de campos obrigatórios via Zod no frontend.
- Mensagens de sucesso/erro via `sonner`.
- Diálogos de confirmação (`AlertDialog`) para exclusões.

## Testes Automatizados (Playwright)
- Script para criar, editar e tentar excluir um registro com e sem vínculos.
