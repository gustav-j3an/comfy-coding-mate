import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/industry/')({
  component: IndustryDashboard,
});

function IndustryDashboard() {
  const { signOut } = useAuth();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Portal da Indústria</h1>
      <Button onClick={() => signOut()} variant="outline" className="mt-4">Sair</Button>
    </div>
  );
}
