import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  loader: async () => {
    throw redirect({ to: '/admin' as any });
  },
  head: () => ({
    meta: [
      { title: "Rota do Promotor | Login" },
      { name: "description", content: "Sistema privado de gestão de promotores e rotas." },
      { property: "og:title", content: "Rota do Promotor" },
      { property: "og:description", content: "Gestão inteligente de merchandising e equipe de campo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ]
  }),
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Rota do Promotor</h1>
        <p className="text-slate-600 italic whitespace-pre-wrap">
          Continue a MISSÃO 4 a partir do ponto atual. Não considere a missão concluída apenas porque erros de tipagem e server functions foram corrigidos.
          {"\n\n"}
          Agora implemente e teste as funcionalidades pendentes:
          {"\n"}- tela funcional do promotor com roteiro do dia;
          {"\n"}- abertura de visita prevista;
          {"\n"}- captura/anexo de foto, vídeo e PDF;
          {"\n"}- múltiplas evidências por visita;
          {"\n"}- criação de ocorrência por ruptura, vencimento ou produto próximo do vencimento;
          {"\n"}- armazenamento privado e links temporários de arquivos;
          {"\n"}- envio da visita para conferência;
          {"\n"}- aprovação e reprovação pelo administrador;
          {"\n"}- exibição do motivo de reprovação ao promotor;
          {"\n"}- atualização de dashboard, ocorrências, portal da indústria e relatórios.
          {"\n\n"}
          Antes de finalizar, execute os testes de ponta a ponta com dois perfis:
          {"\n"}1. Promotor envia uma visita com foto e ocorrência.
          {"\n"}2. Administrador localiza, aprova ou reprova a visita.
          {"\n"}3. Promotor visualiza o novo status e, se reprovado, o motivo.
          {"\n"}4. Usuário da indústria visualiza somente a evidência ligada à própria indústria.
          {"\n\n"}
          Ao final, entregue um relatório objetivo com:
          {"\n"}- telas implementadas;
          {"\n"}- tabelas e arquivos criados;
          {"\n"}- permissões aplicadas;
          {"\n"}- testes realizados;
          {"\n"}- itens ainda bloqueados, se existirem.
        </p>
      </div>
    </div>
  ),
});
