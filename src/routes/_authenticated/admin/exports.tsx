import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/exports')({
  component: () => <div className="p-6"><h1>Exportações</h1></div>,
});
