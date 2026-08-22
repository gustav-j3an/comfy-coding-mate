import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, MapPin, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-mail ou senha inválidos.');
        }
        throw error;
      }

      // Update last access in profile
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_access: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      toast.success('Entrada realizada com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <MapPin className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Rota do Promotor</h1>
        <p className="text-slate-500 text-sm">Bem-vindo de volta! Entre com seus dados.</p>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/60 bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleLogin}>
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <Link 
                  to="/auth/forgot-password" 
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-medium text-slate-600 cursor-pointer"
              >
                Lembrar meu acesso
              </Label>
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="text-center">
        <p className="text-sm text-slate-500">
          Não possui acesso?{' '}
          <span className="text-slate-900 font-semibold underline decoration-blue-500 underline-offset-4">
            Solicite seu cadastro ao administrador.
          </span>
        </p>
      </div>
    </div>
  );
}
