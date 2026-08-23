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
CONFIGURAR URL PÚBLICA OFICIAL DO ROTA DO PROMOTOR

Configure no Lovable a variável de ambiente pública:

`PUBLIC_APP_URL=https://comfy-coding-mate.lovable.app`

Regras obrigatórias:

- Use essa variável como única origem da URL oficial do aplicativo.
- Atualize as funções server-side de convite, reenvio de convite, redefinição de senha e convite por WhatsApp para usar `PUBLIC_APP_URL`.
- Os links devem ser gerados assim:

`https://comfy-coding-mate.lovable.app/auth/callback?next=/primeiro-acesso`

- Nunca utilizar `localhost`, `localhost:3000`, `localhost:8080`, domínio `id-preview`, `window.location.origin` ou detecção dinâmica de ambiente como fallback para links enviados a promotores.
- Se `PUBLIC_APP_URL` não estiver configurada, bloquear o envio do convite e mostrar ao Admin:
  `URL pública do aplicativo não configurada. Contate o administrador do sistema.`
- Não exponha nenhuma chave, token, senha, URL de banco ou credencial de serviço no frontend.
- `PUBLIC_APP_URL` não é segredo, mas as demais variáveis devem continuar protegidas no backend.

VALIDAÇÃO

1. Gere um novo convite por WhatsApp.
2. Confirme que o link usa `https://comfy-coding-mate.lovable.app`.
3. Confirme que não existe `localhost` nem domínio de Preview no link.
4. Abra o link em janela anônima.
5. Confirme que a página de primeiro acesso abre corretamente.
6. Confirme que o promotor cria senha e entra no próprio painel.

Ao concluir, informe onde a variável foi configurada, quais funções passaram a utilizá-la e o resultado dos seis testes.
        </div>
      </div>
    </div>
  );
}