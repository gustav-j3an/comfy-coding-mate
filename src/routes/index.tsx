import { createFileRoute, Navigate } from '@tanstack/react-router';

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
    <div className="min-h-screen bg-[#0F172A] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold border-b border-slate-700 pb-4">
          CORREÇÃO DE UX — “VISUALIZAR COMO PROMOTOR” E MENU LATERAL RECOLHÍVEL
        </h1>
        
        <p className="text-lg text-slate-300">
          Vamos resolver os dois itens juntos: o modo “Visualizar como Promotor” e a barra lateral recolhível. Cole este prompt no Lovable:
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-400">Existem dois problemas no painel administrativo do Rota Promotor:</h2>
          <ol className="list-decimal list-inside space-y-4 text-slate-300">
            <li>O botão “Visualizar como Promotor” não funciona de forma útil.</li>
            <li>O menu lateral com os módulos ocupa muito espaço e precisa poder ser recolhido.</li>
          </ol>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-700">
          <h2 className="text-xl font-semibold text-blue-400">PARTE 1 — VISUALIZAR COMO PROMOTOR</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>O Admin deve selecionar um promotor no seletor da página de Rotas e Roteiros.</li>
            <li>Sem promotor selecionado, o botão deve ficar desabilitado ou mostrar a mensagem “Selecione um promotor para visualizar o roteiro”.</li>
            <li>Com promotor válido selecionado, o botão deve abrir a experiência/tela do promotor usando o contexto daquele promotor.</li>
            <li>Exiba uma faixa fixa e visível: “Você está visualizando como: [nome do promotor]”.</li>
            <li>A faixa deve ter o botão “Voltar ao painel administrativo”.</li>
            <li>A pré-visualização deve mostrar somente dados que pertencem ao promotor selecionado.</li>
          </ul>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-700">
          <h2 className="text-xl font-semibold text-blue-400">PARTE 2 — MENU LATERAL RECOLHÍVEL</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Adicione um botão visível para recolher/expandir, próximo ao topo do menu.</li>
            <li>Quando recolhido, mostre apenas os ícones dos módulos e mantenha tooltip/nome ao passar o mouse.</li>
            <li>Quando expandido, mostre ícones e nomes normalmente.</li>
            <li>Preserve o estado escolhido pelo usuário ao navegar e ao recarregar a página.</li>
            <li>Em telas pequenas, o menu deve se comportar como gaveta móvel e fechar após navegar para uma página.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
