import { createFileRoute } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <div className="p-8 max-w-4xl mx-auto whitespace-pre-wrap">
      Remova completamente a página inicial que está exibindo o texto do briefing. Não mostre requisitos, instruções, textos longos ou especificações dentro do aplicativo.

Este projeto não é uma landing page e não é um site institucional. É um sistema operacional privado para promotores, administradores e indústrias.

Reconstrua a tela inicial como uma tela real de aplicativo:
- visual moderno e profissional;
- layout mobile-first;
- login como primeira tela quando o usuário não estiver autenticado;
- após login, abrir o painel correspondente ao perfil;
- não exibir nenhum texto deste prompt para o usuário final.
    </div>
  );
}
