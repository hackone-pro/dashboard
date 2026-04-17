# Mapa de Chamadas de API — Páginas do Plano Essentials

> Documento de referência técnica que mapeia todas as chamadas de API realizadas pelas páginas do frontend habilitadas no plano **Essentials** (conforme item E07 de `PLANO_ESSENTIALS_V2.md`).
>
> **Escopo das páginas Essentials:** Home, Incidentes, Risk Level, SOC Analytics (limitado), Monitoria de Ingestão, Threat Map, Relatórios e Integrações (FortiGATE).

---

## 1. Home (Dashboard)

**Arquivo:** `src/pages/Dashboard.tsx`

| Método | Endpoint | Serviço / Hook | Propósito |
|--------|----------|---------------|-----------|
| GET | `/api/custom-dashboards/me` | `services/dashboard/dashboardLayout.service.ts:getDashboardLayout()` | Busca layout customizado do usuário |
| PUT | `/api/custom-dashboards/me` | `services/dashboard/dashboardLayout.service.ts:saveDashboardLayout()` | Salva layout após alterações |
| PUT | `/api/custom-dashboards/reset-me` | `services/dashboard/dashboardLayout.service.ts:resetUserDashboardLayout()` | Restaura layout padrão |
| GET | `/api/acesso/wazuh/risklevel` | `services/wazuh/risklevel.service.ts:getRiskLevel()` | Índice de risco (24h padrão) |
| GET | `/api/acesso/wazuh/topfirewall` | `services/wazuh/topfirewall.service.ts:getTopFirewalls()` | Top firewalls (widget) |
| GET | `/api/acesso/wazuh/topagents` | `services/wazuh/topagents.service.ts:getTopAgents()` | Top hosts com mais alertas (widget) |
| GET | `/api/acesso/wazuh/paises` | `services/wazuh/topaises.service.ts:getTopPaises()` | Top países de origem (widget) |
| GET | `/api/acesso/iris/manage/cases/list` | `services/iris/cases.service.ts:getTodosCasos()` | Incidentes IRIS (widget) |

**Widgets instanciados:** `GraficoRisco`, `GeoMap`, `TopPaises`, `TopIncidentes`, `IaHumans`, `TopFirewalls`.

---

## 2. Incidentes

**Arquivo:** `src/pages/Incidentes.tsx` (via `hooks/useIncidentes.ts`)

| Método | Endpoint | Serviço / Hook | Propósito |
|--------|----------|---------------|-----------|
| GET | `/api/acesso/iris/manage/cases/list` | `services/iris/cases.service.ts:getTodosCasos()` | Lista casos com filtros `from/to` |
| GET | `/api/acesso/wazuh/tenant` | `services/wazuh/tenant.service.ts:getTenant()` | Dados do tenant (client_name, wazuh_client_name) |
| GET | `/api/acesso/user/userstenant` | `services/user/userstenant.service.ts:getUsuariosTenant()` | Usuários do tenant para atribuição |

**Componentes filhos:** `GraficosPainel` (donuts de resumo), `IncidenteTabela` (tabela paginada).

---

## 3. Risk Level

**Arquivo:** `src/pages/RiskLevel.tsx`

> Todos os endpoints abaixo aceitam query string `dias` ou `from/to`.

| Método | Endpoint | Serviço / Componente | Propósito |
|--------|----------|---------------------|-----------|
| GET | `/api/acesso/wazuh/riskLevel` | `services/wazuh/risklevel.service.ts:getRiskLevel()` | Índice de risco e severidades |
| GET | `/api/acesso/wazuh/topagents` | `componentes/wazuh/RiskLevel/TopAgentsCard.tsx` → `services/wazuh/topagents.service.ts` | Top 10 hosts com alertas |
| GET | `/api/acesso/wazuh/topagentesCis` | `componentes/wazuh/RiskLevel/TopAgentsCisCard.tsx` → `services/wazuh/topagentscis.ts` | Top hosts CIS compliance |
| GET | `/api/acesso/wazuh/topfirewall` | `componentes/wazuh/RiskLevel/FirewallDonutCard.tsx` → `services/wazuh/topfirewall.service.ts` | Alertas por firewall com severidade |
| GET | `/api/acesso/iris/manage/cases/list` | `componentes/iris/FluxoIncidentes.tsx` → `services/iris/cases.service.ts` | Incidentes para gráfico de fluxo |

---

## 4. SOC Analytics (versão limitada)

**Arquivo:** `src/pages/SOCAnalytics.tsx`

| Método | Endpoint | Serviço | Propósito |
|--------|----------|---------|-----------|
| GET | `/api/analytics/soc?periodType=Week\|Month\|Quarter\|Year` | `services/azure-api/soc-analytics.service.ts:socAnalyticsService.getSocAnalytics()` | KPIs (MTTD, MTTA, MTTR, incidentes abertos, severidades, risk score, alertas por gravidade) |

> Conforme SA02/SA03 do plano, o endpoint deve retornar agregações pré-calculadas e comparação com período anterior (delta).

---

## 5. Monitoria de Ingestão

**Arquivo:** `src/pages/MonitoriaSOC.tsx`

| Método | Endpoint | Serviço / Componente | Propósito |
|--------|----------|---------------------|-----------|
| GET | `/api/storage/state` | `services/storage/storage.service.ts:getStorageState()` | Estado de storage (used, deleted, remaining, total) |
| GET | `/api/storage/internal` | `services/storage/storage.service.ts:getStorageInternal()` | Descartes internos |
| GET | `/api/storage/timeline` | `services/storage/timeline.service.ts:getStorageTimeline()` | Série temporal 30 dias |
| GET | `/api/acesso/wazuh/firewalls` | `componentes/wazuh/Monitoria/FirewallCard.tsx` → `services/wazuh/firewall.service.ts` | Status de firewalls |
| GET | `/api/acesso/wazuh/agentes` | `componentes/wazuh/Monitoria/ServidoresCard.tsx` → `services/wazuh/agentes.service.ts` | Status de servidores/agentes |
| GET | `/api/acesso/wazuh/edr` | `componentes/wazuh/Monitoria/EdrCard.tsx` → `services/wazuh/edr.service.ts` | Status de EDR |

> Conforme G11/G12 do plano, essa página deve evoluir para "Monitoria de Ingestão" incluindo `last_success_at`, `error_rate`, `events_24h`, `avg_latency` por integração.

---

## 6. Threat Map

**Arquivo:** `src/pages/ThreatMap.tsx`

| Método | Endpoint | Serviço / Componente | Propósito |
|--------|----------|---------------------|-----------|
| GET | `/api/acesso/wazuh/paises/geo` | `componentes/graficos/GeoHitsMap.tsx` → `services/wazuh/topaises.service.ts:getTopPaisesGeo()` | Ataques geo-referenciados |
| GET | `/api/acesso/wazuh/paises/severity` | `componentes/wazuh/threatmap/TopCountriesCard.tsx` → `services/wazuh/topaises.service.ts:getTopCountriesWithSeverity()` | Top países por severidade |
| GET | `/api/acesso/wazuh/severidade` | `componentes/wazuh/threatmap/ThreatSeverityCard.tsx` → `services/wazuh/severidade.service.ts` | Distribuição de severidades |
| GET | `/api/acesso/wazuh/topataques` | `componentes/wazuh/threatmap/TopAttackCard.tsx` → `services/wazuh/topataques.service.ts` | Top ataques ativos |
| GET | `/api/acesso/wazuh/ameacas` | `componentes/wazuh/threatmap/TopThreatCard.tsx` → `services/wazuh/ameacas.service.ts` | Ameaças mais frequentes |
| WS / Stream | (stream em tempo real) | `context/AttackStreamProvider.tsx` | Feed live para `LiveAttackCard` |

---

## 7. Relatórios

**Arquivo:** `src/pages/Reports.tsx`

| Método | Endpoint | Serviço | Propósito |
|--------|----------|---------|-----------|
| GET | `/api/acesso/report/data/:cliente?period=X` | `services/reports/report.service.ts:getReportData()` | Dados completos (topUrls, topIps, topApps, tabelaResumo) |
| GET | `/api/acesso/wazuh/topagents?periodo=X` | `services/wazuh/topagents.service.ts` | Top hosts |
| GET | `/api/acesso/wazuh/topagentesCis?periodo=X` | `services/wazuh/topagentscis.ts` | Hosts CIS |
| GET | `/api/acesso/wazuh/topusers?periodo=X` | `services/wazuh/topusers.service.ts` | Usuários por consumo |
| GET | `/api/acesso/wazuh/topvulnerabilidades` | `services/wazuh/vulnseveridades.service.ts` | Vulnerabilidades por severidade |
| GET | `/api/acesso/wazuh/topossovulnerabilidades` | `services/wazuh/topsovulnerabilidades.service.ts` | Top OSs com vulnerabilidades |
| GET | `/api/acesso/wazuh/severidade?periodo=X` | `services/wazuh/severidade.service.ts` | Distribuição de severidades |

> A geração de PDF é local (jsPDF + ApexCharts), sem chamadas adicionais.

---

## 8. Integrações (E01 — FortiGATE e demais fontes)

**Arquivo:** `src/pages/Integrations.tsx`

| Método | Endpoint | Serviço | Propósito |
|--------|----------|---------|-----------|
| GET | `/api/azure/llm-configs` | `services/azure-api/llm.service.ts:getLLMConfig()` | Configs de LLM (chat e análise) |
| POST | `/api/azure/llm-configs` | `services/azure-api/llm.service.ts:saveLLMConfig()` | Cria config LLM |
| PUT | `/api/azure/llm-configs/:id` | `services/azure-api/llm.service.ts:updateLLMConfig()` | Atualiza config LLM |
| GET | `/api/integrations/sources/:vendor` | `services/integrations/source.service.ts:getSourceInstances()` | Lista instâncias por vendor (Wazuh, FortiGATE, Trend Micro) |
| POST | `/api/integrations/sources` | `SourceConfigModal` | Cria integração |
| PUT | `/api/integrations/sources/:id` | `SourceConfigModal` | Atualiza integração |

---

## 9. Resumo por Domínio

### Wazuh (`/api/acesso/wazuh/*`)
`risklevel`, `topfirewall`, `topagents`, `topagentesCis`, `paises`, `paises/geo`, `paises/severity`, `severidade`, `topataques`, `ameacas`, `topusers`, `topvulnerabilidades`, `topossovulnerabilidades`, `firewalls`, `agentes`, `edr`, `tenant`.

### IRIS (`/api/acesso/iris/*`)
`manage/cases/list` — lista de incidentes com paginação/filtros.

### Storage / Ingestão (`/api/storage/*`)
`state`, `internal`, `timeline`.

### Dashboard customizável (`/api/custom-dashboards/*`)
`me` (GET/PUT), `reset-me` (PUT).

### Relatórios (`/api/acesso/report/*`)
`data/:cliente`.

### Azure / IA (`/api/analytics/*`, `/api/azure/*`)
`analytics/soc`, `azure/llm-configs`.

### Integrações (`/api/integrations/*`)
`sources/:vendor`, `sources`, `sources/:id`.

### Usuários (`/api/acesso/user/*`)
`userstenant`.

---

## 10. Observações Arquiteturais

- Todas as chamadas passam pelo wrapper `apiFetch()` em `src/utils/api.ts` (exceto alguns pontos que usam `axios` direto).
- Autenticação via **JWT Bearer** (localStorage), configurável por `VITE_API_URL`.
- O prefixo `/api/acesso/*` indica rotas intermediadas pelo backend Strapi (proxy para Wazuh/IRIS).
- **Impacto Essentials sem SIEM:** Os endpoints `/api/acesso/wazuh/*` hoje assumem Wazuh como fonte. Para o plano Essentials, deverão consumir dados do pipeline `Polling Job → ALERT → CORRELATION → TICKET` (conforme E02/E03/G01/G04), mantendo os contratos do frontend ou consolidando em novos endpoints `/api/essentials/*`.
- **Feature flags (E07):** A visibilidade dessas páginas deve ser resolvida server-side com base no campo `plan` do tenant (ver §5.3 do PLANO_ESSENTIALS_V2).
