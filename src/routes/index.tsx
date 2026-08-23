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
Entendi. Não precisa de API: o sistema pode gerar o link de acesso e abrir o WhatsApp do promotor com a mensagem pronta. Você só confere e toca em **Enviar**.

Isso não é envio automático; é um atalho seguro pelo navegador/WhatsApp.

Cole este prompt no Lovable:

MISSÃO — CONVITE MANUAL PELO WHATSAPP, SEM API

Implemente um fluxo de convite manual por WhatsApp no módulo Usuários e Acessos.

Não use API do WhatsApp, WhatsApp Web automatizado ou qualquer envio automático.

OBJETIVO

O Admin seleciona um promotor, gera um link de primeiro acesso seguro e clica em:

`Enviar convite por WhatsApp`

O sistema deve abrir o WhatsApp do promotor com uma mensagem já preenchida. O Admin apenas revisa e toca em Enviar.

FLUXO

1. No cadastro/lista de Promotores, usar o telefone já cadastrado.
2. Ao clicar em `Enviar convite por WhatsApp`:
   - validar no servidor que o usuário atual é Admin;
   - validar que existe promotor vinculado;
   - validar que existe telefone válido;
   - gerar um link único e temporário de primeiro acesso;
   - abrir uma nova janela/aba usando:
     `https://wa.me/[telefone-normalizado]?text=[mensagem-codificada]`
3. Nunca enviar a mensagem automaticamente.

NÚMERO DE TELEFONE

- Normalizar para somente dígitos.
- Usar formato internacional do Brasil: `55` + DDD + número.
- Remover `+`, espaços, parênteses e traços.
- Se o número estiver inválido ou ausente, bloquear a ação e informar o Admin.

LINK DE ACESSO

- O link deve ser gerado exclusivamente no backend.
- Não use localhost.
- Use a URL pública oficial do aplicativo.
- O link deve levar a `/primeiro-acesso`.
- Deve ser de uso único e expirar em até 48 horas.
- Ao gerar novo convite para o mesmo promotor, invalide o anterior.
- Não grave token puro no banco, logs, histórico ou interface.
- Armazene apenas hash/estado seguro do convite, se for necessário persistir.
- Não exponha chave de serviço no frontend.

Use o mecanismo seguro de geração de link de convite do Supabase no backend, sem disparar e-mail. Se isso exigir uma confirmação adicional no Supabase, faça o fluxo de callback apontar para a URL pública já configurada.

MENSAGEM PADRÃO

Olá, [NOME DO PROMOTOR]! 👋

Você foi convidado para usar o Rota do Promotor.

Acesse o link abaixo para criar sua senha, ver seu roteiro e instalar o aplicativo no seu celular:

[LINK_DE_ACESSO]

Depois de entrar, toque em “Instalar aplicativo” para deixar o Rota do Promotor na tela inicial do celular.

SEGURANÇA E EXPERIÊNCIA

- Mostrar confirmação antes de abrir o WhatsApp.
- Exibir apenas: nome do promotor e telefone parcialmente mascarado.
- Registrar em auditoria somente que o convite foi gerado/aberto, sem salvar o link ou token.
- Após usar o link, encaminhar o promotor ao primeiro acesso e depois ao próprio painel.
- Link inválido, expirado ou já utilizado deve mostrar mensagem clara e botão para solicitar novo convite.
- Usuário Promotor e Indústria não podem gerar links de convite.

TESTES

1. Admin gera convite para promotor com telefone válido.
2. WhatsApp abre com telefone correto e mensagem preenchida.
3. O link abre o domínio público, nunca localhost.
4. Promotor usa o link, cria senha e acessa o próprio painel.
5. Link expirado/usado mostra mensagem clara.
6. Novo convite invalida o anterior.
7. Telefone ausente/inválido bloqueia a ação.
8. Nenhum token aparece na interface, banco ou logs.

ENTREGA

Informe os arquivos alterados, como o telefone foi normalizado e o resultado individual dos oito testes.

Não implemente envio automático; apenas abrir o WhatsApp com a mensagem pronta.
        </div>
      </div>
    </div>
  );
}