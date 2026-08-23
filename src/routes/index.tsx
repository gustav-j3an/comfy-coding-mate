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
MISSÃO IMPORTAÇÃO 1 — BASE SEGURA DE IMPORTAÇÃO OPERACIONAL

O novo módulo de importação foi criado em `/admin/import`.

OBJETIVO
Criar a estrutura de upload, leitura, prévia e validação de planilhas Excel sem gravar dados no banco.

FUNCIONALIDADES IMPLEMENTADAS
1. Mapeamento Excel: Leitura das abas PROMOTORES, LOJAS, INDUSTRIA e ROTEIROS.
2. Filtro de Abas: Abas CONSULTA e FREQUÊNCIA INDÚSTRIA são ignoradas automaticamente.
3. Normalização: Dados de roteiro (indústria, loja, promotor, frequência e dias da semana) normalizados para prévia.
4. Validação de Referência: Detecção de promotores, lojas ou indústrias citadas em roteiros que não existem em seus respectivos cadastros.
5. Detecção de Inconsistências:
   - Campos obrigatórios vazios.
   - Duplicidade de paradas/roteiros.
   - Frequências ou marcações de dias inválidas.
6. Interface Administrativa:
   - Resumo com contagens totais.
   - Aba de Inconsistências com alertas detalhados.
   - Aba de Prévia com as primeiras 20 linhas de dados normalizados.
7. Segurança: Acesso restrito a administradores e gravação desabilitada nesta fase.

ESTRATÉGIA DE LEITURA
Utilização da biblioteca `xlsx` no frontend para processamento seguro e rápido, permitindo validações imediatas antes de qualquer interação com o servidor.

PRÓXIMA ETAPA
Implementação da gravação definitiva e sincronização com as tabelas operacionais.
        </div>
      </div>
    </div>
  );
}
