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
  Está praticamente pronto para o piloto. Mas há uma correção importante antes de publicar:

  O relatório diz que a rotina preserva “evidências vinculadas a faturamentos”. Isso contraria sua regra de excluir todas as provas após 90 dias. O correto é preservar só o snapshot financeiro/checklist; fotos, vídeos e PDFs devem ser apagados mesmo que tenham feito parte de uma cobrança.

  MISSÃO 9.1 — Correção final de retenção e atualização do PWA.

  Corrigir a regra de retenção:
  - Após 90 dias, excluir fotos, vídeos, PDFs, metadados de evidência, ocorrências detalhadas e dados operacionais, mesmo quando a visita estiver vinculada a uma cobrança.
  - Não preservar evidências de mídia somente por estarem ligadas ao faturamento.
  - Preservar apenas o snapshot financeiro necessário:
    - número da cobrança;
    - competência;
    - indústria;
    - quantidade de visitas aprovadas;
    - valor unitário;
    - valor total;
    - checklist resumido sem mídia;
    - status de pagamento.
  - Após excluir mídia, o relatório e a cobrança devem mostrar “Evidência expirada conforme política de retenção de 90 dias”.
  - Garantir que exportações solicitadas antes da expiração possam ser concluídas normalmente.

  Ajustar atualização automática do PWA:
  - Não aplicar atualização automática enquanto houver upload de foto, vídeo ou PDF em andamento.
  - Avisar o usuário que existe atualização disponível e aplicar somente após concluir ou cancelar o envio.
  - Confirmar que uma atualização não causa perda de formulário ou evidência em andamento.

  Depois, faça o piloto com:
  1. Você como administrador.
  2. Um promotor real.
  3. Uma indústria real.
  4. Uma loja e um roteiro de segunda-feira.
  5. Uma visita com foto.
  6. Uma aprovação.
  7. Um relatório mensal.
  8. Uma cobrança teste.
  9. Uma exportação ZIP.
  10. Um teste no celular com o app instalado.

  Eu não consigo acessar o @security-memory do Lovable daqui, mas a orientação acima é a regra correta para ele: segredos somente no backend, mídia sempre privada e exclusão total das provas após 90 dias.
  */
  return <Navigate to="/admin" />;
}
