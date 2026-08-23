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
Entendi. São três problemas ligados:

- o módulo de usuários quebra porque a consulta presume uma relação inexistente entre `profiles` e `user_roles`;
- o convite está apontando para `localhost:8080`, por isso o promotor recebe uma página quebrada;
- falta uma página simples de primeiro acesso com botão para instalar o PWA no celular.

Importante: o link exibido na imagem contém um token de acesso. Não use esse convite; depois da correção, envie um convite novo.

Cole este prompt no Lovable:

MISSÃO — CORRIGIR CONVITE DE PROMOTOR E PRIMEIRO ACESSO AO APLICATIVO

Corrija o fluxo completo de convite de promotores, desde o painel Admin até o primeiro acesso e a instalação do PWA.

Não altere roteiros, visitas, importação, faturamento ou políticas de retenção de mídias.

PARTE 1 — CORRIGIR USUÁRIOS E VÍNCULO COM PROMOTOR

O painel mostra o erro:

`Could not find a relationship between 'profiles' and 'user_roles' in the schema cache`

Não presuma uma relação inexistente no Supabase.

Investigue a estrutura real de:

- `profiles`;
- `user_roles`;
- `promoters`;
- colunas `id`, `user_id`, `profile_id`, `promoter_id` ou equivalentes;
- foreign keys existentes.

Corrija a listagem de Usuários e Acessos para buscar dados de forma compatível com o schema real. Se necessário, faça consultas separadas e una os resultados no backend, sem criar um relacionamento falso.

No modal “Convidar Novo Usuário”:

- ao selecionar perfil Promotor, a lista “Vincular a Promotor Cadastrado” deve carregar promotores sem usuário vinculado;
- mostrar nome, cidade/UF e matrícula, se disponível;
- o valor enviado deve ser o `promoters.id` real;
- tornar o vínculo obrigatório para perfil Promotor;
- não exigir vínculo para Admin ou Indústria, salvo regra existente;
- mostrar erro claro caso não existam promotores disponíveis.

PARTE 2 — CORRIGIR ENVIO E REDIRECIONAMENTO DO CONVITE

O convite atual redireciona para:

`localhost:8080/auth/callback`

Isso é inválido para o promotor e deve ser removido de todo fluxo de produção/Preview.

Implemente:

- envio de convite somente por função server-side, validando Admin no banco;
- uso de URL pública e autorizada do aplicativo para `redirectTo`;
- nunca usar `localhost`, URL fixa de desenvolvimento ou origem fornecida livremente pelo frontend;
- definir uma variável/configuração segura para a URL pública oficial do app;
- configurar no Supabase Auth as URLs autorizadas necessárias para Preview e produção;
- usar callback como `/auth/callback`, com retorno seguro para `/primeiro-acesso`;
- validar o parâmetro de retorno contra uma lista interna, evitando open redirect;
- tratar token inválido, expirado ou já utilizado com uma tela clara e botão para solicitar novo convite;
- não mostrar token, erro técnico bruto ou URL sensível na tela.

Após concluir o cadastro/senha, encaminhar o promotor para o painel dele.

PARTE 3 — PÁGINA DE PRIMEIRO ACESSO E INSTALAÇÃO DO APLICATIVO

Crie a página pública/autenticada de primeiro acesso:

`/primeiro-acesso`

Ela deve explicar, em linguagem simples:

1. “Crie sua senha para acessar o Rota do Promotor.”
2. “Depois, instale o aplicativo neste celular para acessar seu roteiro e enviar fotos.”
3. Exibir botão `Instalar aplicativo`.

Regras do botão:

- se o navegador suportar a instalação do PWA, mostrar o botão e disparar o fluxo nativo de instalação;
- no Android/Chrome, explicar: “Toque em Instalar”;
- no iPhone/Safari, explicar: “Toque em Compartilhar e depois em Adicionar à Tela de Início”;
- se o aplicativo já estiver instalado, informar isso e mostrar `Abrir aplicativo`;
- nunca prometer download de APK: é um aplicativo web instalável (PWA);
- o promotor deve poder continuar para `Meu roteiro` após concluir ou ignorar a instalação.

PARTE 4 — SEGURANÇA

- Somente Admin envia convite.
- O vínculo de promotor deve ser validado no servidor.
- Não permitir que o convite vincule um usuário a promotor já ocupado sem confirmação/regra explícita.
- Não expor chave de serviço no frontend.
- Não confiar somente na validação visual do formulário.
- Não logar token de convite, senha ou URL completa com credenciais.

TESTES OBRIGATÓRIOS

1. Painel Usuários e Acessos abre sem erro de relacionamento.
2. Modal de convite carrega promotores disponíveis.
3. Admin convida um promotor com e-mail válido e vínculo correto.
4. O convite novo abre a URL pública do app, nunca localhost.
5. Promotor cria senha e entra no próprio painel.
6. A página Primeiro Acesso oferece instalação do PWA.
7. Promotor não vê dados de outro promotor.
8. Convite inválido/expirado mostra mensagem clara.
9. Admin/Indústria não conseguem usar o convite para acessar painel de Promotor indevidamente.

ENTREGA

Informe:

- causa raiz da relação quebrada;
- esquema real usado para vincular usuário e promotor;
- URLs configuradas para Auth;
- arquivos e configurações alterados;
- resultado individual dos nove testes;
- confirme que um novo convite foi testado sem redirecionar para localhost.

Não use nem reutilize o convite antigo; gere um novo somente após a correção.
        </div>
      </div>
    </div>
  );
}
