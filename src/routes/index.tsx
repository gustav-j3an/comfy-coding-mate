import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Briefing,
});

function Briefing() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') navigate({ to: '/admin' });
      else if (role === 'promoter') navigate({ to: '/promoter' });
      else if (role === 'industry') navigate({ to: '/industry' });
      else navigate({ to: '/admin' });
    }
  }, [user, role, loading, navigate]);

  if (loading) return null;

  if (user) return <div className="flex items-center justify-center min-h-screen font-sans">Redirecionando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200">
            <MapPin className="h-12 w-12 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Rota do Promotor</h1>
          <p className="text-slate-500 text-lg">Sistema de Gestão de Trade Marketing</p>
        </div>
        
        <div className="pt-4">
          <Link to="/admin">
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95">
              Acessar Sistema
            </Button>
          </Link>
        </div>

        <p className="text-sm text-slate-400">
          Acesso restrito a usuários autorizados.
        </p>
      </div>

      <div className="mt-20 p-8 max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed text-slate-300 text-[10px] border-t border-slate-200 opacity-50">
Excelente trabalho na Missão 1! Os cadastros fundamentais estão agora totalmente funcionais e seguros.

Vamos para a Missão 2: Conectar esses cadastros aos usuários reais através de convites. O sistema deve permitir convidar um usuário para se tornar um Promotor ou um representante de Indústria.

Envie este comando ao Lovable:

MISSÃO 2 — Convites de Usuários e Vínculos Reais.

Objetivo:
Implementar o fluxo de convite de novos usuários para os perfis de Promotor e Indústria, garantindo que o vínculo seja criado corretamente no Supabase.

REGRAS GERAIS:
- Administradores convidam usuários por e-mail ou link de WhatsApp.
- O convite deve conter o papel (role) e o ID da entidade (promotor_id ou industry_id).
- Ao aceitar o convite (primeiro acesso), o perfil deve ser criado com o status correto.

1. MÓDULO DE USUÁRIOS E ACESSOS (REVISÃO)
- Listar todos os usuários do sistema com seus papéis e status.
- Botão "Convidar Usuário" com seleção de papel (Admin, Promotor, Indústria).
- Se papel = Promotor, exibir lista de promotores cadastrados para vínculo.
- Se papel = Indústria, exibir lista de indústrias cadastradas para vínculo.

2. FLUXO DE CONVITE (BACKEND/SUPABASE)
- Usar `supabase.auth.admin.inviteUserByEmail` (via server functions se necessário).
- Gerar link de convite manual (WhatsApp) que aponte para a tela de cadastro.

3. TELA DE ACEITE DE CONVITE
- Tela personalizada para o usuário convidado definir sua senha e confirmar dados.
- Vinculação automática do `auth.uid()` com a linha correspondente em `promoters` ou `industries` via tabela `profiles`.

Ao finalizar, teste o convite de um novo promotor e verifique se ele consegue logar e ver apenas os dados permitidos para o seu papel.
      </div>
    </div>
  );
}
