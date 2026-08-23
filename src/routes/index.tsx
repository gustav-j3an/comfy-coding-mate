import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold border-b border-slate-700 pb-4">
          ROTA DO PROMOTOR — STATUS DO PROJETO
        </h1>
        
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
A causa está confirmada: o convite ainda está sendo gerado pelo Supabase com `localhost:3000` como endereço de retorno. Isso não é erro do celular nem do promotor; é uma configuração de Auth que ainda não foi corrigida.

Não use esse link: ele contém um token de acesso e deve ser descartado. Depois da correção, envie um convite novo.

Cole este prompt no Lovable:

CORREÇÃO URGENTE — CONVITES DO SUPABASE AINDA REDIRECIONAM PARA `localhost:3000`

O novo convite continua abrindo em:

`http://localhost:3000/#access_token=...`

Portanto, a correção anterior não alterou a configuração efetiva usada pelo Supabase Auth.

ISSO NÃO É APENAS UMA CORREÇÃO DE FRONTEND.

Investigue e corrija a configuração real do projeto Supabase conectado ao Lovable.

CONFIGURAÇÕES OBRIGATÓRIAS

1. Supabase Auth → URL Configuration

Defina a URL pública oficial do aplicativo como `Site URL`.

Adicione às `Redirect URLs` autorizadas:

- URL pública atual do Preview do Rota Promotor;
- URL pública de produção do Rota Promotor, se já existir;
- caminho `/auth/callback`;
- caminho `/primeiro-acesso`.

Remova `localhost:3000` e `localhost:8080` das configurações usadas por convites de produção/Preview.

2. Envio de convite

Na função server-side de convite/reenvio:

- use `inviteUserByEmail` com `redirectTo` construído a partir da URL pública oficial permitida;
- o destino deve ser:
  `[URL_PÚBLICA_OFICIAL]/auth/callback?next=/primeiro-acesso`
- nunca use `localhost`;
- nunca use URL recebida do frontend;
- use variável de ambiente/configuração segura, por exemplo `PUBLIC_APP_URL`;
- valide que o domínio pertence à lista permitida antes de enviar o convite.

3. Template de e-mail do Supabase

Verifique o template de convite/confirmação:

- ele deve usar a URL de confirmação fornecida pelo Supabase, como `{{ .ConfirmationURL }}`;
- não pode conter texto ou link fixo para `localhost`;
- não pode sobrescrever o destino correto com URL estática.

4. Callback no aplicativo

Na rota `/auth/callback`:

- trate corretamente o token retornado na URL/hash;
- deixe o cliente Supabase criar/recuperar a sessão;
- após sucesso, envie para `/primeiro-acesso`;
- se o token for inválido ou expirado, mostre mensagem clara;
- não exiba página vazia;
- não registre token no console, banco ou tela.

VALIDAÇÃO REAL OBRIGATÓRIA

Depois da correção:

1. Gere um convite totalmente novo para e-mail de teste.
2. Abra em janela anônima ou outro celular.
3. Confirme que a URL começa com o domínio público do aplicativo, nunca `localhost`.
4. Confirme abertura da página de criação de senha/primeiro acesso.
5. Confirme que, após criar senha, o promotor entra no próprio painel.
6. Confirme que o link antigo continua inválido e não deve ser reutilizado.
7. Informe a URL pública configurada, sem tokens nem dados sensíveis.

Não marque como concluído sem abrir um convite novo real e confirmar que ele não redireciona para localhost.
        </div>
      </div>
    </div>
  );
}
