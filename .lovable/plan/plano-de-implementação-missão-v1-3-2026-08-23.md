# Plano de Implementação — Missão V1.3

Implementação da Agenda Semanal Real no visualizador administrativo (`/admin/visualizar-promotor`), permitindo que o administrador veja a programação teórica do promotor por dia da semana com base nos roteiros ativos.

## Alterações Técnicas

### 1. Interface (Frontend)
- **Arquivo**: `src/routes/_authenticated/admin/visualizar-promotor.tsx`
- **Estado**: Adicionar `selectedDay` (número de 0 a 6, iniciando com o dia atual).
- **Componentes**:
  - Criar seção "Agenda semanal de [nome]".
  - Adicionar fileira de botões (SEG, TER, QUA, QUI, SEX, SÁB, DOM).
  - Mapear os dias: 1 (SEG) até 0 (DOM).
- **Lógica de Filtro**:
  - Filtrar `routes` para manter apenas `status === 'published'` e `active !== false`.
  - Achatar todas as paradas (`route_stops`) dos roteiros válidos.
  - Filtrar paradas pelo `day_of_week` selecionado.
  - Aplicar lógica de frequência:
    - `weekly`: Sempre exibe.
    - `biweekly`: Compara a semana atual com a `biweekly_start_date` (ou `valid_from` do roteiro) para determinar se é a semana A ou B.
  - Ordenar por `visit_order`.

### 2. Exibição de Parada
- Card detalhado para cada parada encontrada:
  - Ordem de visita.
  - Nome e endereço da loja.
  - Indústria e Frequência.
  - Observação operacional.
  - Badge "Prévia do roteiro".
  - Nome do roteiro de origem.

### 3. Validação e Segurança
- Manter validação server-side de Admin.
- Garantir que roteiros arquivados ou pausados não apareçam na agenda ativa.
- Exibir mensagem clara de "Nenhuma parada programada" quando o dia estiver vazio.

## Regras de Negócio
- **Dia da Semana**: 0=Domingo, 1=Segunda... 6=Sábado.
- **Frequência Quinzenal**: Calculada com base na diferença de semanas entre a data atual e a data de referência (segunda-feira da semana de início).
- **Vigência**: Roteiros só valem se `valid_from` <= hoje.

## Testes
- Validar se Lucas exibe "SUPER ADEGA QNL" na Segunda-feira.
- Verificar se a troca de dia atualiza a lista corretamente.
- Confirmar que o isolamento por promotor permanece.
