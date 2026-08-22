import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/industries')({
  component: () => <div className="p-6"><h1>Indústrias</h1></div>,
});
