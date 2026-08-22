# Missão 7: Contratos e Faturamento

Implementar o módulo comercial para gerenciar contratos com indústrias e automatizar o faturamento mensal baseado em visitas aprovadas.

## Schema do Banco de Dados

### 1. Tabela `contracts`
Armazena os termos comerciais acordados com cada indústria.
- `id` (uuid, PK)
- `industry_id` (uuid, FK para `industries`)
- `contract_number` (text)
- `start_date` (date)
- `end_date` (date, null)
- `status` (enum: `draft`, `active`, `terminated`)
- `value_per_visit` (numeric)
- `min_monthly_visits` (integer, null)
- `billing_day` (integer)
- `billing_details` (text)
- `commercial_responsible` (text)
- `notes` (text)
- Timestamps

### 2. Tabela `billings`
Armazena as faturas/cobranças geradas.
- `id` (uuid, PK)
- `billing_number` (text, único)
- `industry_id` (uuid, FK)
- `contract_id` (uuid, FK)
- `competence_month` (integer)
- `competence_year` (integer)
- `approved_visits_count` (integer)
- `unit_value` (numeric)
- `subtotal` (numeric)
- `discount` (numeric)
- `increase` (numeric)
- `total_value` (numeric)
- `due_date` (date)
- `status` (enum: `draft`, `issued`, `sent`, `paid`, `overdue`, `cancelled`)
- `payment_link` (text, null)
- `attachment_url` (text, null) - Storage bucket `billings`
- `admin_id` (uuid, FK para `profiles`)
- `adjustment_reason` (text, null)
- `cancellation_reason` (text, null)
- Timestamps

### 3. Tabela `billing_items` (Snapshot)
Snapshot das visitas que compõem uma cobrança.
- `id` (uuid, PK)
- `billing_id` (uuid, FK)
- `visit_id` (uuid, FK)
- `store_name` (text)
- `promoter_name` (text)
- `visit_date` (timestamp)
- `approved_at` (timestamp)

## Etapas de Implementação

### Fase 1: Fundação e Estrutura
- Criar migração SQL para as tabelas `contracts`, `billings` e `billing_items`.
- Configurar RLS: indústrias só leem seus próprios contratos/cobranças; admins têm acesso total.
- Criar bucket de storage `billings` para anexos (PDF/Boletos).
- Registrar trilhas de auditoria para mudanças de status financeiro.

### Fase 2: Módulo Administrativo - Contratos
- Interface CRUD para contratos em `/admin/contracts`.
- Lógica de ativação/encerramento e duplicação de contratos.
- Validação para garantir que não existam dois contratos ativos para a mesma indústria no mesmo período.

### Fase 3: Módulo Administrativo - Cobranças
- Dashboard financeiro com indicadores (Total a faturar, pago, vencido).
- Fluxo de "Nova Cobrança":
  - Seleção de indústria e competência.
  - Cálculo automático de visitas aprovadas via server function.
  - Edição de rascunho com justificativa.
  - Geração de snapshot (`billing_items`) ao emitir.

### Fase 4: Portal da Indústria
- Nova área `/industry/billing`.
- Lista de cobranças com filtros por status e competência.
- Visualização detalhada (fatura + checklist de visitas cobradas).
- Download de documentos.

### Fase 5: Integração e Retenção
- Vincular cobrança emitida ao relatório mensal correspondente.
- Alerta de retenção de dados: cobranças e checklists financeiros devem seguir a política de retenção administrativa.
- Impedir exclusão de visitas vinculadas a cobranças emitidas.

## Detalhes Técnicos
- **Server Functions**: Lógica centralizada para cálculo de faturamento e geração de snapshot.
- **Segurança**: RLS rigoroso em todas as tabelas comerciais.
- **Auditoria**: Log de todas as ações críticas (emissão, pagamento, cancelamento).
