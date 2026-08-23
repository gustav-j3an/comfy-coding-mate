import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold border-b border-slate-700 pb-4">
          ROTA DO PROMOTOR — STATUS DO PROJETO
        </h1>
        
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
MISSÃO V1.4.1 — AUTORIZAÇÃO SERVER-SIDE DO VISUALIZADOR

O visualizador administrativo agora possui proteção autoritativa no servidor.

OBJETIVO
Corrigir a falha de segurança onde o bloqueio era feito apenas no frontend.

CORREÇÕES IMPLEMENTADAS
1. Validação Server-Side: A função `getPromoterItineraryData` agora valida o papel real do usuário no banco de dados (`has_role`) antes de qualquer processamento.
2. Checagem de Existência: O servidor valida se o `promoterId` existe antes de carregar roteiros.
3. Respostas HTTP Seguras: Retorno de 401 (Não autenticado), 403 (Não autorizado) ou 404 (Não encontrado) direto do handler do servidor.
4. Isolamento de Dados: Nenhuma informação do promotor ou roteiros é enviada ao cliente se a validação de papel falhar no servidor.
5. Melhoria Visual Mantida: A checagem de frontend (`role !== 'admin'`) permanece apenas para UX imediata, mas a segurança real é garantida pelo servidor.

RESULTADO DOS TESTES
1. Admin abre Lucas: OK (Acesso normal).
2. Promotor acessa URL: OK (Bloqueado pelo servidor com 403).
3. Indústria acessa URL: OK (Bloqueado pelo servidor com 403).
4. Não autenticado: OK (Redirecionado ou 401).
5. ID inexistente: OK (Erro 404 "Promotor não encontrado" sem vazar dados).
6. Integridade: OK (Nenhuma visita ou roteiro real foi alterado).

ENTREGA
Arquivos alterados:
- `src/lib/routes.functions.ts`: Adicionada lógica de autorização server-side e validação de existência.
- `src/routes/_authenticated/admin/visualizar-promotor.tsx`: Tratamento de erros de Response do servidor.
- `src/routes/index.tsx`: Atualizado com o status da Missão V1.4.1.
        </div>
      </div>
    </div>
  );
}
