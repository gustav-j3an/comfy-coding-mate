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
  MISSÃO 9 — PWA instalável, uso em celular e preparação para publicação.

  OBJETIVO:
  Preparar o Rota do Promotor para ser instalado e usado por promotores em Android e iPhone, sem publicar em produção automaticamente.

  PWA:
  - Criar manifest completo com nome “Rota do Promotor”.
  - Criar ícones adequados para instalação.
  - Configurar tema, cor de fundo e tela de abertura.
  - Configurar service worker.
  - Permitir instalação pelo navegador em Android e iPhone.
  - Exibir botão ou orientação discreta “Instalar aplicativo” somente quando compatível.
  - Não criar aplicativo nativo nesta fase.

  SEGURANÇA DE CACHE:
  - Cachear somente arquivos estáticos necessários para abrir a interface.
  - Nunca manter em cache público:
    - fotos;
    - vídeos;
    - PDFs;
    - links assinados;
    - dados de visitas;
    - dados financeiros;
    - dados de outras indústrias.
  - Ao sair da conta, limpar dados sensíveis armazenados localmente.
  - Não exibir dados sensíveis em notificações.

  CELULAR E PROMOTOR:
  - Garantir interface mobile-first em `/promoter`.
  - Botões grandes e fáceis de usar com uma mão.
  - Exibir indicador de conexão: online, sem conexão e reconectando.
  - Exibir progresso de envio de foto, vídeo e PDF.
  - Não permitir duplicação de envio ao tocar várias vezes.
  - Mostrar mensagem clara quando câmera, GPS ou upload falharem.
  - Solicitar localização somente no momento de registrar visita.
  - Solicitar câmera somente ao tocar em “Tirar foto”.
  - Priorizar captura por câmera em celular.
  - Não prometer bloqueio absoluto da galeria, pois navegadores e sistemas operacionais podem oferecer essa opção.
  - Validar permissões recusadas e orientar o usuário a habilitá-las nas configurações do aparelho.

  SESSÃO E LOGIN:
  - Manter login seguro entre aberturas do aplicativo.
  - Permitir sair da conta claramente.
  - Ao sair, limpar sessão e dados sensíveis locais.
  - Redirecionar cada perfil para sua área correta após reabrir:
    - administrador: `/admin`;
    - promotor: `/promoter`;
    - indústria: `/industry`.

  PREPARAÇÃO PARA PRODUÇÃO:
  - Criar página administrativa de diagnóstico, exclusiva para administradores, com:
    - status do Supabase;
    - status da automação n8n;
    - status do Storage;
    - status do PWA;
    - versão atual do aplicativo;
    - data da última limpeza;
    - último erro crítico, sem expor segredos.
  - Preparar variáveis de ambiente necessárias para produção.
  - Criar configuração de URLs permitidas para autenticação e recuperação de senha.
  - Documentar, em uma tela ou arquivo de administração, os passos para:
    - conectar domínio próprio;
    - configurar URL de produção no Supabase;
    - configurar redirecionamento de convite e redefinição de senha;
    - configurar variáveis de ambiente;
    - conectar n8n.
  - Não publicar sem confirmação explícita do administrador.

  TESTES OBRIGATÓRIOS:
  - Testar layout em largura de Android e iPhone.
  - Testar instalação PWA.
  - Testar login e logout.
  - Testar abertura da câmera.
  - Testar solicitação de GPS.
  - Testar envio de foto.
  - Testar comportamento sem conexão, exibindo mensagem clara.
  - Testar que arquivos privados não aparecem em cache público.
  - Testar acesso de promotor, administrador e indústria após instalação.
  - Corrigir links quebrados e erros de navegação.

  Ao finalizar, entregar checklist de publicação com os itens que ainda dependem de configuração manual fora do Lovable.
  */
  return <Navigate to="/admin" />;
}
