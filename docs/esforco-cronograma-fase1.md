# Esforço — Cronograma Fase 1 (MVP V2)

> Levantamento de esforço por tarefa, baseado em `CRONOGRAMA_FASE1_MVP_V2.md`.
> **Importante:** o cronograma original não traz horas preenchidas; os valores abaixo são **estimativas** a partir do escopo descrito em cada task.

| # | Título | Descrição | Esforço (h) | Status |
|---|---|---|---|---|
| 1 | Campo de plano no tenant | Adiciona enum `plan` (essentials/full) no schema do tenant no Strapi, base para feature flags. | 4 | ok |
| 2 | Tenants do usuário no JWT | Inclui lista de tenants acessíveis (id, uid, name, plan) no payload JWT; ajusta AuthContext/TenantContext para ler da token. | 16 | ok |
| 3 | NormalizedEvent no ALERT | Cria modelo `NormalizedEvent`, endpoint `POST /events/ingest`, interface `IVendorNormalizer` e registry de normalizadores no microserviço ALERT. | 32 | ok |
| 4 | Taxonomia de categorias v1 | Enum com 8 categorias padrão (NETWORK_INTRUSION, AUTH_ANOMALY, etc.) + mapeamento FortiGATE → categoria. | 4 | ok |
| 5 | Schema do incidente no TICKET | Audita e adiciona campos faltantes (13 obrigatórios: incident_id, tenant_id, severity, status, sources_involved, first/last_seen_at, etc.). | 8 | pendente |
| 6 | Campos de instrumentação p/ Analytics | Inclui 7 timestamps/classificadores no incidente (detected_at, acknowledged_at, resolved_at, triaged_by, ai_first_result_at, escalated, escalated_at) usados pelo SOC Analytics. | 8 | pendente |
| 7 | Documentação do Risk Level | Mapeia e documenta o algoritmo atual do Risk Level (inputs, pesos, fontes) para servir de base à auditoria. | 8 | pendente |
| 8 | Configuração de LLM por finalidade | Separa config de LLM em duas finalidades (Chat e Motor de Análises) — redesign da tela Integrações + backend + migration. Inclui refatoração do chat. | 24 | ok |
| 9 | Propagação de tenant_id via header | Define header `X-Tenant-Id`, middleware de validação contra o JWT em todos os microserviços + envio pelo frontend. | 16 | ok |
| 10 | Normalizador FortiGATE | Implementa `FortiGateNormalizer` plugável no fluxo existente do ALERT (campo `product`, registry, mapeamento de campos para NormalizedEvent). | 24 | ok |
| 11 | Deduplicação de eventos | Calcula `dedup_key` hash, descarta duplicatas na janela de 5 min, incrementa contador; adiciona índice na tabela. | 16 | ok |
| 12 | Feature flags por plano | Hook `usePlanFeatures()` que controla rotas e menu lateral conforme plano do tenant (essentials vs full). | 16 | ok |
| 13 | Auditoria do Risk Level | Compara implementação atual (cron + endpoint + frontend) com a documentação de R01 e produz lista de divergências. | 8 | pendente |
| 14 | LLM Hackone como padrão | Lifecycle de criação de tenant popula automaticamente config LLM da Hackone para chat e análise; migration para tenants existentes. | 8 | ok |
| 15 | Mapeamento de severidade FortiGATE | Traduz severidades do FortiGATE (IPS e Log) para os 4 buckets padrão (Crítico/Alto/Médio/Baixo) via config editável. | 4 | ok |
| 16 | Tela de configuração FortiGATE | UI completa em Integrations: modal com formulário Pull/Push, grids separados por tipo, badges de instâncias ativas, token gerado em modo Push. | 32 | ok |
| 17 | Job de polling FortiGATE | Hangfire job por Source com interface `IIncrementalCollector`, cursor persistido, criação/cancelamento automático via handlers, retry resiliente. | 32 | ok |
| 18 | Degradação graciosa do Risk Level | Corrige bugs mapeados em R02 e garante que Risk Level funciona mesmo com fontes parciais (ex.: só firewall, sem CIS). | 16 | pendente |
| 19 | Motor de correlação (Incident Engine) | Microserviço CORRELATION que agrupa eventos em candidatos a incidente via `correlation_key` determinística por categoria e janela fixa de 60 min. | 40 | não será feito |
| 20 | Severidade final do incidente | Calcula severidade do incidente (max dos eventos + escalation por volume ≥100 e recorrência) no CORRELATION. | 8 | não será feito |
| 21 | Classificação de crown jewels | CRUD de ativos críticos + escalation de +1 nível de severidade em incidentes que os envolvem. | 24 | não será feito |
| 22 | Fallback de IA (Hackone) | TICKET tenta LLM do cliente → LLM Hackone → cria incidente sem IA; campo `ai_status` + banner no frontend quando indisponível. | 12 | ok |
| 23 | Testes do Risk Level | Define e executa 3 cenários (só firewall, firewall+incidentes, full+CIS) para validar score em planos diferentes. | 8 | pendente |
| 24 | Backend de métricas SOC Analytics | Cron de agregação diária + endpoint `GET /analytics/soc` com MTTD/MTTA/MTTR, deltas vs período anterior e badge de abertos. | 32 | pendente |
| 25 | Copiloto IA contextual | ChatWidget vira painel lateral direito que detecta contexto da página (rota, entidade, tenant, filtros) e envia ao backend. | 40 | ok |
| 26 | Risk Level com cards dinâmicos | Renderiza apenas cards disponíveis conforme plano e fontes conectadas; ajusta layout sem espaços vazios. | 16 | não será feito |
| 27 | Monitoria de Ingestão (Essentials) | Adapta `MonitoriaSOC` para exibir volume/dia, última sincronização e status das fontes FortiGATE em vez de Wazuh/Storage. | 24 | não será feito |
| 28 | Redesign SOC Analytics | Refaz `SOCAnalytics.tsx` conforme Figma: 4 KPIs com deltas, donut por severidade, Risk Level embedded, Performance IA e drill-down. | 40 | pendente |
| 29 | Prompts sugeridos + resposta estruturada | Prompts contextuais por tela (Home, Risk Level, Incidente) + resposta do Copiloto em JSON estruturado (summary, why_it_matters, evidence, confidence, next_steps). | 24 | não será feito |
| 30 | Geração de artefatos de comunicação | Copiloto gera resumo técnico, executivo e nota para cliente com ações de copiar/editar/gerar-versão/salvar-como-nota-IRIS. | 24 | não será feito |

## Resumo

| Métrica | Horas |
|---|---|
| Total estimado | 614 |
| Entregue (`ok`) | 276 |
| Pendente | 128 |
| Descartado (`não será feito`) | 210 |

| Status | Qtde tarefas |
|---|---|
| ok | 15 |
| pendente | 8 |
| não será feito | 7 |
| **Total** | **30** |
