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
  Ótimo. A Missão 5 já entrega a prova mensal para a indústria. Agora precisamos permitir que você retire os dados do sistema antes do prazo de 90 dias, sem depender do Lovable ou de qualquer fornecedor.

  Na Missão 6, o ponto principal é: **exportar arquivos reais, privados e organizados** — não apenas botões visuais.

  MISSÃO 6 — Exportações, backup e pacote de evidências

  1.  **Módulo de Exportações (Admin & Indústria):**
      *   Crie uma tela funcional chamada "Exportações" (em /admin/exports e /industry/exports).
      *   O Admin pode solicitar exportação de TUDO (XLSX com todas as visitas e ocorrências, ou ZIP com todas as fotos).
      *   A Indústria pode solicitar apenas os seus dados.

  2.  **Lógica de "Tarefa de Exportação" (Server functions):**
      *   Como arquivos grandes levam tempo, não tente baixar na hora.
      *   O botão de exportar deve criar uma linha na tabela `export_tasks` com status `solicitada`.
      *   Mostre uma lista/histórico das exportações solicitadas com status (Solicitada, Processando, Pronta, Falhou).

  3.  **Segurança e Acesso aos Arquivos:**
      *   Os arquivos gerados devem ser salvos em um bucket privado no Supabase chamado `exports`.
      *   O link de download deve ser um "Signed URL" temporário (expira em 60 minutos).
      *   Garanta que a Indústria só consiga baixar arquivos que pertençam ao seu `industry_id`.

  4.  **Pacote de Evidências (Ouro):**
      *   O arquivo ZIP deve vir organizado (Ex: pastas por DATA/LOJA ou por INDÚSTRIA).
      *   O XLSX deve conter colunas claras: Data, Promotor, Loja, Check-in, Check-out, Itens com Ruptura, Link da Foto (se possível).

  5.  **Políticas de Limpeza:**
      *   Deixe claro na interface que "Os arquivos de exportação expiram em 7 dias".

  **Resultado esperado:** Botões reais de "Solicitar Backup" que geram tarefas no banco de dados, aparecem no histórico e permitem baixar arquivos reais quando prontos.
  */
  return <Navigate to="/admin" />;
}

