# Plan: Roteiro Real do Promotor + Instalação PWA

Corrigir a visualização de roteiros publicados no dashboard do promotor e implementar a experiência de instalação PWA.

## User Review Required

> [!IMPORTANT]
> O dashboard do promotor será atualizado para exibir tanto visitas reais quanto paradas planejadas de roteiros publicados. A instalação do PWA será sugerida via card no primeiro acesso após o login.

## Proposed Changes

### Database & Backend
- Nenhuma alteração de esquema necessária. O foco é na lógica de consulta no frontend.

### Promoter Dashboard (`src/routes/_authenticated/promoter/index.tsx`)
- Implementar seletor de dias da semana (SEG, TER, QUA, QUI, SEX, SÁB, DOM) que altera a visualização.
- Refatorar a query `promoter-visits` para buscar roteiros publicados (`routes` + `route_stops` + `stop_tasks`) e combiná-los com visitas materializadas (`visits`).
- Garantir que visitas reais prevaleçam sobre prévias de roteiro para evitar duplicidade.
- Adicionar lógica de segurança para garantir que o promotor veja apenas seus próprios dados (já presente, mas será reforçada).
- Exibir status "Programada" para paradas do roteiro que ainda não viraram visitas reais.

### PWA Installation Experience
- Criar `src/components/common/pwa-install-banner.tsx` para exibição de convite discreto após o login.
- Integrar o banner no layout autenticado ou diretamente no dashboard do promotor.
- Utilizar `localStorage` para controlar a exibição do banner (primeiro acesso e fechamento).
- Garantir que o banner respeite as restrições de plataforma (iOS vs Android).

### Navigation & UX
- Manter o modo offline e a fila de sincronização funcionais.
- Travar a execução de visitas "Programadas" em datas futuras (apenas visualização).

## Technical Details
- **Day Selection**: Usar um estado local `selectedDay` no dashboard, inicializado com o dia atual.
- **Data Merging**: No `queryFn`, buscar `visits` e `routes` em paralelo. Filtrar `route_stops` pelo `selectedDay`.
- **Deduplication**: Chave de unicidade: `store_id` + `industry_id` + `date`.
- **PWA Hook**: Reutilizar `usePWAInstall` para detectar se o app já está instalado.

## Verification Plan
- **Automated Tests**: Validar a lógica de mesclagem de dados com testes unitários se possível.
- **Manual Verification**:
  1. Logar com a conta do Gustavo.
  2. Verificar se a visita de segunda-feira (Super Adega QNL) aparece corretamente sem duplicidade.
  3. Navegar entre os dias da semana e validar a agenda.
  4. Testar o banner de instalação PWA em ambiente mobile simulado.
  5. Confirmar que administradores mantêm a visão correta ao simular o promotor.
