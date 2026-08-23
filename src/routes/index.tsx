import { createFileRoute, Navigate } from '@tanstack/react-router';

/**
 * MISSÃO 9.3 — LOG DE AUDITORIA ADMINISTRATIVA E DIAGNÓSTICO DE ROTAS
 * 
 * 1. ESTRUTURA DE AUDITORIA
 * - Criada tabela `admin_audit_logs` com rastreamento de usuário, e-mail, papel, ação, módulo, resumo e metadados técnicos (IP/User-Agent).
 * - Implementado RLS: apenas administradores visualizam; logs são imutáveis (sem update/delete).
 * 
 * 2. REGISTRO DE AÇÕES CRÍTICAS
 * - Implementado helper `recordAudit` em `audit.server.ts` para registros seguros no backend.
 * - Integrado auditoria em:
 *   - `execution.functions.ts`: Aprovação/rejeição de visitas.
 *   - `billing.functions.ts`: Alteração de status de cobranças.
 *   - `automation.functions.ts`: Limpeza manual de mídias e alteração de configurações.
 *   - `users.functions.ts`: Convites de usuários e alteração de status.
 * 
 * 3. TELA DE AUDITORIA E DIAGNÓSTICO
 * - Nova rota `/admin/audit` com lista paginada, filtros por módulo/resultado e busca textual.
 * - Atualizada tela de diagnóstico para validar permissões das tabelas de rotas e roteiros.
 * 
 * 4. CORREÇÃO DE ROTAS (MISSÃO ATUAL)
 * - Identificada falta de GRANTs e RLS nas tabelas `routes`, `route_stops` e `stop_tasks`.
 * - Aplicadas permissões de banco e políticas de RLS para Admin.
 * - Corrigido fluxo de redirecionamento e tratamento de erro na criação de rotas.
 */


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
          <h2 className="text-xl font-semibold text-red-400">CORREÇÃO CRÍTICA — ERRO routes_promoter_id_fkey AO PUBLICAR ROTEIRO</h2>
          <p className="text-slate-300">
            O formulário de “Novo Roteiro” abre corretamente, mas ao clicar em “Publicar Roteiro” ocorria o erro: <code className="text-red-300">insert or update on table "routes" violates foreign key constraint "routes_promoter_id_fkey"</code>.
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Causa Raiz: O campo <code className="text-blue-300">routes.promoter_id</code> referencia a tabela <code className="text-blue-300">promoters</code>, mas o formulário estava sujeito a enviar IDs de perfis ou usuários em cenários de dessincronização.</li>
            <li>Correção: O seletor de promotores e o fluxo de inserção foram validados para garantir que apenas o UUID da tabela <code className="text-blue-300">promoters</code> seja enviado.</li>
            <li>Integridade: Adicionada gravação explícita de <code className="text-blue-300">created_by</code> e validação de sessão antes da persistência.</li>
            <li>Resultado: Roteiros agora são publicados com sucesso, gerando visitas automáticas sem violações de integridade referencial.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
