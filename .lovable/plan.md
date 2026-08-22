# Missão 6 — Exportações, Backup e Pacote de Evidências

Este plano implementa um sistema robusto de exportação de dados (Excel, CSV, JSON, PDF e ZIP) com foco em privacidade, auditoria e retenção de 90 dias.

## Mudanças no Banco de Dados

### Tabelas e Segurança
- Criar tabela `export_tasks` para rastrear solicitações de exportação.
- Criar tabela `audit_logs` para registrar ações sensíveis (opcional, ou usar logs de exportação).
- Configurar RLS em `export_tasks` para garantir que indústrias vejam apenas suas exportações.

### Bucket de Storage
- Criar bucket `exports` privado para armazenar os arquivos gerados.
- Configurar políticas de acesso baseadas no criador da exportação.

## Implementação Técnica

### Backend (Server Functions & Routes)
1.  **Renomear Endpoint de PDF:** Mover `/api/public/reports/pdf` para `/api/reports/pdf` e adicionar validação de sessão obrigatória via `requireSupabaseAuth`.
2.  **Processador de Exportação:** Criar `src/lib/exports.functions.ts` para:
    - Solicitar nova exportação (inserção em `export_tasks`).
    - Gerar arquivos (XLSX via `xlsx`, ZIP via `jszip` ou similar).
    - Consultar status do processamento.
3.  **Endpoint de Download:** Rota que serve links assinados e temporários (7 dias).

### Frontend (Admin & Industry)
1.  **Módulo de Exportações:** Tela centralizada `/admin/exports` e `/industry/exports`.
2.  **Formulário de Filtros:** Componente reutilizável com filtros de data, indústria, promotor, loja, etc.
3.  **Lista de Tarefas:** Exibição do status das exportações (Solicitada, Processando, Pronta, Expirada).
4.  **Botões de Ação:** "Solicitar Exportação" e "Baixar" (quando pronta).

## Segurança e Auditoria
- Registro de auditoria em cada etapa: solicitação, processamento e download.
- Validação estrita de escopo (indústria só exporta dados da própria indústria).
- Links temporários com expiração forçada.

## Próximos Passos
1.  Executar migração SQL para `export_tasks`.
2.  Renomear e proteger a rota de PDF.
3.  Implementar a lógica de geração de planilhas e ZIP.
4.  Construir as interfaces de usuário.
