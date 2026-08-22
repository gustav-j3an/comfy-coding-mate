# Missão 6 - Exportações, Backup e Pacote de Evidências

O objetivo desta missão é permitir que administradores e indústrias exportem seus dados (relatórios, visitas, evidências) em formatos estruturados (XLSX) e pacotes de arquivos (ZIP), garantindo a soberania dos dados antes do prazo de 90 dias.

## Mudanças Propostas

### Backend e Dados
- **Tabela `export_tasks`**: Já criada via migração, rastreia solicitações de exportação.
- **Storage `exports`**: Balde privado para armazenar os arquivos gerados.
- **Server Functions (`src/lib/exports.functions.ts`)**:
    - `createExportTask`: Solicita uma nova exportação.
    - `getExportTasks`: Lista o histórico de exportações.
    - `getDownloadUrl`: Gera link assinado para download.
- **API Segura**: O endpoint de PDF foi movido para `/api/reports.pdf.ts` e agora exige autenticação.

### Frontend
- **Interface de Exportação**:
    - Nova aba/módulo em `/admin/reports` ou uma nova rota `/admin/exports`.
    - Filtros por data, indústria e promotor.
    - Seleção de formato (XLSX para dados estruturados, ZIP para fotos).
- **Portal da Indústria**:
    - Adição de botão "Exportar Tudo" no dashboard da indústria.
    - Histórico de exportações solicitadas pela indústria.

### Segurança
- **RLS**: Indústrias só veem suas próprias exportações. Administradores veem tudo.
- **Exclusão Automática**: Arquivos expiram e são removidos após 7 dias (lógica via `cleanup_expired_exports`).
- **Audit Log**: Cada download é registrado com timestamp e contador.

## Detalhes Técnicos

### Estrutura do Arquivo ZIP (Evidências)
```text
export_id_data/
├── relatorio_consolidado.xlsx
├── visitas/
│   ├── visita_ID_LOJA_DATA.pdf
│   └── evidencias/
│       ├── foto_1.jpg
│       └── foto_2.jpg
└── ocorrencias/
    └── comprovante_ID.jpg
```

### Bibliotecas Utilizadas
- `xlsx`: Para geração de planilhas.
- `jszip`: Para criação de pacotes ZIP no servidor.
- `@supabase/supabase-js`: Para interação com o Storage e Banco de Dados.

### Fluxo de Execução
1. Usuário solicita exportação -> Grava tarefa como `solicitada`.
2. (Simulado) Processamento gera o arquivo -> Upload para Storage -> Status `pronta`.
3. Usuário clica em baixar -> Gera URL assinada de 1 hora -> Incrementa contador de downloads.
