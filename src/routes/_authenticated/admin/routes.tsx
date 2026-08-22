import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/routes')({
  component: () => <div className="p-6"><h1>Rotas e Roteiros</h1></div>,
});
