import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { changePassword } from '@/lib/users.functions';

export function ChangePasswordModal() {
  const { profile, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!profile?.must_change_password) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ data: { newPassword } });
      toast.success('Senha alterada com sucesso! Por favor, faça login novamente.');
      // Wait a bit for the toast to be seen
      setTimeout(() => {
        signOut();
      }, 2000);
    } catch (error: any) {
      toast.error('Erro ao alterar senha: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-none animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <Lock className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">Troca de Senha Obrigatória</CardTitle>
          <CardDescription>
            Como este é seu primeiro acesso com uma senha temporária, você precisa criar uma nova senha forte para continuar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha Forte</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10 h-12"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repita a nova senha"
                className="h-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-[11px] text-blue-700 leading-relaxed">
                <p className="font-bold mb-1">Dica de segurança:</p>
                Use uma combinação de letras maiúsculas, minúsculas, números e símbolos. Evite datas de nascimento ou sequências simples.
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3 pb-8">
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-base"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Salvar e Acessar Sistema'}
            </Button>
            <Button 
              variant="ghost" 
              type="button"
              className="w-full text-slate-500 font-medium"
              onClick={() => signOut()}
            >
              Sair
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
