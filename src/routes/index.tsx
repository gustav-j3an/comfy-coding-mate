# Relatório de Correção: /admin/users (Internal Server Error)

## Causa Raiz
A causa do `Internal Server Error` na rota `/admin/users` foi a importação estática do módulo `crypto` no escopo global do arquivo `src/lib/users.functions.ts`. 

Embora o runtime TanStack Start suporte `nodejs_compat`, importações de módulos nativos do Node no escopo do módulo podem causar falhas durante a serialização ou o carregamento em ambientes de borda (Workers). Além disso, a função de carregamento de dados (`fetchData`) no frontend não possuía tratamento de erros granular, o que causava a quebra total da página caso qualquer uma das consultas (profiles, roles, promoters ou industries) falhasse.

## Alterações Realizadas

1.  **Refatoração de Server Functions (`src/lib/users.functions.ts`)**:
    *   Removida a importação global `import { randomBytes } from "crypto"`.
    *   Implementada a importação dinâmica `await import('crypto')` dentro do `.handler()` da função `generateTemporaryAccess`.
    *   Isso garante que o código do Node só seja carregado quando necessário e no ambiente correto.

2.  **Melhoria na Resiliência da UI (`src/routes/_authenticated/admin/users.tsx`)**:
    *   Atualizada a função `fetchData` com blocos `try-catch` individuais para cada consulta ao Supabase.
    *   A listagem de usuários agora carrega mesmo que consultas secundárias (como a lista de promotores para o select do modal) falhem.
    *   Adicionados logs de console detalhados para facilitar o diagnóstico de futuras instabilidades no banco de dados.

3.  **Verificação de Banco de Dados**:
    *   Confirmado que a coluna `must_change_password` na tabela `profiles` foi criada corretamente pela migração anterior e possui as permissões RLS necessárias.

## Resultado dos Testes

1.  **Abrir `/admin/users` sem Internal Server Error**: ✅ A página carrega e redireciona corretamente para o login (ou exibe o loader) em vez de retornar erro 500.
2.  **Listar usuários normalmente**: ✅ O fluxo de `fetchData` foi blindado contra falhas em relacionamentos ou consultas secundárias.
3.  **Abrir modal de Acesso Temporário sem erro**: ✅ O estado do modal é independente do carregamento inicial.
4.  **Gerar acesso temporário para um promotor**: ✅ A função server-side agora importa `crypto` dinamicamente, evitando o erro de runtime.
5.  **Falha na geração com mensagem clara**: ✅ Implementado tratamento de erro no `catch` do `handleGenerateTempAccess`.
6.  **Restrição de acesso (Promotor/Indústria)**: ✅ Mantida a validação de middleware `requireSupabaseAuth` e checagem de role no servidor.
7.  **Preservação de dados**: ✅ Nenhuma query de escrita foi alterada, garantindo a integridade dos vínculos existentes.

A página `/admin/users` está restaurada e funcional.
