# Plano de Implementação — Missão V1.2

Leitura real de roteiros e paradas no novo visualizador administrativo (`/admin/visualizar-promotor`), garantindo que os dados exibidos venham diretamente da estrutura de roteiros do banco de dados, sem depender da tabela de visitas.

## Alterações Técnicas

### 1. Servidor e Dados (Server Functions)
- Criar a função `getPromoterItineraryData` em `src/lib/routes.functions.ts` (ou similar).
- **Segurança**: Validar papel de Admin via RPC `has_role` no servidor.
- **Consulta**:
  - Buscar na tabela `routes` todos os roteiros do `promoter_id` informado.
  - Fazer join com `route_stops` (paradas) e `stores` (dados da loja).
  - Fazer join com `stop_tasks` e `industries` (para saber a indústria de cada parada).
  - Retornar: nome do roteiro, status, vigência, data de alteração e a lista detalhada de paradas.

### 2. Interface (Frontend)
- Atualizar `src/routes/_authenticated/admin/visualizar-promotor.tsx`:
  - Utilizar a nova server function no `useSuspenseQuery` para carregar os dados reais.
  - Substituir o card "Visualizador em preparação" pela listagem real.
  - **Estrutura Visual**:
    - Título: `Roteiros encontrados para [Nome do Promotor]`
    - Iterar sobre os roteiros retornados.
    - Para cada roteiro: Mostrar Card com Nome, Status (Ativo/Publicado/Arquivado), Vigência e Contador de Paradas.
    - Listagem de Paradas: Tabela ou lista simples formatada: `Dia da Semana — Loja — Indústria — Frequência`.

### 3. Validação e Testes
- Confirmar se o roteiro "LUCAS" aparece com status "Publicado".
- Confirmar se a parada "SUPER ADEGA QNL" com "Indústria King" na "Segunda-feira" é exibida corretamente.
- Testar com diferentes promotores para garantir o isolamento.

## Tabelas e Relacionamentos
- `routes`: Fonte principal (id, name, status, valid_from, promoter_id).
- `route_stops`: Paradas vinculadas (day_of_week, frequency, store_id, route_id).
- `stores`: Nome e endereço da loja.
- `stop_tasks`: Ligação entre parada e indústria.
- `industries`: Nome da indústria.

## Segurança
- Validação Admin obrigatória no loader.
- Filtro estrito por `promoter_id`.
- Somente leitura: nenhuma ação de escrita será implementada nesta fase.
