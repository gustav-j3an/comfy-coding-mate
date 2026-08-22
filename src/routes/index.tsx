import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  loader: async () => {
    throw redirect({ to: '/admin' as any });
  },
  head: () => ({
    meta: [
      { title: "Rota do Promotor | Login" },
      { name: "description", content: "Sistema privado de gestão de promotores e rotas." },
      { property: "og:title", content: "Rota do Promotor" },
      { property: "og:description", content: "Gestão inteligente de merchandising e equipe de campo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ]
  }),
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Rota do Promotor</h1>
        <p className="text-slate-600 italic whitespace-pre-wrap">
          Excelente. As correções de integridade entre `promoters` e `profiles` foram aplicadas, e as políticas de RLS garantem que evidências e auditorias sejam privadas.
          {"\n\n"}
          MISSÃO 5 — Dashboard Executivo e Alertas Críticos
          {"\n\n"}
          Agora vamos conectar as pontas: o administrador precisa de uma visão executiva em tempo real. Implemente alertas automáticos no dashboard administrativo para rupturas críticas e crie o módulo de exportação PDF para relatórios de visita.
        </p>
      </div>
    </div>
  ),
});
