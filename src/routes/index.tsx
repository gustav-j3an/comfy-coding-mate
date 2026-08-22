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
      Crie um aplicativo web mobile-first e instalável como PWA chamado “Rota do Promotor”.

O aplicativo será utilizado por promotores de merchandising e por um administrador.

Tecnologia:
- Use Supabase para autenticação, banco de dados e armazenamento privado das fotos.
- Estruture o app para integrar com n8n por webhooks posteriormente.
- Não use dados fictícios como solução final. Se precisar de demonstração, identifique os dados claramente como “dados de teste”.

Perfis:
1. Promotor
2. Administrador

Regra principal de negócio:
O roteiro é semanal e fixo. Cada promotor possui uma programação recorrente de visitas.

Uma visita pode acontecer:
- uma vez por semana;
- duas vezes por semana;
- três vezes por semana;
- a cada quinze dias.

O promotor visita lojas e, dentro de cada loja, precisa realizar tarefas para uma ou mais indústrias.

Exemplo:
- Segunda-feira: o promotor visita a loja “Atacadão QNL”.
- Nessa loja, ele deve atender a indústria “King”.
- Ele registra uma foto de reposição/exposição especificamente para a indústria King naquela loja.
- A mesma indústria pode ter visitas previstas em outros dias e outras lojas.

Funcionalidades do promotor:
- Login individual por e-mail e senha.
- Tela inicial “Meu roteiro de hoje”.
- Mostrar o dia da semana.
- Mostrar em ordem as lojas que ele deve visitar hoje.
- Em cada loja, mostrar endereço, ordem da parada e indústrias que devem ser atendidas.
- Mostrar claramente qual é a próxima loja da rota.
- Para cada indústria da loja, ter um botão “Registrar visita”.
- Ao registrar uma visita, abrir a câmera do celular para tirar uma foto no momento.
- Não permitir concluir a visita sem foto.
- Salvar automaticamente data e hora do envio.
- Solicitar e salvar a geolocalização do celular quando disponível.
- Campo opcional de observação.
- Após o envio, o status inicial deve ser “Pendente de conferência”.
- Mostrar histórico das próprias visitas e seus status: pendente, aprovada ou reprovada.
- Quando uma visita for reprovada, mostrar o motivo.
- O promotor só pode ver suas próprias informações.

Funcionalidades do administrador:
- Login administrativo.
- Dashboard com cartões:
  - visitas previstas hoje;
  - visitas enviadas hoje;
  - visitas pendentes;
  - visitas aprovadas;
  - visitas reprovadas.
- Tela de conferência das visitas.
- Cada visita deve mostrar:
  - foto;
  - promotor;
  - loja;
  - indústria;
  - data e hora;
  - localização, quando houver;
  - observação.
- Botões “Aprovar visita” e “Reprovar visita”.
- Ao reprovar, exigir motivo da reprovação.
- Tela para cadastrar e editar promotores.
- Tela para cadastrar e editar lojas, com nome, endereço e coordenadas.
- Tela para cadastrar e editar indústrias.
- Tela para configurar roteiros semanais recorrentes por promotor.
- Permitir marcar em quais dias da semana cada loja é visitada.
- Permitir informar a frequência: semanal ou quinzenal.
- Permitir incluir várias indústrias em uma mesma parada/loja.
- Relatórios com filtros por período, promotor, loja, indústria e status.
- Indicadores de visitas previstas, realizadas, aprovadas, reprovadas e pendentes.
- Relatório por indústria: quantas visitas foram previstas, enviadas, aprovadas e reprovadas.

Estrutura de dados:
- perfis: usuário, nome, e-mail, tipo de perfil (administrador ou promotor);
- lojas: nome, endereço, latitude, longitude, ativo;
- industrias: nome, ativo;
- roteiros: promotor, nome, ativo;
- paradas_roteiro: roteiro, loja, dia da semana, ordem da rota, frequência semanal ou quinzenal, semana de referência para visitas quinzenais;
- tarefas_parada: parada do roteiro, indústria;
- visitas: promotor, loja, indústria, parada do roteiro, data planejada, data/hora de envio, status, observação, latitude, longitude;
- fotos_visita: visita, caminho privado da foto;
- conferencias_visita: visita, administrador, decisão, motivo, data/hora da conferência.

Segurança:
- Use autenticação do Supabase.
- Implemente regras de acesso para garantir que promotores só leiam e gravem os próprios roteiros e visitas.
- Administradores podem visualizar e conferir tudo.
- As fotos devem ser privadas e exibidas apenas para o promotor dono da visita e administradores.
- Não expor chaves privadas no frontend.

Design:
- Visual profissional, claro e focado em uso no celular.
- Botões grandes.
- Pouco texto por tela.
- Barra de progresso mostrando quantas visitas do dia foram concluídas.
- Cards por loja.
- Dentro de cada loja, cards das indústrias e o status de cada visita.
- Destacar a próxima parada.
- Criar uma versão responsiva para painel administrativo em computador.
- Preparar o aplicativo para ser instalado como PWA.

Crie primeiro a estrutura, autenticação, telas e banco de dados. Em seguida, conecte os fluxos reais de cadastro, roteiro, envio de foto, conferência e relatórios.
    </div>
  );
}
