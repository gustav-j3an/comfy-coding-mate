import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/promoter/')({
  component: PromoterDashboard,
});

function PromoterDashboard() {
  const { signOut } = useAuth();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Meu Roteiro de Hoje</h1>
      <Button onClick={() => signOut()} variant="outline" className="mt-4">Sair</Button>
    </div>
  );
}
