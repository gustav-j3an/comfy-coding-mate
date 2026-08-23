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
Entendi. O promotor já ficou vinculado/ativo, então o sistema provavelmente está bloqueando um novo convite como se a conta já estivesse pronta — mas o link anterior não concluiu o acesso.

A solução é criar uma ação de **Reenviar convite** para conta pendente. Se a conta já tiver senha criada, a ação correta passa a ser **Redefinir acesso**, sem duplicar usuário nem vínculo com o promotor.

Cole este prompt no Lovable:

CORREÇÃO — REENVIAR CONVITE PARA PROMOTOR JÁ VINCULADO

Um promotor já aparece como ativo/vinculado no sistema, mas o convite anterior não funcionou e o link enviado não abre uma tela útil.

O Admin precisa conseguir reenviar o acesso sem criar usuário duplicado, duplicar papel ou perder o vínculo com o promotor.

NÃO apague o promotor, não crie novo promotor e não force novo cadastro para resolver isso.

IMPLEMENTE ESTADOS CLAROS DE ACESSO

Para cada promotor vinculado a usuário, identificar no servidor:

1. Sem conta de acesso.
2. Convite pendente / e-mail ainda não confirmado.
3. Conta ativa / e-mail confirmado.
4. Conta bloqueada ou inválida, se existir essa situação.

Na lista Usuários e Acessos, exiba o estado correto e uma ação contextual:

- Sem conta: `Convidar`
- Convite pendente: `Reenviar convite`
- Conta ativa: `Redefinir acesso`
- Bloqueada: `Ver detalhes` ou ação adequada à regra existente.

REENVIO DE CONVITE

Para Promotor com convite pendente:

- adicionar botão `Reenviar convite`;
- executar somente por função server-side;
- validar que o usuário atual é Admin no banco;
- manter o mesmo usuário, mesmo papel e mesmo `promoter_id`;
- não criar novo `profiles`, `user_roles` ou vínculo duplicado;
- invalidar/substituir de forma segura o link anterior, conforme o fluxo suportado pelo Supabase;
- gerar novo convite com URL pública oficial, nunca localhost;
- mostrar confirmação com data/hora do reenvio, sem exibir token ou link sensível;
- respeitar limite contra envios repetidos, com mensagem clara.

REDEFINIÇÃO DE ACESSO

Para conta já confirmada:

- não enviar “convite” novamente;
- usar fluxo seguro de recuperação/redefinição de senha;
- enviar e-mail para página pública do aplicativo;
- após nova senha, levar o promotor ao painel dele.

TELA DE LINK INVÁLIDO OU EXPIRADO

No callback/primeiro acesso, quando o token estiver expirado, inválido ou já usado:

- exibir mensagem clara:
  `Este link de acesso expirou ou já foi utilizado. Peça ao administrador para reenviar o convite.`
- não exibir tela vazia;
- não mostrar token, URL sensível ou erro técnico;
- incluir botão de voltar para o login.

TESTES OBRIGATÓRIOS

1. Promotor pendente recebe novo convite sem criar registros duplicados.
2. O novo e-mail abre a URL pública correta, nunca localhost.
3. O promotor cria a senha e entra no próprio painel.
4. Link antigo mostra mensagem de expirado/inválido.
5. Conta ativa recebe fluxo de redefinição de acesso, não convite duplicado.
6. Admin não consegue reenviar convite para e-mail diferente sem editar conscientemente o cadastro.
7. Promotor e Indústria não conseguem usar essa ação.
8. O vínculo do promotor permanece o mesmo após reenvio.

ENTREGA

Informe:

- estado atual encontrado para o promotor de teste;
- ação disponibilizada e por quê;
- arquivos alterados;
- resultado individual dos oito testes;
- confirmação de que o novo convite foi testado com URL pública e acesso ao painel do promotor.
        </div>
      </div>
    </div>
  );
}
