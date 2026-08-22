import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/visits')({
  component: () => <div className="p-6"><h1>Visitas</h1></div>,
});
