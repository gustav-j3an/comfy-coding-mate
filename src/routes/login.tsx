import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/lib/auth/auth-context';
import { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') {
        navigate({ to: '/admin' });
      } else if (role === 'promoter') {
        navigate({ to: '/promoter/' as any });
      } else if (role === 'industry') {
        navigate({ to: '/industry/' as any });
      }
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-4 sm:p-8 font-sans">
      <div className="mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar para o início
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
}