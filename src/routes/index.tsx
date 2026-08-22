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
  /*
  Perfeito. Agora falta o módulo comercial: transformar visitas aprovadas em cobrança mensal por indústria.

  A regra mais segura para começar é: **só contar para cobrança visitas aprovadas**. O valor fica definido no contrato da indústria, por visita aprovada. Depois podemos criar regras mais avançadas por loja, região ou tipo de serviço.

  MISSÃO 7 — Contratos, cobranças e faturamento por indústria.

  OBJETIVO:
  Criar módulo financeiro para calcular a cobrança mensal de cada indústria com base nas visitas aprovadas.

  REGRA FINANCEIRA PADRÃO:
  - Cobrar somente visitas com status “aprovada”.
  - Cada indústria deve possuir contrato comercial com valor por visita aprovada.
  - A cobrança deve usar os dados do mês como snapshot, para que alterações posteriores não mudem uma fatura já emitida.
  - Não implementar gateway de pagamento nesta missão.
  - Permitir anexar boleto, fatura em PDF ou link externo de pagamento.

  MÓDULO “CONTRATOS”:

  Criar cadastro de contrato por indústria com:
  - indústria;
  - nome ou número do contrato;
  - data de início;
  - data de fim opcional;
  - status: rascunho, ativo, encerrado;
  - valor padrão por visita aprovada;
  - quantidade mínima mensal de visitas, opcional;
  - observações;
  - dia de vencimento da cobrança;
  - dados de cobrança da indústria;
  - responsável comercial.

  Permitir:
  - criar;
  - editar;
  - encerrar;
  - duplicar contrato;
  - visualizar histórico;
  - nunca alterar valores de faturas já emitidas.

  MÓDULO “COBRANÇAS”:

  Criar painel com:
  - total a faturar no mês;
  - total faturado;
  - total pago;
  - total vencido;
  - ticket médio por indústria;
  - gráfico de faturamento por indústria;
  - lista de cobranças pendentes.

  Criar botão “Nova cobrança”:
  1. Selecionar indústria.
  2. Selecionar competência mês/ano.
  3. Carregar contrato ativo para o período.
  4. Calcular visitas aprovadas no período.
  5. Exibir:
     - visitas aprovadas;
     - valor por visita;
     - subtotal;
     - desconto;
     - acréscimo;
     - valor final;
     - vencimento.
  6. Permitir ajuste manual com justificativa obrigatória.
  7. Gerar cobrança como rascunho.
  8. Permitir emitir.

  Estrutura da fatura/cobrança:
  - número único;
  - indústria;
  - contrato;
  - competência;
  - quantidade de visitas aprovadas;
  - valor unitário;
  - descontos;
  - acréscimos;
  - valor total;
  - vencimento;
  - status: rascunho, emitida, enviada, paga, vencida, cancelada;
  - link de pagamento opcional;
  - anexo de boleto ou PDF opcional;
  - observações;
  - administrador responsável;
  - data/hora de emissão.

  Ao emitir:
  - criar snapshot das visitas aprovadas que compõem a cobrança;
  - criar checklist financeiro com loja, data, promotor e visita aprovada;
  - vincular cobrança ao relatório mensal da indústria;
  - não permitir remover uma visita já incluída em cobrança emitida;
  - permitir cancelamento com justificativa e trilha de auditoria.

  PORTAL DA INDÚSTRIA:
  Criar área “Financeiro” dentro de `/industry`.

  A indústria deve visualizar somente:
  - próprias cobranças;
  - competência;
  - valor;
  - vencimento;
  - status;
  - relatório mensal relacionado;
  - checklist de visitas cobradas;
  - boleto/PDF/link de pagamento;
  - botão para baixar documentos.

  Não permitir que a indústria edite valores, status ou dados de outras indústrias.

  RETENÇÃO:
  - Respeitar a política de 90 dias configurada no sistema.
  - Antes da exclusão, permitir exportar cobranças, documentos e checklist financeiro.
  - Exibir alerta de expiração.
  - Não manter evidências de visita após o prazo de retenção.
  - Manter ou excluir o resumo financeiro conforme configuração administrativa de retenção, sem alterar a política existente silenciosamente.

  SEGURANÇA E TESTES:
  - Aplicar RLS para impedir acesso entre indústrias.
  - Registrar criação, edição, emissão, envio, pagamento, cancelamento e download.
  - Criar contrato de teste para King com valor por visita aprovada.
  - Criar visitas aprovadas de teste.
  - Gerar cobrança de competência mensal.
  - Validar cálculo.
  - Entrar como indústria King e confirmar acesso somente à própria cobrança.
  - Testar alteração de valor contratual após emissão e confirmar que a fatura antiga não muda.

  Após essa missão, o sistema terá o fluxo completo: planejamento → execução → prova → aprovação → relatório → exportação → cobrança.
  */
  return <Navigate to="/admin" />;
}

