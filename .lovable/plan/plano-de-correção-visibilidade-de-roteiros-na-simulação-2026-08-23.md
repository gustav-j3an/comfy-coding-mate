# Plano de Correção: Visibilidade de Roteiros na Simulação

A visão "Visualizar como Promotor" não exibe paradas planejadas que ainda não foram materializadas na tabela `visits`. O objetivo é garantir que, ao simular um dia da semana, o administrador veja todas as paradas configuradas no roteiro publicado, mesmo sem execução real.

## Problema
A query atual em `src/routes/_authenticated/promoter/index.tsx` tenta buscar visitas materializadas ou paradas teóricas. Para o roteiro do Lucas, as paradas teóricas não estão aparecendo corretamente por causa de falhas na query de roteiros ativos ou na lógica de merge.

## Ações

### 1. Investigação e Diagnóstico (Automático)
- Verificar no banco se o roteiro do LUCAS está com `status = 'published'` e `active = true`.
- Confirmar se `route_stops` para segunda-feira (day_of_week = 1) existem.

### 2. Ajuste na Lógica de Simulação
- Modificar `src/routes/_authenticated/promoter/index.tsx`:
    - Refinar a query de `activeRoutes` para garantir que pegue o roteiro correto do promotor.
    - Garantir que a lógica de `theoreticalVisits` inclua detalhes como endereço da loja e nome da indústria.
    - Adicionar o selo visual "Visita planejada" ou "Prévia do roteiro" para itens teóricos.

### 3. Melhoria na UI da Agenda
- Exibir a ordem da parada, nome da loja (SUPER ADEGA QNL), endereço e indústria.
- Garantir que a mensagem de "Nenhuma visita planejada" só apareça se realmente não houver nada no planejamento.

### 4. Segurança e Integridade
- Validar no componente que o `previewPromoter` só permite leitura.
- Assegurar que o botão "Iniciar Visita" e links para detalhes de visita tratem o ID teórico (ex: `theoretical-...`) ou fiquem desabilitados com mensagem informativa.

## Detalhes Técnicos
- Arquivo: `src/routes/_authenticated/promoter/index.tsx`
- Mudança na `queryFn` do `useSuspenseQuery`:
  - Se `previewPromoter` estiver ativo, a busca deve priorizar a estrutura de `route_stops` do roteiro publicado.
  - Combinação robusta entre `materialized` e `theoretical`.
