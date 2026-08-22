import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/reports')({
  component: () => <div className="p-6"><h1>Relatórios</h1></div>,
});
