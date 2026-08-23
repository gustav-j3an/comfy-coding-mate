# Plano de Implementação: Ligação do Roteiro Real e Execução de Visita

Este plano visa corrigir a divergência entre o visualizador administrativo e o aplicativo do promotor, garantindo uma fonte única e autoritativa de agenda para o promotor Gustavo, além de implementar o fluxo completo de execução de visita por indústria.

## Alterações Técnicas

### 1. Funções do Servidor (Backend)
- **Criar `getPromoterAgenda` em `src/lib/execution.functions.ts`**:
  - Função única e protegida para buscar a agenda.
  - Recebe `date` (ISO string) e resolve o `promoter_id` a partir do `auth.uid()` do contexto.
  - Consulta `visits` (realizadas/materializadas) e `routes` (planejamento publicado).
  - Regra de união: Se houver visita materializada para a mesma Loja + Indústria + Data, ela sobrepõe a parada teórica do roteiro.
  - Retorna uma lista unificada com status: `planned`, `pending`, `submitted`, etc.
- **Refatorar `submitVisit` em `src/lib/execution.functions.ts`**:
  - Garantir que a visita seja vinculada corretamente a `promoter_id`, `store_id`, `industry_id` e `route_id`.
  - Adicionar suporte a múltiplas indústrias na mesma parada (caso necessário, ou garantir que o loop de submissão no front funcione).

### 2. Interface do Promotor (Frontend Mobile)
- **Atualizar `src/routes/_authenticated/promoter/index.tsx`**:
  - Substituir a consulta direta ao Supabase pela chamada à função `getPromoterAgenda`.
  - Garantir que a barra de dias (SEG-DOM) reflita corretamente a data completa (vigência real).
  - Exibir indústrias atendidas em cada parada (KING, DON LUIZ, FRUTA POLPA).
  - Botão "Iniciar Visita" habilitado apenas para a data atual.
- **Refatorar `src/routes/_authenticated/promoter/visit.$visitId.tsx`**:
  - Organizar a tela de execução por **Indústria**.
  - Para cada indústria:
    - Campo "Relatório da indústria" (obrigatório).
    - Seção de fotos: "Foto do estoque/ruptura" e "Foto da reposição" (obrigatória).
    - Anexo de PDF opcional.
  - Implementar validação antes do envio: garantir 1 foto de reposição e 1 relatório por indústria.

### 3. Banco de Dados (Supabase)
- **Migração SQL**:
  - Adicionar `route_id` (opcional) à tabela `visits` para rastreabilidade.
  - Garantir que `visit_evidence` e `occurrences` suportem o vínculo com a indústria específica da tarefa.

## Validação e Testes
1. Login como Gustavo e acesso ao dashboard mobile.
2. Seleção de Segunda-feira (24/08/2026) e verificação da parada "SUPER ADEGA QNL".
3. Início da visita e preenchimento de evidências para KING, DON LUIZ e FRUTA POLPA.
4. Envio da visita e verificação do status "Enviada".
5. Verificação no Dashboard Administrativo se a visita aparece corretamente para conferência.
