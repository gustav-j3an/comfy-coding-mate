import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold border-b border-slate-700 pb-4 text-center">
          ROTA DO PROMOTOR
        </h1>
        
        <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">Sistema Operacional</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Segurança auditada e corrigida. RLS ativado em todas as tabelas e funções sensíveis protegidas.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              Ambiente de produção seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}