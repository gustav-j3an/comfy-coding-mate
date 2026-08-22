import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/billing')({
  component: () => <div className="p-6"><h1>Cobranças</h1></div>,
});
