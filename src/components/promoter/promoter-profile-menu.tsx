import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PromoterProfileMenuProps {
  hasPendingWork: boolean;
}

export function PromoterProfileMenu({ hasPendingWork }: PromoterProfileMenuProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const fullName = profile?.full_name || user?.user_metadata?.['full_name'] || 'Promotor';
  const shortName = fullName.split(' ')[0];
  const initial = fullName.trim().charAt(0).toUpperCase() || 'P';

  const handleSignOutRequest = () => {
    if (hasPendingWork) {
      setIsConfirmationOpen(true);
      return;
    }

    void handleSignOut();
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Você saiu do aplicativo com segurança.');
    await navigate({ to: '/login', replace: true });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-2 rounded-full px-2 py-1.5 text-white hover:bg-white/15 hover:text-white"
            aria-label={`Abrir perfil de ${fullName}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-700">
              {initial}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-semibold sm:inline">{shortName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="truncate text-sm">{fullName}</span>
            {user?.email && <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>}
            <span className="text-xs font-normal text-muted-foreground">Promotor</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleSignOutRequest}
            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sair do aplicativo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja sair agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Há uma visita em andamento ou uma sincronização pendente. Sair pode interromper o envio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar trabalhando</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => void handleSignOut()}>
              Sair mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}