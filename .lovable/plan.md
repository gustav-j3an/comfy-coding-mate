# Plano de Responsividade 100% - Rota do Promotor

Tornar todas as páginas, componentes e fluxos 100% responsivos em todos os dispositivos (Mobile até 480px, Tablet até 768px, Laptop até 1024px, Desktop 1280px+), garantindo excelente UX e sem quebras de layout.

## Mudanças

### Layout e Componentes Globais
- **`src/routes/_authenticated/route.tsx`**: Ajustar paddings e containers para garantir que o conteúdo não encoste nas bordas em dispositivos móveis.
- **`src/components/admin/admin-sidebar.tsx`**: Refinar a sidebar mobile (Sheet) para garantir que todos os itens sejam acessíveis e o layout seja limpo.
- **`src/components/auth/login-form.tsx`**: Ajustar o card de login para ocupar 100% da largura em telas pequenas com padding adequado.

### Módulos Administrativos (`/admin`)
- **Tabelas**: Implementar scroll horizontal suave ou transformações em "cards" para tabelas complexas (Promotores, Lojas, Rotas, Usuários).
- **Dashboards**: Ajustar grids para empilhar cards em mobile e usar layouts multi-coluna em desktop.
- **Modais/Dialogs**: Garantir que diálogos de criação/edição ocupem a tela cheia ou tenham scroll interno em telas pequenas.

### Módulo Promotor (`/promoter`)
- **Dashboard**: Refinar os cards de visitas e o cabeçalho azul para evitar overflow em telas muito estreitas (320px-360px).
- **Execução de Visita**: Ajustar a grade de tarefas e o upload de fotos para facilitar o uso com uma mão no mobile.
- **Mapa/Rotas**: Garantir que elementos interativos não fiquem sobrepostos.

### Módulo Indústria (`/industry`)
- **Portal Executivo**: Ajustar a visualização de relatórios mensais e o menu lateral mobile.
- **Gráficos/BI**: Garantir que containers de relatórios sejam fluidos.

## Detalhes Técnicos
- Uso extensivo de classes utilitárias do Tailwind (ex: `flex-col lg:flex-row`, `w-full lg:w-auto`).
- Substituição de larguras fixas (`w-[400px]`) por larguras relativas com limites (`w-full max-w-md`).
- Implementação de padrões de design "mobile-first".
- Ajuste de `safe-area-inset` para dispositivos iOS.

## Verificação
- Testar em simulador de navegador para breakpoints: 375px (Mobile), 768px (Tablet), 1024px (Laptop), 1440px (Desktop).
- Verificar se não há scroll horizontal indesejado no body.
- Confirmar que botões e inputs mantêm tamanhos adequados para toque (mínimo 44px).
