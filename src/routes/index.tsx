import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: "Rota do Promotor" },
      { name: "description", content: "Sistema de gestão de promotores e rotas." },
      { property: "og:title", content: "Rota do Promotor" },
      { property: "og:description", content: "Gestão inteligente de merchandising e equipe de campo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ]
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold border-b border-slate-700 pb-4">
          CONTEXTO FIXO DO PROJETO — ROTA PROMOTOR
        </h1>
        
        <p className="text-lg text-slate-300">
          Você está trabalhando no projeto Rota Promotor, uma plataforma de operação de promotores de campo construída no Lovable e em estado de Piloto Real.
        </p>

        <p className="text-slate-300">
          O sistema contempla painel administrativo, usuários e perfis, clientes, indústrias, lojas, roteiros, visitas, check-in/check-out por GPS, fotos, vídeos, PDFs, checklists, cobranças, indicadores, relatórios e PWA mobile-first.
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-400">REGRAS CRÍTICAS JÁ IMPLEMENTADAS — NÃO REVERTER:</h2>
          <ol className="list-decimal list-inside space-y-4 text-slate-300">
            <li>
              <span className="font-medium text-white">Retenção de mídias:</span> fotos, vídeos e PDFs devem ser excluídos definitivamente do Storage após 90 dias, independentemente de vínculo com faturamentos ou cobranças.
            </li>
            <li>
              <span className="font-medium text-white">Histórico financeiro:</span> após a exclusão das mídias, devem permanecer somente dados contábeis e resumidos, como valores, números, competência, datas e status. Telas que antes mostravam mídia devem exibir “Evidência expirada”.
            </li>
            <li>
              <span className="font-medium text-white">PWA seguro:</span> atualizações são exibidas por confirmação do usuário. Se ele estiver em uma rota de execução de visita, preenchendo formulário ou enviando mídia, o aviso de atualização deve ser adiado para evitar perda de dados.
            </li>
            <li>
              <span className="font-medium text-white">Segurança:</span> segredos e chaves ficam somente no backend ou em variáveis seguras do Lovable. Nunca exponha chaves administrativas no frontend.
            </li>
            <li>
              <span className="font-medium text-white">Preserve a estrutura existente.</span> Antes de alterar arquivos, analise os componentes, funções e banco já disponíveis. Faça apenas mudanças relacionadas à missão solicitada.
            </li>
          </ol>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-700">
          <h2 className="text-xl font-semibold text-blue-400">Para cada nova missão:</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>explique brevemente o plano;</li>
            <li>implemente sem recriar funcionalidades existentes;</li>
            <li>valide tipos, permissões, responsividade mobile e cenários de erro;</li>
            <li>apresente ao final os arquivos alterados e os testes realizados.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
