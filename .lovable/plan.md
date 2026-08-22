# Missão 4: Registro de Visitas, Evidências e Ocorrências

Conclusão da Missão 4 e preparação para a Missão 5.

## O que foi feito (Missão 4)
- **Integridade de Dados:** Padronização da relação entre `promoters` e `profiles`. Visitas agora rastreiam tanto o promotor planejado quanto o executor real (útil para testes de admin).
- **Segurança (RLS):** Implementação de políticas RLS para `visit_evidence` (acesso restrito a admins e executores) e `visit_audits` (apenas admins).
- **Experiência do Promotor:** Dashboard mobile-first com roteiro do dia, check-in/check-out com geolocalização e upload de fotos.
- **Auditoria Administrativa:** Tela de conferência com visualização de evidências, geolocalização no mapa e fluxo de aprovação/reprovação.
- **Ocorrências:** Registro de rupturas, produtos vencidos e preços errados, com sincronização automática de indústria e loja.

## Próximos Passos (Missão 5)
- **Dashboard Executivo:** Widgets de alertas em tempo real para rupturas críticas.
- **Relatórios:** Geração de PDFs consolidados por visita ou período.
- **Indústria:** Refinamento do portal para que indústrias vejam apenas suas evidências e ocorrências.

## Detalhes Técnicos
- Utilização de `createServerFn` para operações sensíveis (auditoria, URLs assinadas).
- Bucket `visit-evidences` configurado como privado.
- Trigger Postgres para garantir integridade de `industry_id` em ocorrências.
- Correção de `maybeSingle()` em buscas de convite para evitar erros 406.
