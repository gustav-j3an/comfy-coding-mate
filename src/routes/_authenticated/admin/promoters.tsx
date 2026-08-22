import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/promoters')({
  component: () => <div className="p-6"><h1>Promotores</h1></div>,
});
