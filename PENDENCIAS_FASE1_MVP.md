# Pendências — Fase 1 (MVP Funcional)

> Documento gerado em 2026-04-20 com base em `CRONOGRAMA_FASE1_MVP_V2.md` e verificação direta do código.
>
> Repositórios auditados:
> - `C:\Users\thiago\source\repos\Hackone_Dashboard` (Strapi backend + Frontend React)
> - `C:\Users\thiago\source\repos\Hackone\src` (microserviços .NET: Alerts, Tickets, Chats, Customers, ReportAlerts)

---

## 1. Mapa de Status (30 tarefas)

### Concluídas (marcadas `ok` no cronograma e verificadas no código)
E06, E05, E03, G06, C01, E04, G01, G03, E07, C02, G02, E01, E02, G16, CP01.

### T01 e SA01 — já implementadas (porém ainda marcadas sem `ok` no cronograma)
Verificado em `Hackone/src/SecurityOne.Tickets/src/Domain/Entities/Incident.cs`:

- **T01** — todos os 13 campos obrigatórios existem (`IncidentId`, `TenantId`, `CreatedAt`, `Status`, `Severity`, `Title`, `Description`, `PrimaryAsset`, `EventCount`, `SourcesInvolved`, `FirstSeenAt`, `LastSeenAt`, `AiSummary`). Migração `20260417144844_AddT01IncidentFields.cs`.
- **SA01** — todos os 7 campos de instrumentação existem (`DetectedAt`, `AcknowledgedAt`, `ResolvedAt`, `TriagedBy`, `AiFirstResultAt`, `Escalated`, `EscalatedAt`).

> **Ação recomendada:** atualizar o `CRONOGRAMA_FASE1_MVP_V2.md` marcando T01 e SA01 como `ok`. Falta apenas validar o **preenchimento automático** desses campos no fluxo (ver seção 3).

### Excluídas (marcadas `NAO SERA FEITO`)
G04, G17, G15, G10, G11, CP02, CP03. **Não entram neste documento.**

### Pendentes reais
R01, R02, R03, R04, SA02, SA03 e verificação de preenchimento de T01/SA01.

---

## 2. Visão consolidada das pendências

| ID   | Tarefa                                                | Tipo       | Estado do código                                                             | Esforço |
|------|-------------------------------------------------------|------------|------------------------------------------------------------------------------|---------|
| T01v | Verificar preenchimento dos campos adicionados        | Back-end   | Campos existem; lifecycle não confirmado                                     | P       |
| SA01v| Verificar preenchimento dos campos de instrumentação  | Back-end   | Campos existem; lógica de `triaged_by`/`ai_first_result_at` não confirmada   | P       |
| R01  | Documentar regras do Risk Level                       | Doc        | Algoritmo no código (`risklevel.service.ts`), sem doc dedicado               | M       |
| R02  | Auditar Risk Level atual vs especificação             | Back-end   | Requer R01                                                                   | M       |
| R03  | Corrigir Risk Level (degradação graciosa)             | Back-end   | Requer R02                                                                   | M/G     |
| R04  | Testes Risk Level (3 cenários)                        | Back-end   | Nenhum teste automatizado encontrado                                         | M       |
| SA02 | Backend métricas SOC Analytics                        | Back-end   | Endpoint parcial (falta IA performance, badge, agregação diária)             | G       |
| SA03 | Frontend SOC Analytics redesign                       | Front-end  | Página existe; faltam ajustes de Figma, IA performance real, drill-down      | M/G     |

Legenda: P = pequeno (≤1 dia), M = médio (2–5 dias), G = grande (>5 dias).

---

## 3. Atividades Detalhadas

---

### T01v — Verificar preenchimento automático dos campos do incidente

**Arquivos relevantes:**
- `Hackone/src/SecurityOne.Tickets/src/Domain/Entities/Incident.cs` (schema OK)
- `Hackone/src/SecurityOne.Tickets/src/Application/Incidents/Commands/*` (handler de criação)
- `Hackone/src/SecurityOne.Tickets/src/Infrastructure/Data/Migrations/20260417144844_AddT01IncidentFields.cs`

**O que verificar e, se faltar, implementar:**
1. No handler/command de **criação** do incidente, garantir preenchimento de:
   - `PrimaryAsset` — a partir do `asset.host_name` ou `asset.ip` do primeiro evento.
   - `EventCount` — iniciar em `1` na criação; incrementar quando novos eventos forem anexados.
   - `SourcesInvolved` — flag enum (`Firewall`, `Edr`, `Siem`) derivada do `source_type` do evento.
   - `FirstSeenAt` — `event_time` do evento mais antigo agrupado.
   - `LastSeenAt` — `event_time` do evento mais recente (atualizar a cada novo evento).
   - `AiSummary` — preenchido pelo fluxo de IA (nullable se IA falhar — ver G16).
2. Criar migração ou script idempotente para **backfill** de incidentes antigos:
   - `PrimaryAsset` = hostname/IP do primeiro evento relacionado, quando existir.
   - `EventCount` = contagem real de eventos vinculados.
   - `FirstSeenAt`/`LastSeenAt` = min/max de `event_time` relacionado.

**Critérios de aceite:**
- [ ] Novo incidente criado a partir de evento FortiGATE tem os 5 campos novos preenchidos.
- [ ] Incidente com múltiplos eventos tem `EventCount > 1` e `LastSeenAt` atualizado.
- [ ] Incidentes históricos têm os campos populados via backfill (quando possível) ou mantidos nulos sem quebrar consultas.

---

### SA01v — Verificar preenchimento dos campos de instrumentação

**Arquivos relevantes:**
- `Hackone/src/SecurityOne.Tickets/src/Domain/Entities/Incident.cs`
- `Hackone/src/SecurityOne.Tickets/src/Application/Incidents/Commands/*` (update/status change)

**O que verificar e, se faltar, implementar:**
1. `DetectedAt` — preencher com `DateTimeOffset.UtcNow` na criação (já existe `CreatedAt`; garantir que este reflete a detecção no SecurityOne, não a ingestão bruta).
2. `AcknowledgedAt` — atualizar no **primeiro** de:
   - Mudança de status para `TRIAGE` / `IN_PROGRESS`, **ou**
   - Atribuição inicial de responsável (`AssignedTo` deixa de ser null).
3. `ResolvedAt` — atualizar quando status muda para `RESOLVED` ou `CLOSED`.
4. `TriagedBy` — enum (`ia` | `humano`):
   - `ia` se o primeiro autor do movimento de triagem for a IA (chat/motor).
   - `humano` se for um usuário autenticado.
5. `AiFirstResultAt` — timestamp do primeiro output da LLM para aquele incidente (chamar no handler do motor de análise em `SecurityOne.Tickets`).
6. `Escalated` / `EscalatedAt` — atualizar quando um incidente for marcado como escalado (ex.: prioridade elevada, envio a N2).

**Critérios de aceite:**
- [ ] Todo incidente tem `DetectedAt` preenchido.
- [ ] `AcknowledgedAt` não é null após primeira triagem.
- [ ] `ResolvedAt` não é null após fechamento.
- [ ] `TriagedBy` distingue corretamente IA vs humano em ≥ 2 casos de teste.
- [ ] MTTD/MTTA/MTTR em `GetSocAnalytics` passam a refletir valores reais (hoje podem estar vindo vazios).

---

### R01 — Documentar regras de cálculo do Risk Level

**Status:** código existe, documento dedicado não existe.

**Fontes a mapear (já identificadas):**
- `backend/src/api/acesso-wazuh/services/risklevel.service.ts` — **algoritmo atual**:
  - 4 cards: Top Hosts (alertas Wazuh), Firewalls, CIS, Incidentes (IRIS), pesos 25% cada.
  - Buckets de severidade com pesos exponenciais `[1, 3, 9, 27]` (base 3).
  - Baseline adaptativo: `baseline(t) = max(minFloor, raw(t), baseline(t-1) * decay)`; warmup `raw(0) * 2`.
  - Normalização: `r_k = min(1, (raw / baseline)^1.5)`.
  - Decay: `0.98` alertas, `0.99` incidentes. Floor: `50` alertas, `10` incidentes.
- `backend/src/api/acesso-wazuh/controllers/risklevel.controller.ts` — endpoint `GET /api/acesso/wazuh/riskLevel` com query `dias` (1/7/15/30), `firewall`, `agentes`, `iris`, `from`, `to`.
- `backend/config/cron-tasks.ts` — `snapshotRiskDebug` (cron `0 */5 * * * *`), persiste em `tenant-summary`.
- `frontend/src/pages/RiskLevel.tsx` — consome a API, renderiza gauge 0–100 + cards.

**Entregas:**
1. Criar `docs/risk-level.md` contendo:
   - Diagrama do pipeline (inputs → cálculo → persistência → endpoint → UI).
   - Fórmula por card, pesos, decay, floor, warmup — com exemplo numérico para cada.
   - Comportamento quando Wazuh/IRIS/CIS retornam vazio ou erro.
   - Contrato do endpoint (request/response) e do snapshot persistido.
   - Lista de constantes parametrizáveis e onde alterá-las.
2. Referenciar o novo `docs/risk-level.md` em `backend/CLAUDE.md` e `frontend/CLAUDE.md`.

**Critérios de aceite:**
- [ ] Documento existe e cobre os 4 cards, baseline, decay, warmup, agregação final.
- [ ] Edge cases documentados (Wazuh off, CIS sem score, IRIS sem incidentes).
- [ ] Exemplos numéricos validam que o algoritmo produz resultados esperados.

---

### R02 — Auditar Risk Level atual vs especificação

**Depende de:** R01.

**Atividades:**
1. Criar planilha/checklist com cada regra descrita em R01.
2. Para cada regra, rodar o cálculo com dados reais de um tenant e comparar valor observado vs esperado. Usar:
   - Dados produtivos de um tenant `full`.
   - Dados de um tenant `essentials` (quando disponível).
3. Documentar divergências em `docs/risk-level-auditoria.md` (ou seção no próprio `risk-level.md`) com:
   - Regra auditada.
   - Valor esperado.
   - Valor obtido.
   - Arquivo/linha responsável.
   - Prioridade (blocker / importante / nice-to-have).
4. Validar especificamente:
   - Score recalcula corretamente quando Wazuh está off?
   - Warmup opera apenas na primeira execução por tenant, ou volta a executar após gap?
   - O cron `snapshotRiskDebug` lida com tenants recém-criados (sem baseline prévio)?

**Critérios de aceite:**
- [ ] Checklist completo com pelo menos 15 regras auditadas.
- [ ] Lista priorizada de divergências → input para R03.
- [ ] Evidência (log/print) de cada divergência encontrada.

---

### R03 — Corrigir Risk Level (degradação graciosa)

**Depende de:** R02.

**Objetivo:** garantir que o Risk Level funciona quando uma ou mais fontes estão indisponíveis (cenário Essentials — só firewall; cenário Full parcial — Wazuh off).

**Atividades esperadas (a refinar com base em R02):**
1. No service de cálculo:
   - Se um card não tem dados: remover o peso desse card do total e renormalizar os restantes (em vez de zerar o card e puxar score para baixo).
   - Se **todos** os cards estão sem dados: retornar `indiceRisco: null` e marcar flag `dataAvailability: "none"`.
   - Incluir no response um objeto `dataAvailability` indicando `{ topHosts, cis, firewall, iris }` com valores `ok | missing | error`.
2. No cron `snapshotRiskDebug`:
   - Nunca falhar silenciosamente: logar fonte indisponível com `sourceId`/`tenantId`.
   - Persistir snapshot parcial em vez de abortar o ciclo.
3. Ajustar contrato do endpoint sem quebrar consumidores atuais (novos campos adicionais, nenhum removido).

**Critérios de aceite:**
- [ ] Tenant só com firewall recebe score baseado em Firewall + Incidentes, sem penalização por ausência de CIS/Top Hosts.
- [ ] Response inclui `dataAvailability`.
- [ ] Tenant com todas as fontes indisponíveis recebe `indiceRisco: null` sem erro 500.
- [ ] Nenhuma regressão em tenant `full` completo.

---

### R04 — Testes Risk Level (3 cenários)

**Depende de:** R03.

**Cenários (do cronograma):**
1. **Essentials básico** — só firewall FortiGATE. Validar 2 cards ativos.
2. **Firewall + incidentes variados** — mix de severidades, incidentes abertos e fechados.
3. **Completo com CIS (Full)** — todos os 4 cards presentes (teste de regressão).

**Atividades:**
1. Criar seeds/mocks reutilizáveis para cada cenário (pode ser script Node que popula dados no tenant-summary + mocks de endpoints externos).
2. Escrever testes em `backend/tests/risklevel.spec.ts` (ou equivalente Jest) cobrindo:
   - Chamada direta ao service `risklevel.service.ts` com dados controlados.
   - Chamada ao endpoint via supertest.
3. Documentar resultado de cada cenário com print da UI (manual) comparando antes/depois de R03.
4. Incluir instruções de execução em `backend/README.md` (seção "Risk Level").

**Critérios de aceite:**
- [ ] 3 cenários executáveis por comando único (`npm run test:risk`).
- [ ] Cenário 1 não zera score por falta de CIS.
- [ ] Cenário 3 preserva comportamento original.
- [ ] Resultados documentados em `docs/risk-level-testes.md`.

---

### SA02 — Backend de métricas SOC Analytics

**Estado atual (`Hackone/src/SecurityOne.Tickets/src/Application/Incidents/Queries/GetSocAnalytics/GetSocAnalytics.cs`):**
- Endpoint `GET /api/analytics/soc` existente.
- Calcula **em tempo real** MTTD, MTTA, MTTR, Open Incidents, Severity Distribution, Risk Level simplificado (ponderação de severidade de incidentes abertos).
- Compara período atual vs anterior (deltas %).
- DTO `SocAnalyticsDto` retorna: `Mttd`, `Mtta`, `Mttr`, `OpenIncidents`, `SeverityDistribution`, `RiskLevel`, `Period`.

**Gaps vs cronograma:**
1. **Cron de agregação diária ausente.** O cronograma pede `soc_analytics_daily` pré-calculado; hoje é cálculo on-demand. Para volumes MVP pode ser aceitável — **decisão:** manter cálculo on-demand até evidência de lentidão; documentar no header do handler.
2. **Performance IA ausente.** O DTO não retorna `triage_auto_rate`, `avg_ai_time`, `escalation_rate`. Campos existem no schema (via SA01), basta agregá-los.
3. **Badge `open_incidents_badge`** não é explicitamente retornada. O handler retorna `HasCritical` no `OpenIncidents` — validar se o frontend consegue derivar `normal | attention | high_alert`, ou adicionar a badge no DTO.
4. **Período `custom`** via `startDate`/`endDate` — endpoint já aceita; validar cobertura para `period=Custom` no enum.
5. **Isolamento de tenant** já ocorre via `IUser.TenantId`; garantir que header `X-Tenant-Id` é respeitado (integrar com E04).

**Atividades:**
1. Adicionar ao DTO e ao handler:
   - `IaPerformance` = `{ TriageAutoRate, AvgAiTimeMinutes, EscalationRate, PrevTriageAutoRate, PrevAvgAiTimeMinutes, PrevEscalationRate, DeltaPct }`.
     - `TriageAutoRate` = `count(TriagedBy == Ia) / total` do período.
     - `AvgAiTimeMinutes` = média de `(AiFirstResultAt - CreatedAt)` quando ambos existem.
     - `EscalationRate` = `count(Escalated == true) / total`.
2. Adicionar campo `Badge` (enum `Normal | Attention | HighAlert`) no bloco `OpenIncidents` seguindo regra do cronograma:
   - `Normal` se `count <= previous`.
   - `Attention` se `count > previous` e sem crítico aberto.
   - `HighAlert` se `HasCritical == true` ou `count` muito acima do anterior (definir limiar, ex.: 1.5×).
3. Quando período não tem incidentes: retornar `null` (não zero) nos campos de tempo — comportamento já cumprido por `CalculateMttd` quando lista vazia? **Verificar** e ajustar se necessário.
4. Garantir tempo de resposta < 2 s em tenants com 10k+ incidentes:
   - Adicionar índice em `Incidents (TenantId, CreatedAt)`.
   - Considerar projeção (`Select`) em vez de `ToListAsync` completo.
5. Documentar contrato em `docs/soc-analytics-api.md` (referenciar no Swagger do serviço).

**Critérios de aceite:**
- [ ] Response inclui `iaPerformance` com os 3 indicadores + deltas.
- [ ] `openIncidents.badge` presente e coerente com a regra.
- [ ] `period=Custom` com `startDate`/`endDate` válidos funciona.
- [ ] Performance: p95 < 2 s em tenant com 10k incidentes.
- [ ] Doc no `docs/soc-analytics-api.md`.

---

### SA03 — Frontend SOC Analytics (redesign Figma)

**Estado atual (`frontend/src/pages/SOCAnalytics.tsx` ~300+ linhas):**
- Filtro de período (Semana/Mês/Trimestre/Ano) funcional.
- 4 KPIs (MTTD, MTTA, MTTR, Incidentes Abertos) via `MetricCard`.
- Donut por severidade.
- Gauge do Risk Level embedded.
- Componente `AIPerformanceBar` existe, mas consome dados que ainda não vêm do backend.
- Estados loading e error tratados.
- `setScreenData` alimenta o contexto do Copiloto.

**Gaps vs cronograma:**
1. **AIPerformanceBar usando dados reais.** Precisa que SA02 exponha `iaPerformance`.
2. **Badge dinâmica em Incidentes Abertos** (Normal/Attention/High Alert) — hoje o código usa `alert` quando tem crítico; aplicar lógica completa do SA02.
3. **Filtro "Customizado" (date range)** — hoje só 4 opções fixas. Adicionar DatePicker e repassar `startDate`/`endDate`.
4. **Drill-down:** botão "Ver incidentes", click em MTTA/MTTR navegando para lista filtrada — validar existência (a lista de incidentes já existe em `Incidentes.tsx`; basta passar filtros via query string).
5. **Conformidade visual com Figma** — comparar página atual com Figma atualizado (link no Jira/Notion) e aplicar ajustes.
6. **Responsividade** — validar breakpoints mobile/tablet.
7. **Hover/tooltip no donut** com contagem absoluta + percentual + variação — hoje tem donut mas falta tooltip rico.

**Atividades:**
1. Atualizar `services/azure-api/soc-analytics.service.ts` para incluir `iaPerformance` e `openIncidents.badge` nos types.
2. Substituir valores mockados em `AIPerformanceBar` pelos dados reais.
3. Adicionar opção "Customizado" no dropdown de período com DatePicker (2 inputs: início, fim).
4. Implementar drill-down:
   - Botão "Ver incidentes" em cada KPI navegando para `/incidentes?period=xxx&severity=xxx`.
   - Click em fatia do donut navegando para `/incidentes?severity=<bucket>`.
5. Enriquecer tooltip do donut conforme especificação.
6. Revisão de design vs Figma — ajustar espaçamentos, cores, tipografia.
7. Testar responsividade em 3 breakpoints.

**Critérios de aceite:**
- [ ] Barras de IA refletem valores reais do backend.
- [ ] Badge dinâmica nos incidentes abertos.
- [ ] Período customizado funcional com calendário.
- [ ] Drill-down de KPIs e donut leva para lista filtrada.
- [ ] Tooltip do donut mostra count + % + delta vs anterior.
- [ ] Layout aprovado contra Figma por design.
- [ ] Responsivo em mobile/tablet/desktop.

---

## 4. Ordem de execução sugerida

```
Paralelo (independentes):
  (A) T01v + SA01v  — verificação de preenchimento        [Back-end Tickets]
  (B) R01           — documentar Risk Level               [Doc]

Sequencial após R01:
  R02 → R03 → R04                                         [Back-end/QA Strapi]

Sequencial após SA01v:
  SA02 (iaPerformance + badge + doc)                      [Back-end Tickets]
  SA03 (integração + drill-down + Figma)                  [Front-end]
       └── depende de SA02 concluído
```

**Caminho crítico para fechar o MVP:** `SA01v → SA02 → SA03`. Sem SA01v, SA02 não tem dados para calcular performance da IA, e SA03 não tem como exibi-los.

---

## 5. Riscos e pontos de atenção

1. **T01/SA01 marcados como "pendentes" mas o schema já está feito.** Risco de ser declarado `ok` prematuramente sem validar o **preenchimento em runtime**. Por isso as tarefas `T01v` / `SA01v` foram explicitadas aqui.
2. **SOC Analytics sem agregação diária.** Aceitável para MVP, mas precisa de observabilidade (tempo de resposta) antes de ir para clientes com > 50k incidentes/mês.
3. **Risk Level sem testes automatizados.** R04 é a única rede de segurança — não pular.
4. **Cálculo de MTT* depende de SA01v.** Se os campos de instrumentação não forem preenchidos corretamente, as métricas de SA02/SA03 virão zeradas ou nulas, mesmo com o endpoint funcional.
5. **Feature flags (E07) já ok**, mas validar que SOCAnalytics respeita flags do plano `essentials` (restrições documentadas no cronograma).

---

## 6. Checklist de conclusão da Fase 1

- [ ] T01 e SA01 validados em runtime (campos preenchidos em todos os incidentes novos).
- [ ] `docs/risk-level.md` publicado.
- [ ] Auditoria (R02) entregue com lista priorizada de divergências.
- [ ] Correções de degradação graciosa (R03) em produção.
- [ ] Suite de testes Risk Level (R04) executável em CI.
- [ ] Endpoint `/api/analytics/soc` retornando `iaPerformance` e `badge`.
- [ ] Frontend SOC Analytics com drill-down, período custom e dados reais de IA.
- [ ] Cronograma `CRONOGRAMA_FASE1_MVP_V2.md` atualizado (T01, SA01 → ok; demais pendências marcadas conforme avanço).
