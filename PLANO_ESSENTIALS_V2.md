# Plano de Acao — SOC Essentials v2

> Gerado a partir da correlacao entre a especificacao (`[SOC Essentials] - Concepcao de funcionalidade v1.0.md`), o rascunho de tarefas (`rascunho`), e os mapeamentos de funcionalidades existentes no front-end e back-end.
> Complementado com itens de SOC Analytics e Copiloto IA.

---

## Contexto Arquitetural

```
FLUXO ATUAL (com SIEM)
======================
  SIEM (Wazuh) ──► microservico ALERT ──► microservico TICKET ──► IRIS
                   (persiste alerta)       (IA + decisao)          (incidente)

FLUXO ESSENTIALS (sem SIEM)
============================
  Polling Job ──► microservico ALERT ──► microservico TICKET ──► IRIS
  (FortiGATE,     (normaliza +            (IA + decisao)          (incidente)
   Defender...)    persiste alerta)
```

**Decisao arquitetural:** O microservico **ALERT** e o hub inteligente do pipeline.
Ele recebe eventos brutos de qualquer fonte (polling jobs, webhooks, SIEM), identifica
o vendor/source_type, normaliza para o modelo `NormalizedEvent`, e persiste.

Isso significa:
- **Polling Job**: responsavel apenas por coletar (auth + fetch incremental) e enviar o payload bruto para ALERT
- **ALERT**: recebe raw event, identifica a fonte, aplica o normalizador correto (por vendor), persiste o evento normalizado, e encaminha para TICKET
- **TICKET**: recebe evento ja normalizado, aplica IA e decide sobre incidentes

Vantagens dessa abordagem:
1. ALERT se torna o ponto unico de entrada — qualquer nova fonte (polling, webhook, SIEM) envia para o mesmo endpoint
2. Normalizadores ficam centralizados — facilita manter mapeamentos de severidade, categorias e schemas em um so lugar
3. Polling jobs permanecem simples e leves — so fazem coleta, sem logica de dominio
4. Retrocompatibilidade: o fluxo SIEM existente continua funcionando (Wazuh ja envia para ALERT)

---

## 1. Itens do Rascunho — Revisados e Classificados

| ID | Item (descricao revisada) | Origem | Ref. Especificacao | Tipo | Complexidade | Dependencias | Fase | Observacoes |
|----|--------------------------|--------|-------------------|------|-------------|-------------|------|-------------|
| **E01** | Criar tela de configuracao de fontes de dados (FortiGATE) com suporte a multiplas instancias. Campos: fonte (produto/vendor), descricao, URL da API, credenciais | Essentials #1 | §11 (Painel de integracoes), §12 (Coleta) | Front-end | Media | E06, E07 | MVP | Ao salvar, disparar criacao do background job. Prever extensao para outros vendors |
| **E02** | Implementar background job de polling incremental para FortiGATE. Responsavel apenas por: auth, fetch incremental (`since_timestamp`), envio do payload bruto para ALERT. Intervalo configuravel (5-15 min) | Essentials #2 | §5.1 (Adapter — coleta), §12.1 (Modo Pull) | Back-end | Alta | E01, E03 | MVP | Usar script Python existente como base. Cada instancia configurada = 1 job independente. Job nao faz normalizacao — ALERT faz |
| **E03** | Implementar modelo `NormalizedEvent` e camada de normalizacao dentro do microservico ALERT. ALERT recebe eventos brutos, identifica vendor/source_type, aplica normalizador correto e persiste. Campos: event_id, tenant_id, source_type, vendor, product, event_time, ingest_time, severity, category, action, asset, ioc, raw_payload | Essentials #3 | §5.2 (Evento normalizado), Anexo §3.1 | Back-end | Alta | — | MVP | ALERT se torna o hub inteligente. Normalizadores por vendor registrados internamente. Campos nulos permitidos (UI trata) |
| **E04** | Propagar `tenant_id` via header HTTP em todos os microservicos (alert, ticket, e demais) | Essentials #4 | §4 (principio multi-tenant implicito) | Back-end | Media | E05 | MVP | Impacto em todos os microservicos. Atencao a retrocompatibilidade com clientes SIEM |
| **E05** | Incluir lista de tenants do usuario no token JWT. Refatorar front (AuthContext) e back (Strapi) | Essentials #5 | §4 (multi-tenant) | Full Stack | Media | — | MVP | Impacta fluxo de login e troca de tenant no frontend |
| **E06** | Adicionar campo `plan` ao schema do tenant (`essentials` / `full`). Configuravel no painel admin | Essentials #6 | §11.2 (Indicador de maturidade) | Back-end | Baixa | — | MVP | Ponto de entrada para feature flags e licenciamento |
| **E07** | Implementar sistema de feature flags no frontend baseado no plano do tenant. Controlar visibilidade de paginas e componentes | Essentials #7 | §9.1 (Matriz de habilitacao de telas) | Front-end | Media | E06 | MVP | Essentials: Incidents, Risk Level, SOC Analytics (limitado), Monitoria, Threat Map, Relatorios, Home |
| **C01** | Separar configuracao de LLM em duas finalidades: (1) Chat e (2) Motor de Analises de alertas. Incluir botao de validacao | Chat #1 | §8 (IA opcional e BYOAI) | Full Stack | Media | — | MVP | Atualmente so existe config unica. Spec exige separacao para "Bring Your Own AI" |
| **C02** | Configurar LLM padrao da Hackone como fallback automatico para todo tenant novo | Chat #2 | §8.1 (IA SecurityOne padrao), §8.3 (Fallback) | Back-end | Baixa | C01 | MVP | Evento no lifecycle de criacao de tenant |
| **A01** | Validar e ajustar metricas do SOC Analytics (MTTD/MTTA/MTTR) com dados reais do Essentials | Analytics #1 | §10.3 (SOC Analytics) | Full Stack | Media | Pipeline funcional (E02, E03, G04) | Evolucao | Sem SIEM: `first_seen_at` = primeiro evento, `created_at` = criacao do incidente |
| **R01** | Documentar regras de calculo do Risk Level conforme especificacao | Risk Level #1 | §10.1 (Risk Level) | Documentacao | Baixa | — | MVP | Passo preparatorio para auditoria |
| **R02** | Auditar implementacao atual do Risk Level vs especificacao (validar algoritmos) | Risk Level #2 | §10.1 | Back-end | Media | R01 | MVP | Cron `snapshotRiskDebug` roda a cada 5 min — validar se formula esta correta |
| **R03** | Corrigir divergencias no calculo do Risk Level. Implementar degradacao graciosa (funcionar sem CIS, recalcular pesos proporcionalmente) | Risk Level #3 | §10.1 (recalculo proporcional) | Back-end | Alta | R02 | MVP | Atualmente vinculado ao Wazuh. Precisa funcionar com dados do Essentials |
| **R04** | Criar e executar testes do Risk Level com no minimo 3 cenarios: (1) so firewall, (2) firewall+EDR, (3) completo com CIS | Risk Level #4 | §14 (Criterios de aceite #1, #4) | Back-end | Media | R03 | MVP | Garantir que score nao "pune" cliente sem CIS |
| **T01** | Validar que o microservico ticket persiste todos os campos obrigatorios do incidente: incident_id, org_id, created_at, status, severity, title, description, primary_asset, event_count, sources_involved, first_seen_at, last_seen_at, ai_summary | Ticket #1 | §7.3 (Campos minimos), Anexo §5 | Back-end | Baixa | — | MVP | Verificar schema atual vs spec. Adicionar campos faltantes |

---

## 2. Lacunas Identificadas — Itens da Especificacao NAO Cobertos no Rascunho

| ID | Item sugerido | Ref. Especificacao | Tipo | Complexidade | Dependencias | Fase | Observacoes |
|----|--------------|-------------------|------|-------------|-------------|------|-------------|
| **G01** | Implementar padrao Adapter com duas camadas: (1) **Collector** no polling job (interface: auth, fetchIncremental, emitRaw) e (2) **Normalizer** registrado dentro do ALERT (interface: canHandle, normalize, mapSeverity) | §5.1, Apendice A | Arquitetura / Back-end | Alta | E03 | MVP | **Alicerce arquitetural.** Collector = leve (so coleta). Normalizer = dentro do ALERT (inteligencia centralizada). Novos vendors = 1 collector + 1 normalizer |
| **G02** | Implementar engine de mapeamento de severidade por vendor (4 buckets: Critico/Alto/Medio/Baixo) com override customizavel por integracao. Executado dentro do ALERT como parte do pipeline de normalizacao | §6 | Back-end | Media | G01, E03 | MVP | Cada vendor tem severidades proprias. Mapeamento padrao + customizacao no painel. Faz parte da camada de normalizadores do ALERT |
| **G03** | Implementar sistema de deduplicacao de eventos (`dedup_key` por hash) dentro do ALERT, executado apos normalizacao e antes de persistencia | §12.3, Anexo §3.2 | Back-end | Alta | E03 | MVP | `hash(org_id + source_type + vendor + vendor_event_id + event_time + asset_ip + category)`. Executado no pipeline interno do ALERT: raw → normalize → dedup → persist → forward |
| **G04** | Implementar motor de correlacao/agrupamento de eventos (Incident Engine v1) — agrupamento intra-fonte por `correlation_key` | §7.1, Anexo §3-§6 | Back-end | Alta | E03, G01, G03, G06 | MVP | Decisao arquitetural: incorporar ao microservico `ticket` existente ou criar novo componente. Motor deterministico, nao depende de IA |
| **G05** | Implementar merge multi-fonte (Firewall + EDR no mesmo incidente) via MergeKey (asset_host, asset_ip, user) | Anexo §Fase 4 | Back-end | Alta | G04 | Evolucao | Requer pelo menos 2 fontes ativas. Condicoes de tempo e categoria compativeis |
| **G06** | Definir e implementar taxonomia de categorias de evento v1 (8 categorias minimas) | Anexo §4 | Back-end | Media | — | MVP | NETWORK_INTRUSION, NETWORK_RECON, AUTH_ANOMALY, MALWARE_EXECUTION, ENDPOINT_BEHAVIOR, DATA_EXFIL, POLICY_VIOLATION, OTHER |
| **G07** | Implementar janela de correlacao configuravel por categoria (30-180 min rolling window) | Anexo §5 | Back-end | Media | G04, G06 | MVP | Padroes por categoria. Enquanto incidente ativo e eventos chegam dentro da janela, incidente atualizado |
| **G08** | Implementar templates de titulo de incidente por categoria e entidades | Anexo §8 | Back-end | Baixa | G06 | MVP | Ex: "Tentativa de acesso suspeita para {user} a partir de {src_ip}" |
| **G09** | Implementar display de gaps na UI ("Nao disponivel nesta integracao" + tooltip orientativo) | §9.2 | Front-end | Media | E07 | MVP | Em todos os dashboards. Tooltip: "Este dado nao e fornecido pela fonte X. Para habilitar, conecte Y" |
| **G10** | Adaptar dashboard Risk Level para funcionar com cards dinamicos (exibir apenas cards disponiveis) | §10.1 | Front-end | Media | R03, E07 | MVP | Atualmente assume 4 cards fixos. No Essentials, CIS nao existe — recalcular pesos |
| **G11** | Adaptar Monitoria NG-SOC para "Monitoria de Ingestao" no plano Essentials (volume/dia, ultimas sincs, status das integracoes, health dos adapters) | §10.4 | Front-end | Media | E07, G12 | MVP | Reutilizar componentes existentes (`GraficoVolume`, badges, tabela de coletores) |
| **G12** | Implementar observabilidade e health por integracao (last_success_at, error_rate, events_24h, avg_latency, status) + alerta de queda de ingestao. Metricas coletadas tanto no polling job (coleta) quanto no ALERT (normalizacao/dedup) | §13 | Back-end | Alta | E02, E03 | MVP | **Critico.** Sem isso, "zero alertas" pode ser bom OU significa ingestao quebrada. ALERT deve expor metricas do pipeline interno |
| **G13** | Redesenhar painel de integracoes com UX orientada, cards de recomendacao e indicador de maturidade/cobertura por plano | §11 | Front-end | Media | E06, E07 | Evolucao | Ja existe `Integrations.tsx` — evoluir com visao orientada ao plano |
| **G14** | Implementar audit trail / debug por incidente (corr_key, merge_key, window, raw_event_count, dedup_dropped, why_merged, why_severity) | Anexo §10 | Back-end | Media | G04 | Evolucao | Essencial para depurar "por que abriu 10 incidentes em vez de 1" |
| **G15** | Implementar classificacao de ativos criticos (crown jewel) com ajuste de severidade +1 | Anexo §7.3 | Full Stack | Media | G04 | Evolucao | Cadastro de ativos criticos + regra de escalation no Incident Engine |
| **G16** | Implementar fallback de IA — incidentes continuam sendo criados com template quando IA falhar. UI exibe "IA nao disponivel no momento" | §8.3, Anexo §9 | Back-end | Media | C01, G04 | MVP | IA nao pode ser ponto unico de falha. Template + evidencia devem bastar |
| **G17** | Implementar calculo de severidade final do incidente: max(eventos) + escalation por volume (>=100 eventos) + recorrencia (3 janelas/dia) | §7.2, Anexo §7 | Back-end | Media | G04 | MVP | Regra simples e debuggavel. Ajuste por ativo critico fica para G15 |
| **G18** | Estruturar painel de cobrancas/licenciamento por plano (conta mae, profiles filhos, controle de integracao por plano contratado) | §11 | Full Stack | Alta | E06 | Evolucao | Mencionado na spec mas sem detalhamento tecnico. Requer definicao de produto |
| **G19** | Implementar modo webhook para vendors que suportam push (reduzir latencia, melhorar MTTD) | §12.2 | Back-end | Media | G01 | Escala | Complementar ao polling. Priorizar vendors com suporte nativo a webhook |
| **G20** | Implementar adapter para pelo menos 1 EDR/XDR (ex: Microsoft Defender) | §3.1 | Back-end | Alta | G01 | MVP | **O rascunho so cobre FortiGATE (firewall). A spec exige pelo menos 1 EDR/XDR no v1** |
| **G21** | Implementar politica de retencao de raw_payload por tenant (compliance) | §15 item 4 | Back-end | Media | E03 | Evolucao | Item em aberto na spec. Definir TTL por org/plano |
| **G22** | Implementar adapter para Wazuh como vendor (normalizar dados Wazuh no mesmo formato NormalizedEvent) | §5.2 (implicito) | Back-end | Media | G01 | Evolucao | Unificar pipeline: clientes com SIEM tambem passam pelo normalizador. Rascunho menciona Wazuh como vendor |
| **SA01** | Adicionar campos de instrumentacao no incidente para SOC Analytics: `detected_at`, `acknowledged_at`, `resolved_at`, `triaged_by` (ia/humano), `ai_first_result_at`, `escalated` (boolean), `escalated_at`. Esses campos sao pre-requisito para calculo correto de MTTD/MTTA/MTTR e metricas de IA | SOC Analytics §10.1 | Back-end | Media | T01 | MVP | Estende T01. Campos nullable para retrocompatibilidade. Sem esses campos, metricas ficam imprecisas |
| **SA02** | Implementar endpoint de metricas agregadas SOC Analytics: MTTD, MTTA, MTTR, incidentes abertos, distribuicao por severidade, taxa de triagem IA, tempo medio IA, taxa de escalacao. Incluir comparacao com periodo anterior equivalente (delta) e agregacoes pre-calculadas por dia/org | SOC Analytics §4-§8, §11 | Back-end | Alta | SA01, G04 | MVP | Estrategia de performance: agregacoes pre-calculadas por dia e por org (cron ou materialized view). Periodos: Semana, Mes, Trimestre, Ano, customizado |
| **SA03** | Refatorar frontend SOC Analytics conforme novo design (Figma disponivel). Blocos: KPIs no topo (MTTD/MTTA/MTTR/Abertos) com deltas e cores, donut de historico por severidade, Risk Level embedded (gauge), Performance da IA, drill-down para incidentes. Estados empty/loading/error | SOC Analytics §3-§12 | Front-end | Alta | SA02, E07 | MVP | Figma Desktop e Mobile disponiveis. Regras de cor: menor=melhor para tempos (verde se caiu), maior=pior para abertos (vermelho se subiu). Badge de alerta nos incidentes abertos |
| **CP01** | Evoluir o ChatWidget existente para Copiloto IA contextual: painel lateral direito (nao mais botao flutuante com janela popup), deteccao automatica de contexto da pagina (tela atual, entidade aberta, filtros ativos, periodo, tenant), continuidade de sessao. Escopo MVP: Home, Risk Level, Detalhe do Incidente | Copiloto §11, §15.1 | Front-end | Alta | E07 | MVP | Ja existe ChatWidget/ChatWindow/ChatInput. Evoluir para painel lateral contextual. Nao e chatbot generico — e copiloto operacional do SOC |
| **CP02** | Implementar prompts sugeridos por tela e formato de resposta estruturada. Cada pagina (Home, Risk Level, Incidente) oferece 3-4 prompts pre-definidos contextuais. Respostas seguem formato: resumo, por que importa, evidencias consultadas, nivel de confianca, proximos passos, prompts de continuacao | Copiloto §9, §11.2, §16 (RF-03, RF-04, RF-07) | Full Stack | Media | CP01, C01 | MVP | Prompts configurados por tela. Back-end monta contexto e formata resposta via LLM. Evidencias devem ser citadas |
| **CP03** | Implementar geracao de artefatos de comunicacao pelo Copiloto: resumo tecnico, resumo executivo, nota para cliente. Acoes: copiar texto, editar resposta, gerar versao executiva/tecnica, salvar como nota do caso | Copiloto §9.5, §11.4.4, §16 (RF-06) | Full Stack | Media | CP02 | MVP | Alto valor percebido — reduz esforco operacional. Copiar/salvar devem funcionar integrados ao incidente |

---

## 3. Visao Consolidada por Fase

### Fase 1 — MVP Essentials

> Objetivo: Pipeline funcional ponta a ponta (ingestao → alerta → ticket → incidente) sem SIEM.
> Complementado com itens de SOC Analytics e Copiloto IA.

| ID | Item | Tipo | Complexidade |
|----|------|------|-------------|
| E03 | Modelo NormalizedEvent + camada de normalizacao dentro do ALERT | Back-end | Alta |
| G01 | Padrao Adapter em 2 camadas (Collector + Normalizer no ALERT) | Arquitetura | Alta |
| G06 | Taxonomia de categorias v1 | Back-end | Media |
| G02 | Engine de mapeamento de severidade (dentro do ALERT) | Back-end | Media |
| G03 | Sistema de deduplicacao (dentro do ALERT) | Back-end | Alta |
| E06 | Campo de plano no tenant | Back-end | Baixa |
| E05 | Tenants no token JWT | Full Stack | Media |
| E04 | Propagacao de tenant_id nos microservicos | Back-end | Media |
| E01 | Tela de configuracao de fontes (FortiGATE) | Front-end | Media |
| E02 | Background job de polling (FortiGATE) | Back-end | Alta |
| G20 | Adapter para 1 EDR/XDR (Defender) | Back-end | Alta |
| T01 | Validar schema do incidente no ticket | Back-end | Baixa |
| G04 | Motor de correlacao/agrupamento (Incident Engine) | Back-end | Alta |
| G07 | Janela de correlacao por categoria | Back-end | Media |
| G08 | Templates de titulo por categoria | Back-end | Baixa |
| G17 | Calculo de severidade final | Back-end | Media |
| G16 | Fallback de IA | Back-end | Media |
| C01 | Separar config LLM (Chat vs Analises) | Full Stack | Media |
| C02 | LLM padrao H1 como fallback | Back-end | Baixa |
| R01 | Documentar regras Risk Level | Documentacao | Baixa |
| R02 | Auditar Risk Level atual | Back-end | Media |
| R03 | Corrigir Risk Level (degradacao graciosa) | Back-end | Alta |
| R04 | Testes Risk Level (3 cenarios) | Back-end | Media |
| E07 | Feature flags por plano | Front-end | Media |
| G09 | Display de gaps na UI | Front-end | Media |
| G10 | Risk Level com cards dinamicos | Front-end | Media |
| G11 | Monitoria de Ingestao no Essentials | Front-end | Media |
| G12 | Observabilidade/health por integracao | Back-end | Alta |
| SA01 | Campos de instrumentacao no incidente para SOC Analytics | Back-end | Media |
| SA02 | Endpoint de metricas agregadas SOC Analytics | Back-end | Alta |
| SA03 | Refatorar frontend SOC Analytics (novo design) | Front-end | Alta |
| CP01 | Copiloto IA contextual (painel lateral) | Front-end | Alta |
| CP02 | Prompts sugeridos por tela e resposta estruturada | Full Stack | Media |
| CP03 | Geracao de artefatos de comunicacao pelo Copiloto | Full Stack | Media |

**Total MVP: 33 itens** | Back-end: 20 | Front-end: 8 | Full Stack: 5 | Doc: 1

### Fase 2 — Evolucao Funcional

> Objetivo: Qualidade, multi-fonte, e funcionalidades avancadas.

| ID | Item | Tipo | Complexidade |
|----|------|------|-------------|
| A01 | SOC Analytics com dados Essentials | Full Stack | Media |
| G05 | Merge multi-fonte (FW + EDR) | Back-end | Alta |
| G13 | Painel de integracoes com UX orientada | Front-end | Media |
| G14 | Audit trail / debug por incidente | Back-end | Media |
| G15 | Classificacao de ativos criticos | Full Stack | Media |
| G18 | Painel de cobrancas/licenciamento | Full Stack | Alta |
| G21 | Politica de retencao de raw_payload | Back-end | Media |
| G22 | Adapter Wazuh como vendor normalizado | Back-end | Media |
| CP04 | Copiloto: investigacao assistida (cruzamento de sinais, hipoteses guiadas, apoio a consultas) | Full Stack | Alta |
| CP05 | Copiloto: operacao assistida (sugestao de playbooks, criacao de tarefas, handoff entre turnos) | Full Stack | Alta |
| SA04 | SOC Analytics: drill-down em KPIs (click MTTD → incidentes com maiores TTD e causas) | Front-end | Media |

**Total Evolucao: 11 itens**

### Fase 3 — Escala e Maturidade

> Objetivo: Performance, resiliencia e modos avancados de coleta.

| ID | Item | Tipo | Complexidade |
|----|------|------|-------------|
| G19 | Modo webhook para vendors compativeis | Back-end | Media |
| ESC01 | Fila de mensagens entre polling jobs e ALERT + entre ALERT e CORRELATION (RabbitMQ/Redis) | Infra | Alta |
| ESC02 | Rate limiting e backoff para APIs de vendors | Back-end | Media |
| ESC03 | Metricas de performance do pipeline (Prometheus/Grafana) | Infra | Media |
| ESC04 | Retry com dead-letter para eventos que falharam | Back-end | Media |
| ESC05 | Horizontal scaling dos polling jobs | Infra | Alta |
| ESC06 | Cache de deduplicacao com TTL (Redis) | Back-end | Media |

**Total Escala: 7 itens**

---

## 4. Diagrama de Dependencias (Ordem de Implementacao Sugerida — MVP)

```
                    ┌─────────┐
              ┌────►│   E06   │ (plano no tenant)
              │     └────┬────┘
              │          │
        ┌─────┴───┐  ┌──▼───┐  ┌──────┐
        │   E05   │  │ E07  │  │ G06  │ (taxonomia)
        │(JWT+tenant)│(flags)│  └──┬───┘
        └────┬────┘  └──┬───┘     │
             │          │         │
        ┌────▼────┐  ┌──▼───┐  ┌─▼──────────────────────────────────┐
        │   E04   │  │ G09  │  │  E03 — microservico ALERT          │
        │(tenant_id)│ │ G10 │  │  (hub inteligente)                 │
        └─────────┘  │ G11  │  │                                    │
                     └──────┘  │  ┌────────┐  ┌────────┐  ┌──────┐ │
                               │  │ G01    │→ │ G02    │→ │ G03  │ │
                               │  │normaliz│  │severi- │  │dedup │ │
                               │  │adores  │  │dade    │  │      │ │
                               │  └────────┘  └────────┘  └──────┘ │
                               └──────────┬─────────────────────────┘
                                          │
           ┌──────────┐                   │
           │ E01/E02  │ (tela + job)      │
           │ polling   │──raw events──────►│
           │ FortiGATE │                   │
           └──────────┘                   │
           ┌──────────┐                   │
           │   G20    │──raw events──────►│
           │ polling   │                   │
           │ EDR/XDR  │                   │
           └──────────┘                   │
                                          ▼
                               ┌──────────────────┐
                               │ G04 — CORRELATION │
                               │ (agrupamento      │
                               │  deterministico)  │
                               │  G07 janela       │
                               │  G08 templates    │
                               │  G17 severidade   │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ TICKET (IA)      │
                               │  G16 fallback    │
                               └────────┬─────────┘
                                        │
                                        ▼
                                   ┌────────┐
                                   │  IRIS  │
                                   └────────┘

           ┌──────────┐
           │   G12    │ (observabilidade — monitora ALERT + jobs)
           └──────────┘
```

---

## 5. Recomendacoes de Arquitetura

### 5.1 Adapter Pattern em Duas Camadas

O padrao Adapter (§5.1 da spec) e a decisao arquitetural mais importante do MVP. A responsabilidade e dividida em duas camadas:

**Camada 1 — Collector (no Polling Job):** Leve, so faz coleta.
Interface `IVendorCollector`:
1. `authenticate(config)` — autentica na API do vendor
2. `fetchIncremental(cursor)` — coleta eventos brutos desde o ultimo cursor
3. `emitRaw(rawEvents)` — envia payload bruto para o microservico ALERT

**Camada 2 — Normalizer (dentro do ALERT):** Inteligencia centralizada.
Interface `IVendorNormalizer`:
1. `canHandle(sourceType, vendor)` — identifica se este normalizador trata a fonte
2. `normalize(rawEvent)` — transforma evento bruto para `NormalizedEvent`
3. `mapSeverity(vendorSeverity)` — aplica mapeamento de severidade para 4 buckets

**Pipeline interno do ALERT:**
```
Recebe raw event
  → Identifica vendor/source_type
  → Seleciona IVendorNormalizer correto
  → Normaliza para NormalizedEvent
  → Aplica deduplicacao (dedup_key)
  → Persiste evento normalizado
  → Encaminha para TICKET
```

**Para adicionar um novo vendor:** implementar 1 Collector (polling job) + 1 Normalizer (registrar no ALERT). O ALERT descobre o normalizador correto automaticamente pelo `source_type` + `vendor`.

### 5.2 Onde Colocar o Incident Engine (Correlacao/Agrupamento)

Com a normalizacao e deduplicacao ja dentro do ALERT, resta decidir onde fica o motor de correlacao/agrupamento de eventos em incidentes.

**Opcoes restantes:**
| Opcao | Vantagem | Desvantagem |
|-------|----------|-------------|
| (A) Incorporar ao `ticket` | Pipeline curto; TICKET ja decide sobre incidentes | Mistura regras deterministicas com IA; TICKET fica sobrecarregado |
| (B) Novo microservico `correlation` entre ALERT e TICKET | Separacao clara: correlacao deterministica vs IA; testavel isoladamente | Mais um servico para manter; latencia adicional |
| (C) Incorporar ao ALERT | Tudo centralizado no ALERT (normalize + dedup + correlate) | ALERT assume muitas responsabilidades; risco de se tornar monolito |

**Recomendacao:** Opcao (B) — microservico dedicado `correlation`. A spec enfatiza que correlacao deve ser **deterministica e independente de IA** (Anexo §2). O ALERT ja acumula normalizacao e deduplicacao — adicionar correlacao o tornaria um monolito fragil.

**Fluxo completo decidido:**
```
Polling Job ──► ALERT ──────────────────► CORRELATION ──► TICKET ──► IRIS
(auth+fetch)    (normalize + dedup +       (agrupamento    (IA +       (incidente)
                 persist)                   deterministico)  decisao)
```

**Responsabilidades por servico:**
| Servico | Responsabilidade | Complexidade |
|---------|-----------------|-------------|
| Polling Job | Coletar eventos brutos (1 por vendor/instancia) | Baixa |
| ALERT | Normalizar, deduplicar, persistir, encaminhar | Alta |
| CORRELATION | Agrupar eventos em candidatos a incidente (corr_key, janela, merge) | Alta |
| TICKET | Aplicar IA, decidir abertura de incidente, criar no IRIS | Media |

### 5.3 Feature Flags Server-Driven

O rascunho propoe feature flags no frontend. Isso e insuficiente — um usuario tecnico pode burlar flags client-side.

**Recomendacao:** Feature flags devem ser resolvidas no backend (com base no `plan` do tenant) e enviadas ao frontend via endpoint dedicado ou dentro do JWT. O frontend apenas consome a lista de features habilitadas.

### 5.4 Multi-Tenancy nos Microservicos

Propagar `tenant_id` via header e necessario, mas insuficiente. Cada microservico deve validar que o tenant do header corresponde ao tenant do token JWT.

**Recomendacao:** Middleware de validacao em cada microservico: `if (header.tenant_id !== jwt.tenant_id) → 403`.

### 5.5 Fila de Mensagens (Preparacao para Escala)

Mesmo no MVP, considerar abstrair a comunicacao entre polling job e ALERT usando uma interface que possa ser substituida por fila (RabbitMQ/Redis Streams) na Fase 3.

**Recomendacao:** No MVP, usar chamada HTTP direta (polling job → ALERT endpoint), mas atras de uma interface `IRawEventPublisher` no collector. Na Fase 3, trocar a implementacao por fila sem alterar os collectors.

Da mesma forma, a comunicacao ALERT → CORRELATION pode ser abstraida via interface `INormalizedEventPublisher` para futura substituicao por fila.

### 5.6 Arquitetura do Copiloto IA

O Copiloto nao e um chatbot generico — e uma camada contextual de inteligencia operacional.

**Camadas conceituais:**
1. **Interface** — Painel lateral no frontend (evolucao do ChatWidget)
2. **Servico de contexto** — Captura tela, entidade, tenant, filtros, periodo, dados visiveis
3. **Orquestrador** — Classifica intencao, monta contexto, decide fontes, compoe resposta, aplica guardrails
4. **Recuperacao de dados** — Conectores para incidentes, risk level, eventos, dashboards
5. **Modelo de linguagem** — LLM configurada pelo tenant (purpose=chat) ou fallback Hackone
6. **Guardrails** — Isolamento de tenant, auditoria, classificacao (fato/hipotese/recomendacao)

**Recomendacao MVP:** Reutilizar o Chat API existente (`api-hackone-chat`), expandindo o endpoint `POST /api/chat` para:
- Receber contexto estruturado (page, entity, filters, period, visible_data)
- Retornar resposta no formato estruturado (summary, evidence, confidence, next_steps, continuation_prompts)
- Usar system prompt especifico por tela (Home, Risk Level, Incidente)

**Principio:** O copiloto deve preferir resposta limitada com indicacao de incerteza a excesso de confianca sem base.

### 5.7 Estrategia de Performance do SOC Analytics

Calcular MTTD/MTTA/MTTR em tempo real sobre muitos incidentes e caro. A spec recomenda:

**Agregacoes pre-calculadas por dia e por org:**
- `incident_counts_by_severity_day`
- `avg_mttd_day`, `avg_mtta_day`, `avg_mttr_day` (ou somatorios e contagens)
- `ai_kpis_day`

**No frontend:** periodos (Semana/Mes/Trimestre/Ano) somam janelas diarias.

**Recomendacao:** Criar cron job (similar ao `snapshotRiskDebug` existente) que calcula e persiste agregacoes diarias. Frontend consome agregacoes, nao recalcula.

**Meta de performance:**
- Carregamento inicial: ate 2-3 segundos com cache
- Recalcular com troca de filtro: ate 1-2 segundos

---

## 6. Riscos Tecnicos

| # | Risco | Probabilidade | Impacto | Mitigacao |
|---|-------|--------------|---------|-----------|
| 1 | **Polling em escala**: muitos tenants x multiplas fontes = milhares de chamadas API concorrentes | Media | Alto | Limitar concorrencia por tenant. Fila de execucao com prioridade. Escalonamento horizontal na Fase 3 |
| 2 | **Rate limiting de APIs de vendors**: FortiGATE, Defender possuem limites de requisicoes/minuto | Alta | Alto | Implementar backoff exponencial no adapter. Respeitar headers `Retry-After`. Monitorar error_rate (G12) |
| 3 | **Deduplicacao com volume alto**: hash lookup em tabela relacional pode ser lento com milhoes de eventos | Media | Medio | Usar indice unico no `dedup_key`. Na Fase 3, migrar para Redis com TTL |
| 4 | **IA como bottleneck**: LLM externa com latencia alta ou custo elevado por request | Media | Alto | Fallback obrigatorio (G16). Batch processing quando possivel. Limitar tokens por request |
| 5 | **Vazamento de dados entre tenants**: propagacao incorreta de `tenant_id` nos microservicos | Baixa | Critico | Middleware de validacao em cada microservico. Testes de isolamento multi-tenant |
| 6 | **Retrocompatibilidade**: clientes atuais (SIEM/Wazuh) impactados pelas mudancas do Essentials | Media | Alto | Feature flags por plano. Nenhuma mudanca no fluxo SIEM existente. Testes de regressao |
| 7 | **Risk Level distorcido sem CIS**: recalculo proporcional pode gerar scores enganosos | Media | Medio | Testes com cenarios isolados (R04). Documentar limitacoes para o cliente |
| 8 | **Janela de correlacao mal dimensionada**: muito grande = poucos incidentes (ruido oculto); muito pequena = muitos incidentes (ruido visivel) | Media | Medio | Valores padrao por categoria (Anexo §5). Configuravel por org (§15 item 2) |
| 9 | **Ausencia de EDR no rascunho**: spec exige pelo menos 1 EDR/XDR no MVP, rascunho so cobre FortiGATE | Alta | Alto | **Incluir G20 (adapter EDR) no MVP.** Sem isso, o Essentials entrega apenas metade do valor proposto |
| 10 | **"Zero alertas" = cego ou seguro?**: sem observabilidade (G12), operador nao sabe se ingestao quebrou | Alta | Critico | G12 e obrigatorio no MVP. Alerta automatico de queda de ingestao |
| 11 | **Complexidade do Incident Engine**: motor de correlacao e a peca mais complexa do MVP | Alta | Alto | Comecar com regras simples (agrupamento intra-fonte). Merge multi-fonte fica para Fase 2 (G05) |
| 12 | **Complexidade do ALERT como hub**: com normalizacao + deduplicacao centralizadas, ALERT se torna peca critica. Falha no ALERT = pipeline inteiro para | Media | Critico | Health checks robustos. Restart automatico. Na Fase 3, considerar replicas com load balancer |
| 13 | **SOC Analytics sem dados de instrumentacao**: sem os campos detected_at, acknowledged_at, resolved_at, as metricas MTTD/MTTA/MTTR ficam N/A. Incidentes historicos nao terao esses campos | Alta | Alto | SA01 deve popular campos retroativamente onde possivel. Para incidentes antigos sem dados: exibir "N/A" com tooltip |
| 14 | **Copiloto com alucinacao**: LLM pode responder alem da evidencia disponivel em contexto de seguranca critico | Media | Critico | Guardrails obrigatorios. Formato estruturado com "evidencias consultadas" e "nivel de confianca". Preferir resposta limitada a inferencia sem base |
| 15 | **Custo de LLM no Copiloto**: respostas contextuais com dados de incidentes podem gerar custo elevado por request | Media | Alto | Limitar tokens. Cache de respostas para prompts sugeridos. Monitorar custo por tenant |

---

## 7. Sugestoes de Novos Itens (alem das lacunas)

| ID | Sugestao | Tipo | Fase | Justificativa |
|----|---------|------|------|---------------|
| S01 | Criar suite de testes de integracao end-to-end (polling → ALERT [normalize+dedup] → CORRELATION → TICKET → IRIS) | QA | MVP | Sem isso, cada peca funciona isolada mas o pipeline inteiro pode falhar |
| S02 | Criar seed/mock de dados FortiGATE e Defender para desenvolvimento e testes | Back-end | MVP | Nao depender de ambientes reais durante o desenvolvimento |
| S03 | Documentar APIs do pipeline: (1) endpoint de ingestao raw do ALERT, (2) schema do NormalizedEvent, (3) contrato ALERT → CORRELATION (OpenAPI/Swagger) | Documentacao | MVP | ALERT e o hub — seu contrato de entrada (raw) e saida (normalizado) precisa estar claro para todos os times |
| S04 | Criar dashboard de monitoramento interno do pipeline Essentials (nao e o mesmo que G12 — este e para a equipe de ops, nao para o cliente) | Infra | Evolucao | Visibilidade interna de saude do sistema |
| S05 | Implementar mecanismo de replay de eventos (reprocessar janela sem duplicar) | Back-end | Evolucao | Essencial para corrigir bugs de correlacao sem perda de dados |
| S06 | Criar onboarding wizard para clientes Essentials (conectar primeira fonte em < 5 min) | Front-end | Evolucao | Experiencia de primeiro uso — valor percebido imediato |

---

## 8. Matriz de Criterios de Aceite vs Itens

| Criterio de Aceite (§14) | Itens que Cobrem |
|--------------------------|------------------|
| 1. Conectar Firewall via API → alertas no Risk Level + incidentes | E01, E02, G01, G04, R03, G10 |
| 2. Conectar EDR/XDR via API → incidentes + top assets | G20, G01, G04, G10 |
| 3. Sem SIEM, tela Incidents funciona com detalhes | E07, G09, T01 |
| 4. Risk Level funciona sem CIS | R03, G10 |
| 5. SOC Analytics calcula MTTA/MTTR | A01 |
| 6. Gaps exibidos com mensagens claras | G09 |
| 7. IA pode ser desligada sem quebrar | G16 |
| 8. IA externa conectavel via API | C01 |
| 9. IA externa falhando, sistema continua | G16, C02 |
| 10. Multi-source (2 EDRs + 2 FWs) sem conflito | G01, G03, G04 |
| 11. Monitoria mostra saude e volume | G11, G12 |
| 12. Queda de ingestao dispara alerta | G12 |
| SOC Analytics §13.1: Alterar periodo recalcula todos os KPIs | SA02, SA03 |
| SOC Analytics §13.2: Deltas exibem comparacao com periodo anterior | SA02, SA03 |
| SOC Analytics §13.5: Donut reflete distribuicao real | SA03 |
| SOC Analytics §13.7: Click nos KPIs leva ao drill-down | SA03 |
| SOC Analytics §13.8: Estados sem dados/erro nao quebram layout | SA03 |
| Copiloto §15.1: Resumir contexto atual na Home, Risk Level, Incidente | CP01, CP02 |
| Copiloto §15.1: Gerar resumo tecnico e executivo | CP03 |
| Copiloto §16 RF-09: Copiloto respeita permissoes e tenant | CP01 |

---

## 9. Itens em Aberto para Decisao (herdados da spec §15 + novos)

| # | Decisao Pendente | Impacto |
|---|-----------------|---------|
| 1 | Redistribuicao de pesos do Risk Level quando card nao existe | R03, G10 |
| 2 | Janela de agrupamento: global ou por org? | G07 |
| 3 | Catalogo minimo de categorias — validar com dados reais de FortiGATE e Defender | G06 |
| 4 | Politica de retencao de raw_payload por org | G21 |
| 5 | Lista de vendors do v1 e ordem de implementacao (FortiGATE + qual EDR?) | G20 |
| 6 | **DECIDIDO:** Normalizacao e dedup ficam no ALERT. Incident Engine (correlacao) fica em microservico dedicado `CORRELATION` (ver §5.2) | G04 |
| 7 | **NOVO:** Feature flags server-side ou client-side? (recomendacao: server-side) | E07 |
| 8 | **NOVO:** Wazuh deve passar pelo normalizador na Fase 2? | G22 |
| 9 | **NOVO:** SOC Analytics: Risk Level embedded mostra score das ultimas 24h ou media do periodo filtrado? | SA03 |
| 10 | **NOVO:** SOC Analytics: MTTD calculado sobre incidentes criados ou fechados no periodo? | SA02 |
| 11 | **NOVO:** Copiloto: detalhe do evento entra no MVP ou no fast follow? | CP01 |
| 12 | **NOVO:** Copiloto: memoria apenas por sessao ou entre sessoes? | CP01 |

---

## 10. Resumo Quantitativo

| Metrica | Quantidade |
|---------|------------|
| Itens do rascunho (revisados) | 15 |
| Lacunas identificadas (Essentials) | 22 |
| Lacunas identificadas (SOC Analytics) | 3 |
| Lacunas identificadas (Copiloto IA) | 3 |
| Sugestoes de novos itens | 6 |
| **Total de itens** | **49** |
| Itens MVP | 33 |
| Itens Evolucao | 11 |
| Itens Escala | 7 |
| Decisoes pendentes | 12 |
| Riscos identificados | 15 |
