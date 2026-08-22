import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, Loader2, Eye, EyeOff } from 'lucide-react';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/primeiro-acesso')({
  loader: async () => {
    // We use a regular query since get_admin_count might not be in the generated types yet
    const { data, error } = await (supabase as any).rpc('get_admin_count');
    if (error) {
      console.error('Error checking admin count:', error);
      // If the function doesn't exist, we assume no admins (though in production we should handle this)
    }
    
    // Explicitly check if data is null or 0. If it's > 0, redirect.
    if (data !== null && Number(data) > 0) {
      throw redirect({ to: '/' }); // Redirect to home/login
    }
    return { adminCount: Number(data) };
  },
  component: FirstAdminPage,
});

function FirstAdminPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário.');

      // 2. Create user role (handled by SQL policy)
      const { error: roleError } = await (supabase as any)
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin'
        });

      if (roleError) throw roleError;

      // 3. Update profile status to active (handled by SQL policy)
      await (supabase as any)
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', authData.user.id);

      toast.success('Administrador inicial criado com sucesso!');
      
      // If email confirmation is enabled, they might need to confirm.
      // But typically we redirect them to login or admin dashboard.
      if (authData.session) {
        navigate({ to: '/admin' });
      } else {
        toast.info('Verifique seu e-mail para confirmar o cadastro.');
        navigate({ to: '/' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar administrador inicial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <MapPin className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Rota do Promotor</h1>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Primeiro Acesso</CardTitle>
            <CardDescription>
              Crie a primeira conta de administrador para gerenciar o sistema.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateAdmin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-slate-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 border-slate-200"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : 'Criar minha conta de administrador'}
              </Button>
              <Link to="/admin" className="text-sm text-slate-500 hover:text-slate-700">
                Voltar para o login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
