# Plano de Implementação - Missão 4

Padronização de integridade de dados e implementação do módulo de execução de visitas do promotor com evidências (fotos/vídeos/PDFs) e geolocalização.

## 1. Padronização de Integridade (Schema Definitivo)

Resolver a ambiguidade entre `promoters.id` e `profiles.id` (Auth User).

- **Tabelas:**
  - `promoters`: Cadastro de recursos (nomes, contatos, regiões).
  - `profiles`: Extensão do `auth.users`, contém o vínculo com `promoter_id`.
  - `visits`: Deve ser vinculada ao `promoters.id` para planejamento e ao `auth.uid()` (ou `profiles.id`) para execução.

- **Alterações SQL:**
  - Criar bucket de storage privado: `visit-evidences`.
  - Adicionar coluna `executor_id` (UUID, FK para `profiles.id`) na tabela `visits`.
  - Adicionar coluna `checkin_at`, `checkout_at` (timestamptz) na tabela `visits`.
  - Adicionar colunas de geolocalização real na execução: `execution_latitude`, `execution_longitude`.
  - RLS para o bucket: Promotores (apenas suas visitas), Admins (tudo), Indústrias (apenas suas evidências via join).

## 2. Rota do Promotor (`/promoter`)

- **Dashboard do Promotor:**
  - Resumo do dia: Total de visitas, realizadas, pendentes.
  - Listagem de visitas ordenadas por `visit_order`.
  - Status visíveis: Prevista, Em andamento, Enviada, Aprovada, Reprovada.

- **Fluxo de Registro de Visita:**
  - Tela de execução detalhada.
  - Captura de fotos/vídeos/anexo de PDFs.
  - Registro de geolocalização automática.
  - Tratamento de ocorrências (ruptura, validade, etc.).

## 3. Conferência Administrativa

- **Visualização de Evidências:**
  - Gerar URLs assinadas temporárias para arquivos no storage privado.
  - Interface de auditoria com aprovação/reprovação.
  - Registro de motivo de reprovação.

## Detalhes Técnicos

- **Componentes:**
  - `EvidenceCapture`: Componente reutilizável para fotos/vídeos/arquivos.
  - `VisitExecutionCard`: UI para o promotor registrar progresso.
  - `AuditDialog`: Modal para administrador aprovar/reprovar.
- **Server Functions:**
  - `submitVisit`: Processa metadados, cria ocorrências e muda status.
  - `auditVisit`: Registra decisão administrativa.
  - `getSignedUrl`: Gera link seguro para visualização de arquivos.
- **Hooks:**
  - `useGeolocation`: Para capturar coordenadas GPS.
