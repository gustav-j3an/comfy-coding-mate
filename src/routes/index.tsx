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
  A Missão 8 está bem encaminhada, mas eu não seguiria para publicação ainda. Pelo relatório, há dois pontos que precisam ser endurecidos:

  1. O segredo HMAC não deve ficar editável ou visível no painel administrativo. Ele deve ficar exclusivamente nos segredos/variáveis de ambiente do backend.
  2. O botão de “forçar limpeza” não pode apagar dados imediatamente sem prévia, confirmação forte e auditoria.

  Também precisamos garantir que a rotina apague os arquivos físicos do Storage, não somente os registros no banco.

  Envie esta correção antes da missão de PWA/publicação:

  MISSÃO 8.1 — Endurecimento de segurança da automação e retenção.

  Corrigir os seguintes pontos sem remover as funcionalidades da Missão 8.

  SEGREDOS E WEBHOOK:
  - Remover do painel administrativo qualquer campo que revele ou permita ler o segredo HMAC.
  - Não salvar o segredo HMAC em texto aberto na tabela `automation_settings`.
  - Armazenar URL do n8n, segredo HMAC e credenciais somente em variáveis de ambiente/segredos do backend.
  - O painel `/admin/automation` deve mostrar apenas:
    - conexão configurada ou não configurada;
    - domínio autorizado;
    - data da última comunicação;
    - resultado do último teste;
    - eventos ativos;
    - logs sanitizados.
  - Não mostrar URL completa sensível, segredo, token ou payload completo.
  - Aceitar somente URLs HTTPS e domínios previamente autorizados para o webhook.
  - Assinar cada webhook com HMAC-SHA256 e timestamp.
  - Implementar proteção contra repetição: o n8n deve poder rejeitar eventos com timestamp expirado.
  - Não armazenar dados sensíveis, e-mails completos, links assinados, URLs de mídia, senhas ou tokens nos logs de webhook.

  LIMPEZA DE DADOS:
  - Confirmar que a rotina exclui os arquivos físicos privados do Storage, não apenas metadados no banco.
  - Se a exclusão de arquivo falhar, registrar falha e manter item em fila para nova tentativa.
  - Só excluir o registro de evidência após sucesso ou status controlado de exclusão do arquivo.
  - Nunca excluir visitas que façam parte de uma cobrança emitida sem garantir que o snapshot financeiro e checklist financeiro estejam preservados.
  - Preservar contratos, cobranças, snapshots financeiros e logs de auditoria conforme política configurada.
  - Manter política mínima de retenção de 90 dias; não permitir configurar prazo menor sem confirmação explícita e registro de auditoria.

  AÇÃO MANUAL:
  - Substituir “forçar limpeza” por “Prévia de limpeza”.
  - A prévia deve mostrar quantidade de visitas, evidências, ocorrências e arquivos que seriam excluídos.
  - Para confirmar a exclusão manual, exigir que o administrador digite exatamente:
    `EXCLUIR DADOS EXPIRADOS`
  - Registrar administrador, data/hora, quantidade de registros e resultado.
  - Não permitir exclusão manual de dados ainda dentro do prazo de 90 dias.

  ALERTAS:
  - Implementar e registrar alertas de retenção com 15 e 3 dias de antecedência.
  - Alertas devem informar indústria, período, quantidade estimada de evidências e link para exportação.
  - Não enviar arquivos de mídia ao n8n.

  TESTES:
  - Confirmar que segredo HMAC não aparece no frontend, banco de dados de configuração ou logs.
  - Testar exclusão física de arquivo de evidência em ambiente de teste.
  - Testar falha de exclusão e nova tentativa.
  - Testar prévia de limpeza sem apagar nada.
  - Testar confirmação manual.
  - Confirmar que cobrança emitida continua consistente após a limpeza dos dados operacionais.

  Depois dessa correção, seguimos para a Missão 9: aplicativo instalável no celular, permissões de câmera/GPS, teste de upload e publicação.
  */
  return <Navigate to="/admin" />;
}
