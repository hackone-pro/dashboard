# Plano de Migração — Wazuh/IRIS → .NET (Hackone)

> Estudo de viabilidade. Data: 2026-05-11.
> Escopo: componentes do `frontend/src/` que consomem Wazuh e IRIS diretamente.
> API .NET de referência: `C:\Users\Guilherme\source\repos\Hackone`

---

## Contexto

A API .NET possui 4 microserviços relevantes:
- **Alerts** — NormalizedEvent, RiskLevelBaseline, Sources
- **Tickets** — Incident, Analytics SOC (`GET /api/analytics/soc`)
- **Customers** — Sources, LLM, DFIR
- **Chats** — Chat/Copiloto IA

O `.NET já recebe e normaliza alertas do Wazuh e FortiGATE`. O ponto de atenção é que os endpoints de *consulta* de NormalizedEvents e Incidents são limitados — a maioria do pipeline é write-only (ingestão → análise → IRIS). Para migrar os dashboards, precisamos de endpoints de leitura/agregação.

---

## 1. Mapeamento por Componente

| Componente | Serviço Wazuh/IRIS | Dado consumido | Cálculo/Agregação |
|---|---|---|---|
| Risk Level (gauge + breakdown) | `wazuh/risklevel.service.ts` | Score 0-100, breakdown por TopHosts, CIS, Firewall, Incidents | Cálculo no Strapi cron job |
| `SeveridadeCard` | `wazuh/severidade.service.ts` | Distribuição de eventos por severidade (baixo/médio/alto/crítico) | Contagem por bucket de severidade |
| `EventosSummaryCard` | `wazuh/eventossummary.service.ts` | Total de eventos, resumo por tipo | Contagem agregada por período |
| `DistribuicoesAcoesCard` | `wazuh/overtimeeventos.service.ts` | Distribuição de ações (blocked/allowed/detected) | Contagem por Action |
| `OvertimeCard` | `wazuh/overtimeeventos.service.ts` | Eventos ao longo do tempo (série temporal) | Time-bucket por dia/hora |
| `FirewallCard` (MonitoriaSOC) | `wazuh/firewalls.service.ts` | Eventos de firewall | Listagem/contagem de eventos SourceType=firewall |
| `TopFirewallCard`, `FirewallDonutCard` | `wazuh/topfirewall.service.ts` | Top firewalls, donut de eventos | Group by Source |
| `TopAttackCard`, `TopThreatCard` | `wazuh/mitre-techniques.service.ts` | Técnicas MITRE mais frequentes | Group by Category (MITRE tactic) |
| `TopAgentsCard` | `wazuh/topagents.service.ts` | Top agentes por nº de alertas | Group by AssetJson.host_name |
| `TopUsersCard` | `wazuh/topusers.service.ts` | Top usuários por nº de eventos | Group by AssetJson.user |
| `EdrCard` | `wazuh/edr.service.ts` | Dados de EDR (eventos de endpoint) | Listagem/contagem SourceType=edr/windows/linux |
| `FluxoIncidentes`, `IaHumans`, `TopIncidents`, `GraficosPainel`, `IncidenteTabela` | `iris/cases.service.ts` | Lista e contagens de incidentes, split IA/humano, top por severidade | Group by Status, Severity, TriagedBy |
| `ModalEditar` | `iris/updatecase.service.ts` | Atualizar campos de um incidente | PUT/PATCH endpoint |
| `RuleDistributionCard` | `wazuh/ruledistribution.service.ts` | Distribuição de regras Wazuh disparadas | Field `rule_id` (não existe no .NET) |
| `ServidoresCard` | `wazuh/servidores.service.ts` | Lista de servidores/agentes + status | Agente heartbeat (não existe) |
| `TopAgentsDonutCard` | `wazuh/topagentesyscheck.service.ts` | Agentes com checagens de integridade (syscheck) | Módulo syscheck Wazuh |
| `TopAgentsCisCard` | `wazuh/topagentscis.ts` | Agentes com falhas CIS benchmark | Módulo CIS por agente |
| `ThreatSeverityCard` | `wazuh/topcountries-severity.service.ts` | Ameaças por país + severidade | GeoIP em src_ip |
| `TopCountriesCard`, `TopCountriesTable` | `wazuh/toppaises.service.ts` | Top países de origem | GeoIP em src_ip |
| `TopAgenteVulnerabilidadeCard` | `wazuh/agentesvulnerabilidades.service.ts` | Top agentes com vulnerabilidades | Módulo VA Wazuh |
| `AnoVulnerabilidadeCard` | `wazuh/anovulnerabilidades.service.ts` | Vulnerabilidades por ano | Módulo VA histórico |
| `TopPackageVulnerabilidadeCard` | `wazuh/packagesvulnerabilidades.service.ts` | Top pacotes vulneráveis | Módulo SCA Wazuh |
| `TopVulnerabilidadeCard` | `wazuh/topseveridades.service.ts` | Top vulnerabilidades por severidade | CVE/CVSS via VA |
| `TopOSVulnerabilidadeCard`, `TopOSGraficoCard` | `wazuh/topsovulnerabilidades.service.ts` | Top SO vulneráveis | SO + vuln via VA |
| `VulnServeridadeCard` | `wazuh/vulnseveridades.service.ts` | Distribuição de vulnerabilidades por severidade | CVSS via VA |
| `TopScoreVulnerabilidadeCard` | `wazuh/vulntopscores.service.ts` | Top CVSS scores | CVSS scores via VA |
| `wazuh/tenant.service.ts` (direto) | `wazuh/tenant.service.ts` | Grupos/agentes do tenant no Wazuh | Específico do Wazuh |

---

## 2. Grupos de Migração

---

### Grupo A — Migrar agora

> Dados completamente disponíveis no .NET. Só refatorar o front para chamar os novos endpoints.

| Componente | Endpoint .NET a usar | O que muda no front | Complexidade |
|---|---|---|---|
| Risk Level score + gauge (`wazuh/risklevel.service.ts`) | `GET /api/analytics/soc` → campo `riskLevel { score, level, alertsBySeverity }` | Substituir chamada ao serviço Wazuh pelo SOC Analytics. Extrair `riskLevel` do response. | Baixa |
| Risk Level breakdown cards (TopHosts, CIS, Firewall, Incidents) | `GET /api/risk-level-baselines?tenantId=X` → campos `topHosts, cis, firewall, incidents` | Substituir chamada ao endpoint de baseline por `/api/risk-level-baselines` | Baixa |
| `SeveridadeCard` — distribuição de alertas por severidade (`wazuh/severidade.service.ts`) | `GET /api/analytics/soc` → campo `severityDistribution.buckets[]` | Extrair `severityDistribution` do SOC Analytics em vez de chamar Wazuh | Baixa |

---

### Grupo B — Migrar com ajustes

> Temos os dados base no .NET (entities, normalizadores), mas faltam endpoints de consulta/agregação.

| Componente | O que existe no .NET | O que falta criar/ajustar no .NET | O que muda no front | Complexidade |
|---|---|---|---|---|
| `FluxoIncidentes`, `TopIncidents`, `GraficosPainel`, `IncidenteTabela` (`iris/cases.service.ts`) | Entity `Incident` com todos os campos (Status, Severity, CreatedAt, etc.) | `GET /api/incidents` com filtros por status, severidade, período e paginação. `GET /api/incidents/stats` com contagem por status + grupo | Trocar `iris/cases.service.ts` para novos endpoints de consulta | Média |
| `IaHumans` — split triagem IA vs Humano (`iris/cases.service.ts`) | Entity `Incident.TriagedBy` (AI=1, HUMAN=2) + `IaPerformance.TriageAutoRate` no SOC Analytics | Nenhum — `GET /api/analytics/soc` já tem `iaPerformance.triageAutoRate` | Usar `iaPerformance` do SOC Analytics em vez de contar casos no IRIS | Baixa |
| `ModalEditar` — editar incidente (`iris/updatecase.service.ts`) | Entity `Incident` com Status, AssignedTo, ResolutionNotes, Severity | `PUT /api/incidents/{id}` com campos editáveis pelo analista | Trocar chamada IRIS para endpoint .NET | Média |
| `EventosSummaryCard` (`wazuh/eventossummary.service.ts`) | `NormalizedEvent` com TenantId, Severity, Category, EventTime | `GET /api/events/summary?tenantId=X&from=&to=` retornando contagens por severidade/tipo | Trocar serviço Wazuh pelo novo endpoint de summary | Média |
| `DistribuicoesAcoesCard` (`wazuh/overtimeeventos.service.ts`) | `NormalizedEvent.Action` (blocked/allowed/detected/quarantined) | `GET /api/events/actions?tenantId=X&from=&to=` com distribuição por Action | Trocar serviço Wazuh | Média |
| `OvertimeCard` — série temporal de eventos (`wazuh/overtimeeventos.service.ts`) | `NormalizedEvent.EventTime`, TenantId | `GET /api/events/overtime?tenantId=X&from=&to=&bucket=hour/day` com série temporal | Trocar serviço Wazuh | Média |
| `FirewallCard` (MonitoriaSOC) + `TopFirewallCard` + `FirewallDonutCard` (`wazuh/firewalls.service.ts`, `wazuh/topfirewall.service.ts`) | `NormalizedEvent.SourceType="firewall"`, Severity, Action, AssetJson | `GET /api/events/firewall?tenantId=X&from=&to=` com listagem e top sources. Campo `SourceId` no NormalizedEvent ajudaria no group by source. | Trocar serviços Wazuh pelos novos endpoints de firewall | Média |
| `TopAttackCard`, `TopThreatCard` (`wazuh/mitre-techniques.service.ts`) | `NormalizedEvent.Category` (mapeado de MITRE tactics pelo WazuhNormalizer) | `GET /api/events/top-categories?tenantId=X&from=&to=&limit=N` com contagem por Category | Trocar serviço MITRE pelo novo endpoint de categorias | Média |
| `TopAgentsCard` (`wazuh/topagents.service.ts`) | `NormalizedEvent.AssetJson` com host_name e ip | `GET /api/events/top-assets?tenantId=X&from=&to=&limit=N` agrupando por AssetJson→host_name | Trocar serviço Wazuh | Média |
| `TopUsersCard` (`wazuh/topusers.service.ts`) | `NormalizedEvent.AssetJson` com campo user | `GET /api/events/top-users?tenantId=X&from=&to=&limit=N` extraindo e agrupando por AssetJson→user | Trocar serviço Wazuh | Média |
| `EdrCard` (`wazuh/edr.service.ts`) | `NormalizedEvent` com SourceType mapeável para EDR (edr, windows, linux) | `GET /api/events/edr?tenantId=X&from=&to=` filtrando SourceType IN (edr, windows, linux) com contagens | Trocar serviço Wazuh | Alta (dados EDR têm estrutura variada) |

---

### Grupo C — Não dá pra migrar agora

> Faltam dados, ingestão ou infraestrutura que ainda não existem no .NET.

| Componente | O que falta | O que precisa desenvolver | Pré-requisitos |
|---|---|---|---|
| **VulnerabilitiesDetection (todos os 7 componentes)**: `TopAgenteVulnerabilidadeCard`, `AnoVulnerabilidadeCard`, `TopPackageVulnerabilidadeCard`, `TopVulnerabilidadeCard`, `TopOSVulnerabilidadeCard/GraficoCard`, `VulnServeridadeCard`, `TopScoreVulnerabilidadeCard` | Dados de VA (Vulnerability Assessment) do Wazuh: agentes com CVEs, pacotes, SO, scores CVSS | Ingestão de dados do módulo Wazuh VA → nova entity `Vulnerability { tenantId, agentId, cveId, cvssScore, packageName, os, severity, detectedAt }` + endpoints de consulta + normalizer VA | Acesso à API de VA do Wazuh, ou substituição por outro scanner (Trivy, OpenVAS) |
| `RuleDistributionCard` — distribuição de regras Wazuh | Campo `rule_id` e `rule_description` não existem no `NormalizedEvent` | Adicionar campo `SignatureId` (já há `VendorEventId`) e `SignatureName` ao NormalizedEvent. Criar endpoint `GET /api/events/rule-distribution` | Garantir que o WazuhNormalizer popula esses campos |
| `ServidoresCard` — lista e status de agentes | Estado de saúde dos agentes Wazuh (ativo/inativo, last heartbeat) | Nova entity `Agent { tenantId, agentId, hostname, ip, os, status, lastSeen }` + sincronização periódica com Wazuh API ou ingestão de heartbeats | API de agentes do Wazuh ou ingestão de keepalive events |
| `TopAgentsDonutCard` — syscheck (file integrity) | Dados do módulo syscheck do Wazuh: mudanças de arquivo, alertas FIM | Ingestão de eventos FIM via Wazuh (`syscheck` category) + endpoint de top agents por FIM count | SourceType `fim` já existe no NormalizedEvent, mas Wazuh precisa enviar esses events |
| `TopAgentsCisCard` — falhas CIS por agente | CIS benchmark por agente individual (o .NET tem só o score agregado no baseline) | Adicionar tabela `CisResult { tenantId, agentId, checkId, result, score, timestamp }` + endpoint de top agents por CIS failures | Wazuh SCA (Security Configuration Assessment) precisa enviar dados por agente |
| `ThreatSeverityCard`, `TopCountriesCard`, `TopCountriesTable` — geolocalização | GeoIP lookup em IPs dos IOCs. `NormalizedEvent.IocJson` tem `src_ip` mas sem país | Integrar GeoIP (MaxMind GeoLite2 ou similar) no processo de normalização para adicionar `country_code`, `country_name` ao IocJson. Criar endpoint de top países | Licença MaxMind GeoLite2 (gratuita), pipeline de normalização atualizado |
| `wazuh/tenant.service.ts` (direto) — dados do tenant no Wazuh | Dados específicos do Wazuh: grupos, agentes do tenant, configurações | Depende do que exatamente é consumido nas páginas Reports e RiskLevel. Se for apenas para identificação do tenant, pode usar TenantId do .NET. Se for grupos/agentes Wazuh → mantém Wazuh | Análise mais profunda do uso |

---

## 3. Recomendação Final

### Ordem de execução sugerida

**Sprint 1 — Quick wins (Grupo A):**
1. Migrar Risk Level gauge + breakdown → `/api/analytics/soc` + `/api/risk-level-baselines`
2. Migrar `SeveridadeCard` → `severityDistribution` do SOC Analytics
3. Migrar `IaHumans` → `iaPerformance.triageAutoRate` do SOC Analytics

**Sprint 2 — Incidentes (maior impacto, dados prontos):**
4. Criar `GET /api/incidents` com filtros + paginação
5. Criar `GET /api/incidents/stats` com contagens por status/severidade
6. Criar `PUT /api/incidents/{id}` para atualização pelo analista
7. Migrar todos os componentes IRIS: `FluxoIncidentes`, `TopIncidents`, `GraficosPainel`, `IncidenteTabela`, `ModalEditar`

**Sprint 3 — Eventos/Alertas (endpoints de consulta):**
8. Criar endpoints de consulta em `SecurityOne.Alerts`:
   - `GET /api/events/summary` — resumo de eventos por período
   - `GET /api/events/overtime` — série temporal
   - `GET /api/events/actions` — distribuição por ação
   - `GET /api/events/firewall` — eventos de firewall
   - `GET /api/events/top-categories` — top MITRE categories
   - `GET /api/events/top-assets` — top hosts por eventos
   - `GET /api/events/top-users` — top usuários por eventos
9. Migrar: `EventosSummaryCard`, `DistribuicoesAcoesCard`, `OvertimeCard`, `FirewallCard`, `TopFirewallCard`, `FirewallDonutCard`, `TopAttackCard`, `TopThreatCard`, `TopAgentsCard`, `TopUsersCard`

**Sprint 4 — EDR:**
10. Criar `GET /api/events/edr` com filtragem por SourceType
11. Migrar `EdrCard`

**Pós-Fase 1 (backlog):**
- Vulnerabilidades: requer decisão de arquitetura (continuar Wazuh VA ou novo scanner)
- Geolocalização: integrar GeoIP no normalizer
- CIS por agente: requer dados do Wazuh SCA por agente
- Syscheck: requer Wazuh enviando FIM events
- Status de agentes: requer sincronização de heartbeat

---

### Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Endpoints de consulta de NormalizedEvents precisam de índices adequados (TenantId + EventTime) | Alto — performance | Garantir índice composto `(TenantId, EventTime)` na tabela antes de criar endpoints |
| `AssetJson` e `IocJson` são campos JSON no banco — consultas de group by são lentas sem colunas extraídas | Médio — performance | Considerar colunas computadas ou extrair `AssetHost` e `AssetUser` como campos first-class |
| IRIS continua sendo o sistema de registro dos incidentes (CaseUuid, SocId) | Alto — integridade | O endpoint `GET /api/incidents` deve ser o proxy — não criar duplicação de estado |
| Período de transição com dois sistemas em paralelo | Médio — consistência | Migrar página a página, nunca componente parcial de uma página |
| wazuh/tenant.service.ts: uso não totalmente mapeado nas páginas Reports e RiskLevel | Médio — descoberta | Analisar o código de Reports.tsx e RiskLevel.tsx antes de migrar essas páginas |

---

### O que pode continuar no Wazuh/IRIS (por enquanto)

| Componente / Dado | Razão para manter |
|---|---|
| **Toda a página VulnerabilitiesDetection** (7 componentes) | Wazuh VA é a única fonte de dados de CVE/pacotes/SO. Sem substituto no .NET. |
| **`RuleDistributionCard`** | Dado de rule_id muito específico do Wazuh. Valor limitado para migrar com campo proxy. |
| **`ServidoresCard`** | Status de agentes Wazuh não tem equivalente no .NET. Seria nova funcionalidade. |
| **`TopAgentsDonutCard`** (syscheck) | Módulo FIM/syscheck do Wazuh, sem ingestão no .NET ainda. |
| **`TopAgentsCisCard`** | Dados CIS por agente não são ingeridos. Só score agregado. |
| **`ThreatMap` completo** (países + severidade) | Falta GeoIP. Manter Wazuh até integrar MaxMind. |
| **IRIS (write path)** | IRIS continua sendo o sistema de tickets. O .NET `Incident` é um espelho do IRIS, não o substituto. A remoção do IRIS é decisão separada. |
