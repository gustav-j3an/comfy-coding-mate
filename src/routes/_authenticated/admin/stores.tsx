import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/stores')({
  component: () => <div className="p-6"><h1>Lojas</h1></div>,
});
