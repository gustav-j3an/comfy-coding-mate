import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { sendPasswordResetEmail } from '@/lib/users.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, ArrowLeft, Loader2, Mail } from 'lucide-react';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail({ data: { email } });
      setSubmitted(true);
      toast.success('Link de recuperação enviado por e-mail.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <MapPin className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recuperar Senha</h1>
          <p className="text-slate-500 text-sm">Insira seu e-mail para receber um link de recuperação.</p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/60 bg-white/80 backdrop-blur-sm">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
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
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pb-8">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all" 
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : 'Enviar Link'}
                </Button>
                <Link 
                  to="/admin" // Will redirect to login if not auth
                  className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Login
                </Link>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="py-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <Mail className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">E-mail enviado!</h3>
                <p className="text-slate-500">
                  Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link em breve.
                </p>
              </div>
              <Link 
                to="/admin"
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Login
              </Link>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
