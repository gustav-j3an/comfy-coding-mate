# Missão de Recuperação Controlada — Rota `/promoter`

O objetivo é restaurar a estabilidade da rota `/promoter` após relatos de "página branca" (white screen / This page didn't load), identificando a causa raiz sem comprometer os dados do banco.

## Etapa 1: Diagnóstico e Isolamento
- Verificar logs de build e runtime (`/tmp/observability/build-errors.log`).
- Investigar `src/routes/_authenticated/promoter/index.tsx` em busca de falhas de renderização silenciosas ou erros de SSR.
- Confirmar se o erro é no lado do servidor (Hydration mismatch/Server Function error) ou no cliente.

## Etapa 2: Recuperação da Estabilidade
- Garantir que `useSuspenseQuery` não silencie erros de forma que quebre o fluxo de dados.
- Implementar um `ErrorBoundary` robusto em torno do conteúdo do dashboard para evitar falhas totais na página.
- Validar se a agenda de Gustavo (Domingo: Atacadão - Asa Norte, Segunda: Super Adega QNL) é carregada corretamente.

## Etapa 3: Validação Rigorosa
- Executar `build` e verificar ausência de erros.
- Testar carregamento e recarregamento da rota `/promoter`.
- Validar indicadores semanais (Total: 2, Feitas: 0, Faltam: 2 para a agenda de Gustavo).

## Detalhes Técnicos
- **Error Handling:** Uso de `ErrorBoundary` do `@tanstack/react-router` ou componente customizado.
- **Data Flow:** Ajuste na lógica de agrupamento de PDVs para evitar duplicação ou inconsistência visual.
- **Constraints:** Não alterar esquema do banco de dados ou dados existentes.
