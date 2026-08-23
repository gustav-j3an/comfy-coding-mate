import { createFileRoute, Navigate } from '@tanstack/react-router';
import { Calendar, CheckCircle2 } from 'lucide-react';


/**
 * CORREÇÃO DE UX — “VISUALIZAR COMO PROMOTOR” E MENU LATERAL RECOLHÍVEL
 * 
 * Existem dois problemas no painel administrativo do Rota Promotor:
 * 
 * 1. O botão “Visualizar como Promotor” não funciona de forma útil.
 * 2. O menu lateral com os módulos ocupa muito espaço e precisa poder ser recolhido.
 * 
 * Não altere banco, criação de roteiros, PWA offline, retenção de mídias, faturamento ou permissões existentes fora do necessário para estas duas melhorias.
 * 
 * PARTE 1 — VISUALIZAR COMO PROMOTOR
 * 
 * Primeiro investigue o comportamento atual do botão e identifique por que ele não funciona.
 * 
 * Implemente um modo seguro de pré-visualização administrativa:
 * 
 * - O Admin deve selecionar um promotor no seletor da página de Rotas e Roteiros.
 * - Sem promotor selecionado, o botão deve ficar desabilitado ou mostrar a mensagem “Selecione um promotor para visualizar o roteiro”.
 * - Com promotor válido selecionado, o botão deve abrir a experiência/tela do promotor usando o contexto daquele promotor.
 * - Exiba uma faixa fixa e visível: “Você está visualizando como: [nome do promotor]”.
 * - A faixa deve ter o botão “Voltar ao painel administrativo”.
 * - A pré-visualização deve mostrar somente dados que pertencem ao promotor selecionado: roteiro, visitas e status.
 * - Não permita vazamento de dados de outros promotores.
 * - O backend deve validar que o usuário atual é Admin e que o promotor selecionado existe.
 * - Não confie apenas no parâmetro da URL para autorizar acesso.
 * - A pré-visualização não pode alterar a sessão real do Admin nem transformar o Admin em Promotor.
 * - Por segurança, deixe ações operacionais destrutivas ou de envio bloqueadas no modo de pré-visualização, com mensagem clara. O objetivo é conferir a experiência e os dados, não executar uma visita real.
 * - Se não houver roteiro para o promotor, mostre um estado vazio com o nome dele e uma mensagem clara.
 * 
 * Teste no Preview:
 * 
 * 1. Sem promotor selecionado, o botão orienta corretamente.
 * 2. Com promotor selecionado, abre a pré-visualização.
 * 3. A faixa de pré-visualização aparece.
 * 4. O Admin vê somente as visitas do promotor escolhido.
 * 5. O botão de retorno volta ao painel Admin.
 * 6. Um usuário que não é Admin não consegue iniciar esse modo.
 * 
 * PARTE 2 — MENU LATERAL RECOLHÍVEL
 * 
 * Implemente um controle para recolher e expandir a barra lateral de módulos.
 * 
 * Requisitos:
 * 
 * - Adicione um botão visível para recolher/expandir, próximo ao topo do menu.
 * - Quando recolhido, mostre apenas os ícones dos módulos e mantenha tooltip/nome ao passar o mouse.
 * - Quando expandido, mostre ícones e nomes normalmente.
 * - Preserve o estado escolhido pelo usuário ao navegar e ao recarregar a página.
 * - Em telas pequenas, o menu deve se comportar como gaveta móvel e fechar após navegar para uma página.
 * - Garanta acessibilidade por teclado, rótulo acessível e contraste adequado.
 * - Não corte conteúdo da página principal nem crie rolagem horizontal desnecessária.
 * 
 * Teste no Preview:
 * 
 * 1. Recolher e expandir no desktop.
 * 2. Recarregar a página e manter a preferência.
 * 3. Navegar entre módulos sem perder a preferência.
 * 4. Abrir em tela mobile, usar como gaveta e fechar após navegar.
 * 5. Confirmar que nenhum módulo fica inacessível.
 * 
 * ENTREGA
 * 
 * Informe:
 * 
 * - causa raiz do botão “Visualizar como Promotor”;
 * - arquivos alterados;
 * - comportamento de segurança da pré-visualização;
 * - como a preferência do menu foi salva;
 * - resultado individual de todos os testes descritos.
 * 
 * Não marque como concluído sem testar os dois recursos no Preview.
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
    <div className="min-h-screen bg-[#0F172A] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold border-b border-slate-700 pb-4">
          ROTA DO PROMOTOR — STATUS DO PROJETO
        </h1>
        
        <section className="space-y-4 pt-4 text-blue-300">
          <h2 className="text-xl font-semibold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> CORREÇÃO: Visibilidade de Roteiros na Simulação (CONCLUÍDA)
          </h2>
          <p className="text-slate-300">
            A visão "Visualizar como Promotor" foi corrigida para exibir paradas planejadas mesmo quando não houver visitas materializadas.
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li><span className="font-bold text-white">Lógica de Simulação:</span> O sistema agora busca roteiros publicados e extrai paradas teóricas dinamicamente para o dia selecionado.</li>
            <li><span className="font-bold text-white">Visualização Completa:</span> Exibição de Ordem, Loja (ex: Super Adega QNL), Endereço, Indústria e Observações operacionais.</li>
            <li><span className="font-bold text-white">Selo de Origem:</span> Implementado o badge "Visita Planejada" para diferenciar dados teóricos de execuções reais.</li>
            <li><span className="font-bold text-white">Segurança:</span> Trava de links e botões em dados teóricos para garantir que o modo simulação permaneça somente leitura.</li>
          </ul>
        </section>



        <section className="space-y-4 pt-4 border-t border-slate-700">
          <h2 className="text-xl font-semibold text-green-400">FUNCIONALIDADES CONCLUÍDAS</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-slate-300">
            <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">PWA Instalável e Modo Offline</li>
            <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">Gestão de Rotas e Roteiros 90 dias</li>
            <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">Execução de Visita com Geolocalização</li>
            <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">Relatórios Mensais e Portal Executivo</li>
            <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">Segurança RLS e Auditoria Admin</li>
            <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">Integração com n8n (Webhooks)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
