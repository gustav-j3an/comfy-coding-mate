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
        <p className="text-slate-600 italic">
          Muito bom. Há só um ponto técnico que precisa ser confirmado antes da próxima missão: na Missão 0 o vínculo de `visits.promoter_id` foi descrito como ligado a `profiles`, mas agora a Missão 3 fala em `promoters.id`. O Lovable precisa manter **um padrão único** e, se houver os dois conceitos, usar uma relação explícita entre `promoters` e `profiles`. A Missão 4 vai exigir isso para registrar corretamente quem executou cada visita.
          {"\n\n"}
          Agora vem o módulo mais importante para o promotor: envio de provas e conferência.
          {"\n\n"}
          MISSÃO 4 — Registro de visitas, evidências e ocorrências
        </p>
      </div>
    </div>
  ),
});
