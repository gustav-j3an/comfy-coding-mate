import { createFileRoute } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <div className="p-8 max-w-4xl mx-auto whitespace-pre-wrap">
      Construa um aplicativo privado chamado “Rota do Promotor”.

IMPORTANTE:
- Não crie landing page.
- Não exiba este briefing, requisitos ou textos explicativos dentro do aplicativo.
- Não crie página institucional pública.
- Construa um sistema real com telas, navegação, dados estruturados e permissões.
- O aplicativo deve parecer um produto pronto para uso por uma empresa de merchandising.

OBJETIVO DO PRODUTO:
Controlar roteiros semanais de promotores, registrar provas de execução em lojas para cada indústria, permitir conferência administrativa e disponibilizar um portal mensal exclusivo para cada indústria.

PERFIS E PERMISSÕES:

1. Promotor
O promotor acessa somente suas próprias rotas e visitas.

Tela principal do promotor:
- título “Meu roteiro de hoje”;
- data atual e dia da semana;
- barra de progresso: visitas concluídas / visitas previstas;
- card destacado: “Próxima parada”;
- lista ordenada das lojas do dia;
- cada loja mostra nome, endereço, ordem da visita, status e indústrias a atender;
- cada indústria dentro da loja mostra status: pendente, enviada, aprovada ou reprovada;
- botão “Registrar evidência”.

Ao registrar uma evidência:
- permitir capturar foto pela câmera;
- permitir anexar foto de relatório, PDF ou vídeo curto;
- permitir selecionar o tipo de evidência:
  - reposição/exposição;
  - produto vencido;
  - produto próximo do vencimento;
  - ruptura/falta de produto;
  - relatório;
  - material promocional;
  - outra ocorrência;
- campo de observação;
- registrar data/hora do servidor e localização, quando permitida;
- enviar a visita para conferência;
- nunca permitir concluir evidência sem arquivo.

Tela “Minhas visitas”:
- histórico das próprias visitas;
- filtros por data, loja, indústria e status;
- mostrar motivo de reprovação quando houver.

2. Administrador
O administrador possui controle total do sistema.

Menu administrativo:
- Dashboard;
- Rotas e Roteiros;
- Promotores;
- Lojas;
- Indústrias;
- Visitas para conferência;
- Ocorrências;
- Relatórios mensais;
- Exportações;
- Cobranças.

Dashboard administrativo:
- cards de visitas previstas hoje;
- visitas enviadas hoje;
- pendentes de conferência;
- aprovadas;
- reprovadas;
- ocorrências abertas;
- gráfico de visitas por indústria;
- gráfico de execução por promotor;
- lista de últimas visitas enviadas.

Tela “Rotas e Roteiros”:
- visão semanal por promotor;
- escolher promotor e dia da semana;
- adicionar, editar, ordenar, pausar e remover lojas da rota;
- em cada loja, adicionar ou remover indústrias;
- definir frequência: semanal ou quinzenal;
- permitir a mesma indústria em mais de uma loja;
- permitir uma indústria em dois ou três dias diferentes;
- permitir rota extraordinária em uma data específica;
- permitir substituir temporariamente o promotor;
- salvar como rascunho e publicar;
- mostrar prévia de como o promotor verá a rota no celular.

REGRA CRÍTICA:
Alterações em rotas só podem valer para visitas futuras, a partir de uma data de vigência definida pelo administrador. Nunca alterar, apagar ou reescrever uma visita que já foi realizada. Manter histórico de versões da rota e registrar qual administrador realizou cada mudança.

Tela “Conferência de visitas”:
- lista de evidências pendentes;
- filtros por indústria, promotor, loja, data e tipo de ocorrência;
- abrir detalhes da visita;
- mostrar foto, vídeo ou PDF;
- mostrar promotor, loja, indústria, data/hora, localização e observação;
- botões “Aprovar” e “Reprovar”;
- ao reprovar, exigir motivo;
- registrar administrador responsável e data/hora da decisão.

Tela “Ocorrências”:
- listar produtos vencidos, próximos do vencimento, rupturas e outros problemas;
- mostrar foto/vídeo, loja, indústria, produto, lote, validade, quantidade e descrição;
- status: aberta, informada, em tratamento e resolvida.

3. Indústria
A indústria possui acesso somente aos seus próprios dados.

Portal da indústria:
- dashboard mensal;
- visitas previstas, realizadas, aprovadas e pendentes;
- lojas atendidas;
- galeria de evidências;
- ocorrências abertas e resolvidas;
- relatório mensal;
- cobrança mensal com status: aguardando cobrança, cobrança enviada, pago ou vencido.

SEGURANÇA:
- usar Supabase para autenticação, banco de dados e permissões;
- cada promotor enxerga somente seus próprios dados;
- cada indústria enxerga somente seus próprios dados;
- administrador enxerga todos os dados;
- fotos, vídeos e PDFs devem ser privados;
- preparar integração futura com Cloudflare R2 para arquivos e n8n para automações.

RETENÇÃO E EXPORTAÇÃO:
- evidências operacionais devem expirar após 90 dias;
- antes de excluir, permitir exportar planilha, PDF mensal ou ZIP com fotos, vídeos e documentos;
- mostrar data de expiração;
- preparar estrutura para automação de exclusão e alerta pelo n8n;
- não construir a rotina automática agora, apenas preparar a modelagem e as telas.

DESIGN:
- aplicativo mobile-first, profissional e simples;
- paleta sóbria: azul escuro, branco, cinza claro e verde para aprovado;
- vermelho somente para reprovação, vencimento e alertas;
- botões grandes para uso em campo;
- usar ícones claros;
- no celular, usar navegação inferior;
- no computador, usar menu lateral;
- criar dados de demonstração claramente identificados como “dados de teste” para mostrar o funcionamento.

COMECE AGORA:
1. Criar a autenticação e os três perfis.
2. Criar o layout e a navegação do promotor.
3. Criar dashboard e gestão de rotas do administrador.
4. Criar painel de conferência.
5. Criar portal da indústria.
6. Criar dados de teste coerentes: Promotor João, Atacadão QNL e indústria King.
7. Testar todas as telas e corrigir links quebrados.
    </div>
  );
}
