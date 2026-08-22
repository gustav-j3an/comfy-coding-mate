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
  Ótimo. A Missão 7 fecha o ciclo financeiro, mas antes de colocar em produção faça um teste real: crie uma visita aprovada, gere uma cobrança, altere o valor do contrato e confirme que a cobrança já emitida não muda.

  A próxima missão é a automação com n8n e a exclusão após 90 dias. O n8n receberá apenas eventos e metadados — nunca fotos, vídeos ou PDFs.

  MISSÃO 8 — Integração n8n, alertas e retenção automática de 90 dias.

  OBJETIVO:
  Preparar e implementar integração segura entre o sistema e n8n para alertas, relatórios, cobranças e exclusão automática de dados expirados.

  SEGURANÇA:
  - Não enviar fotos, vídeos ou PDFs pelo webhook.
  - Enviar apenas IDs, tipo de evento e metadados necessários.
  - Configurar URL do webhook e segredo somente em variáveis de ambiente do backend.
  - Nunca expor URL secreta, token ou chave no frontend.
  - Implementar autenticação entre sistema e n8n usando segredo de webhook.
  - Registrar tentativas, sucesso e falha de cada evento.
  - Implementar nova tentativa automática para falhas temporárias.

  EVENTOS PARA N8N:
  Criar webhooks de saída para:

  1. Visita enviada:
  - ID da visita;
  - promotor;
  - loja;
  - indústria;
  - data/hora;
  - status;
  - tipo de ocorrência, se houver.

  2. Visita aprovada:
  - ID da visita;
  - indústria;
  - promotor;
  - loja;
  - administrador responsável;
  - data/hora da aprovação.

  3. Visita reprovada:
  - ID da visita;
  - promotor;
  - motivo da reprovação;
  - administrador responsável.

  4. Ocorrência criada:
  - indústria;
  - loja;
  - promotor;
  - tipo;
  - status;
  - data/hora.

  5. Relatório mensal publicado:
  - indústria;
  - competência;
  - ID do relatório;
  - indicadores principais;
  - link seguro para visualização.

  6. Cobrança emitida:
  - indústria;
  - competência;
  - valor;
  - vencimento;
  - ID da cobrança;
  - link seguro para portal financeiro.

  7. Cobrança vencida:
  - indústria;
  - número da cobrança;
  - valor;
  - dias em atraso.

  AUTOMAÇÕES AGENDADAS:
  Preparar chamadas para n8n executar:

  - aviso diário ao administrador sobre visitas pendentes de conferência;
  - resumo diário de visitas previstas, enviadas, aprovadas e reprovadas;
  - alerta de roteiro do dia para cada promotor;
  - alerta de ocorrência aberta;
  - aviso de relatório mensal disponível;
  - aviso de cobrança próxima do vencimento;
  - aviso de cobrança vencida;
  - aviso de retenção de dados 15 dias antes;
  - aviso de retenção de dados 3 dias antes.

  RETENÇÃO DE 90 DIAS:
  Criar rotina agendada e auditável para:
  - identificar evidências, ocorrências e detalhes operacionais expirados;
  - avisar usuários antes da exclusão;
  - garantir que exportações em processamento sejam concluídas antes da exclusão;
  - excluir arquivos privados do bucket;
  - excluir ou anonimizar detalhes operacionais conforme política atual;
  - manter snapshots mensais apenas conforme configuração de retenção;
  - registrar log de exclusão com quantidade de visitas, arquivos e dados removidos;
  - nunca excluir arquivos antes do prazo de 90 dias;
  - nunca excluir dados de outra indústria por erro de filtro.

  CONFIGURAÇÃO ADMINISTRATIVA:
  Criar área “Integrações e Automação” acessível apenas a administradores:
  - status da conexão n8n;
  - última execução;
  - lista de eventos;
  - histórico de falhas;
  - botão de teste de webhook;
  - configuração de alertas ativos/inativos;
  - prazo de retenção, inicialmente definido como 90 dias.

  TESTES:
  - testar webhook de visita enviada;
  - testar aprovação e reprovação;
  - testar publicação de relatório;
  - testar emissão de cobrança;
  - testar evento de retenção com dado de teste expirado;
  - confirmar que o payload não contém mídia, senha, token ou dados de outras indústrias;
  - confirmar que falha de webhook não impede envio de visita ou aprovação.

  Depois disso, faremos a última missão: PWA instalável, testes em celular, permissões de câmera/GPS e publicação segura do aplicativo.
  */
  return <Navigate to="/admin" />;
}
