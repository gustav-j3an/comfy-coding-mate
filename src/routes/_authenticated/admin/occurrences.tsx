import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/occurrences')({
  component: () => <div className="p-6"><h1>Ocorrências</h1></div>,
});
