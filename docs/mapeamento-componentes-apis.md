# Mapeamento Componentes × APIs

> Levantamento de impacto de migração: `Componente → Serviço → Sistema backend`.
> Data: 2026-04-17. Escopo: `frontend/src/`.

## Backends identificados

| Backend | Localização dos serviços | Observação |
|---|---|---|
| **Wazuh** | `services/wazuh/*` | 24 serviços ativos |
| **Zabbix** | `services/zabbix/*` | 11 serviços, todos ligados a componentes em `mock/` |
| **IRIS** | `services/iris/*` | 2 serviços ativos |
| **Azure / LLM** | `services/azure-api/*` | 4 serviços (soc-analytics, chat, llm, headers) |
| **Strapi (interno)** | `services/{auth,dashboard,tenant,reports,report-entry,storage,user,multi-tenant,integrations}/*` | 20 serviços |
| **FortiSIEM** | `services/fortsiem.service.ts` (raiz) | **Órfão** — nenhum consumidor |
| **Legado** | `services/iris.service.ts` (raiz) | Arquivo legado esvaziado |

---

## Parte 1 — Por Backend

### Wazuh

| Componente | Serviço | Página(s) que usam |
|---|---|---|
| `TopAgenteVulnerabilidadeCard` | `wazuh/agentesvulnerabilidades.service.ts` | VulnerabilitiesDetection |
| `AnoVulnerabilidadeCard` | `wazuh/anovulnerabilidades.service.ts` | VulnerabilitiesDetection |
| `EdrCard` (Monitoria) | `wazuh/edr.service.ts` | MonitoriaSOC |
| `EventosSummaryCard` | `wazuh/eventossummary.service.ts` | RiskLevel |
| `FirewallCard` (Wazuh/Monitoria) | `wazuh/firewalls.service.ts` | MonitoriaSOC |
| `TopAttackCard`, `TopThreatCard` | `wazuh/mitre-techniques.service.ts` | ThreatMap |
| `DistribuicoesAcoesCard`, `OvertimeCard` | `wazuh/overtimeeventos.service.ts` | RiskLevel, Reports |
| `TopPackageVulnerabilidadeCard` | `wazuh/packagesvulnerabilidades.service.ts` | VulnerabilitiesDetection |
| _(consumido direto em página)_ | `wazuh/risklevel.service.ts` | Dashboard, RiskLevel |
| `RuleDistributionCard` | `wazuh/ruledistribution.service.ts` | RiskLevel |
| `ServidoresCard` | `wazuh/servidores.service.ts` | MonitoriaSOC |
| `SeveridadeCard` (RiskLevel) | `wazuh/severidade.service.ts` | RiskLevel, Reports |
| _(consumido direto em páginas)_ | `wazuh/tenant.service.ts` | Reports, RiskLevel |
| `TopAgentsDonutCard` | `wazuh/topagentesyscheck.service.ts` | RiskLevel |
| `TopAgentsCard` | `wazuh/topagents.service.ts` | Reports, RiskLevel |
| `TopAgentsCisCard` | `wazuh/topagentscis.ts` | Reports, RiskLevel |
| `ThreatSeverityCard` | `wazuh/topcountries-severity.service.ts` | ThreatMap |
| `TopFirewallCard`, `FirewallDonutCard` | `wazuh/topfirewall.service.ts` | RiskLevel |
| `TopCountriesCard`, `TopCountriesTable` | `wazuh/toppaises.service.ts` | ThreatMap |
| `TopVulnerabilidadeCard` | `wazuh/topseveridades.service.ts` | VulnerabilitiesDetection |
| `TopOSVulnerabilidadeCard`, `TopOSGraficoCard` | `wazuh/topsovulnerabilidades.service.ts` | VulnerabilitiesDetection, Reports |
| `TopUsersCard` | `wazuh/topusers.service.ts` | Reports |
| `VulnServeridadeCard` | `wazuh/vulnseveridades.service.ts` | VulnerabilitiesDetection, Reports |
| `TopScoreVulnerabilidadeCard` | `wazuh/vulntopscores.service.ts` | VulnerabilitiesDetection |

### Zabbix

> ⚠ Todos os componentes renderizados em produção são os da pasta `mock/`. Os serviços Zabbix listados abaixo alimentam apenas as versões **não-mock**, que estão **órfãs** (ver Parte 3).

| Componente (versão real, **não usada**) | Serviço | Página que deveria usar |
|---|---|---|
| `zabbix/Monitoria/Alertas` | `zabbix/alertas.ts` | — (MonitoriaCSC usa `mock/Alertas`) |
| `zabbix/Monitoria/Ativos` | `zabbix/ativos.ts` | — (MonitoriaCSC usa `mock/Ativos`) |
| `zabbix/Monitoria/FirewallCard` | `zabbix/firewalls.service.ts` | — (MonitoriaCSC usa `mock/FirewallCard`) |
| `zabbix/Monitoria/LinksWan` | `zabbix/links-wan.ts` | — (MonitoriaCSC usa `mock/LinksWan`) |
| `zabbix/Monitoria/Roteadores` | `zabbix/routers.ts` | — (MonitoriaCSC usa `mock/Roteadores`) |
| `zabbix/Monitoria/Severidade` | `zabbix/severidade.ts` | — (MonitoriaCSC usa `mock/Severidade`) |
| `zabbix/Monitoria/SwitchesStatus` | `zabbix/switches-status.ts` | — (MonitoriaCSC usa `mock/SwitchesStatus`) |
| `zabbix/Monitoria/TopHostsCPU`, `TopUseCPU` | `zabbix/top-hosts-cpu.ts` | — (MonitoriaCSC usa mocks) |
| `zabbix/Monitoria/TopSwitchesCPU` | `zabbix/top-switches-cpu.ts` | — (MonitoriaCSC usa `mock/TopSwitchesCPU`) |
| `zabbix/Monitoria/TopFirewallTrafego` | `zabbix/firewalls.service.ts` | — (MonitoriaCSC usa `mock/TopFirewallTrafego`) |
| `zabbix/Monitoria/VPN` | `zabbix/vpn.ts` | — (MonitoriaCSC usa `mock/VPN`) |
| _hook `useZabbixAtivo`_ | `zabbix/zabbix-config.ts` | MonitoriaCSC |

### IRIS

| Componente | Serviço | Página(s) |
|---|---|---|
| `FluxoIncidentes`, `IaHumans`, `TopIncidents`, `GraficosPainel`, `IncidenteTabela` | `iris/cases.service.ts` | RiskLevel, Incidentes |
| `ModalEditar` (incidentes) | `iris/updatecase.service.ts` | Incidentes |

### Azure / LLM

| Componente | Serviço | Página(s) |
|---|---|---|
| `LLMConfigPanel` | `azure-api/llm.service.ts` | Integrations |
| `ChatWidget`, `ChatWindow`, `ChatInput`, `MessageBubble` | `azure-api/chat.service.ts` | (embutido no layout; sem página dedicada) |
| _(consumido direto em página)_ | `azure-api/soc-analytics.service.ts` | SOCAnalytics |
| (infra) | `azure-api/headers.ts` | — (helper interno) |

### Strapi (interno)

| Componente / consumidor | Serviço | Página(s) |
|---|---|---|
| _(consumido direto)_ | `auth/changePassword.service.ts` | Config |
| _(consumido direto)_ | `auth/createUser.service.ts` | Config |
| _(consumido direto)_ | `auth/deleteUser.service.ts` | Config |
| _(consumido direto)_ | `auth/getUserList.service.ts` | Config |
| _(consumido direto)_ | `auth/getUserProfile.service.ts` | Config, SideBar |
| _(consumido direto)_ | `auth/loginAttemps.service.ts` | Login |
| _(consumido direto)_ | `auth/resendInvite.service.ts` | Config |
| _(consumido direto)_ | `auth/updateUser.service.ts` | Config |
| `WidgetConfig`, `WidgetMenu`, `WidgetMap` | `dashboard/dashboardLayout.service.ts` | Dashboard |
| `SourceConfigModal` | `integrations/source.service.ts` | Integrations |
| _(consumido direto)_ | `multi-tenant/summary.service.ts` | MultiTenantManager |
| _(consumido direto)_ | `report-entry/report.service.ts` | ReportDash, ReportView |
| _(consumido direto)_ | `reports/report.service.ts` | Reports |
| _(consumido direto)_ | `storage/storage.service.ts` | MonitoriaSOC |
| _(consumido direto)_ | `storage/timeline.service.ts` | MonitoriaSOC |
| `TenantSelector`, contexts | `tenant/tenant.service.ts` | múltiplas |
| _hook `useIncidentes`_ | `user/userstenant.service.ts` | Incidentes |

### FortiSIEM

| Componente | Serviço | Páginas |
|---|---|---|
| — (nenhum) | `fortsiem.service.ts` | — (**órfão**) |

---

## Parte 2 — Por Página

### `Login.tsx` → Strapi
- Consome: `auth/loginAttemps.service.ts`.

### `ForgotPassword.tsx`, `ResetPassword.tsx`, `MFACode.tsx` → Strapi (auth)
- Fluxos de autenticação. Sem componentes de domínio.

### `Config.tsx` → Strapi (auth)
- Consome diretamente 7 serviços de `auth/`.

### `Dashboard.tsx` → Strapi + Wazuh
- `WidgetMap` (renderiza widgets via `dashboardLayout.service.ts`).
- Consome `wazuh/risklevel.service.ts` para dados do dashboard.

### `RiskLevel.tsx` → Wazuh + IRIS
- `SeveridadeCard` → `wazuh/severidade.service.ts`
- `TopAgentsCard` → `wazuh/topagents.service.ts`
- `TopAgentsCisCard` → `wazuh/topagentscis.ts`
- `TopAgentsDonutCard` → `wazuh/topagentesyscheck.service.ts`
- `TopFirewallCard`, `FirewallDonutCard` → `wazuh/topfirewall.service.ts`
- `RuleDistributionCard` → `wazuh/ruledistribution.service.ts`
- `EventosSummaryCard` → `wazuh/eventossummary.service.ts`
- `DistribuicoesAcoesCard`, `OvertimeCard` → `wazuh/overtimeeventos.service.ts`
- `FluxoIncidentes` → `iris/cases.service.ts`
- Direto: `wazuh/risklevel.service.ts`

### `Incidentes.tsx` → IRIS + Strapi
- `GraficosPainel`, `IncidenteTabela` → `iris/cases.service.ts` (via hook `useIncidentes`)
- `ModalEditar` → `iris/updatecase.service.ts`
- Hook `useIncidentes` → `user/userstenant.service.ts`

### `VulnerabilitiesDetection.tsx` → Wazuh
- `VulnServeridadeCard` → `wazuh/vulnseveridades.service.ts`
- `TopVulnerabilidadeCard` → `wazuh/topseveridades.service.ts`
- `TopOSVulnerabilidadeCard`, `TopOSGraficoCard` → `wazuh/topsovulnerabilidades.service.ts`
- `TopAgenteVulnerabilidadeCard` → `wazuh/agentesvulnerabilidades.service.ts`
- `TopPackageVulnerabilidadeCard` → `wazuh/packagesvulnerabilidades.service.ts`
- `TopScoreVulnerabilidadeCard` → `wazuh/vulntopscores.service.ts`
- `AnoVulnerabilidadeCard` → `wazuh/anovulnerabilidades.service.ts`

### `ThreatMap.tsx` → Wazuh
- `TopAttackCard`, `TopThreatCard` → `wazuh/mitre-techniques.service.ts`
- `TopCountriesCard`, `TopCountriesTable` → `wazuh/toppaises.service.ts`
- `ThreatSeverityCard` → `wazuh/topcountries-severity.service.ts`
- `LiveAttackCard` → stream via `AttackStreamProvider` (WebSocket, sem serviço REST)
- `GeoHitsMap` → alimentado via props/context

### `MonitoriaSOC.tsx` → Wazuh + Strapi
- `FirewallCard` (Wazuh) → `wazuh/firewalls.service.ts`
- `ServidoresCard` → `wazuh/servidores.service.ts`
- `EdrCard` → `wazuh/edr.service.ts`
- Direto: `storage/storage.service.ts`, `storage/timeline.service.ts`

### `MonitoriaCSC.tsx` → Zabbix (**100 % mock**)
- Importa exclusivamente `componentes/zabbix/Monitoria/mock/*`. Nenhum serviço Zabbix real é consumido nesta página.
- Único serviço Zabbix efetivamente usado: `zabbix-config.ts` via hook `useZabbixAtivo`.

### `MonitoriaCSC-bkp.tsx` → backup/legado
- Não é roteado; ignorar.

### `SOCAnalytics.tsx` → Azure/LLM
- Gráficos genéricos (`GraficoDonutSimples`, `GraficoGauge`) alimentados pela página.
- Direto: `azure-api/soc-analytics.service.ts`.

### `Integrations.tsx` → Azure/LLM + Strapi
- `LLMConfigPanel` → `azure-api/llm.service.ts`
- `SourceConfigModal` → `integrations/source.service.ts`

### `Reports.tsx` → Wazuh + Strapi
- Geração local de PDF. Consome vários serviços Wazuh diretamente: `topagents`, `topagentscis`, `vulnseveridades`, `topsovulnerabilidades`, `topusers`, `overtimeeventos`, `severidade`, + `tenant/tenant` e `reports/report`.

### `ReportDash.tsx` → Strapi
- Direto: `report-entry/report.service.ts` (gerar, listar, deletar).

### `ReportView.tsx` → Strapi
- Direto: `report-entry/report.service.ts` (`buscarRelatorioPorNome`).

### `MultiTenantManager.tsx` → Strapi
- Direto: `multi-tenant/summary.service.ts`.

### `ArchivesIntegrity.tsx`, `ServicesCatalog.tsx`, `ServicesModel.tsx`
- Sem componentes de domínio ou consumo de API identificado.

---

## Parte 3 — Anomalias

### Serviços órfãos (sem consumidores)
- `services/fortsiem.service.ts` — FortiSIEM nunca integrado no frontend.
- `services/iris.service.ts` (raiz) — legado, arquivo vazio.
- `services/multi-tenant/adminmultitenant.service.ts` — substituído por `summary.service.ts`.

### Componentes órfãos (versões reais **não** usadas)
Toda a pasta `componentes/zabbix/Monitoria/*.tsx` (versões não-mock):
`Alertas`, `Ativos`, `FirewallCard`, `LinksWan`, `Roteadores`, `Severidade`, `SwitchesStatus`, `TopFirewallTrafego`, `TopHostsCPU`, `TopSwitchesCPU`, `TopUseCPU`, `VPN`.
`MonitoriaCSC.tsx` importa exclusivamente a pasta `mock/`.

### Página backup
- `pages/MonitoriaCSC-bkp.tsx` — não rota ativa; candidato a remoção.

### Componentes sem API (dados mockados/hardcoded)
- Todos os `componentes/zabbix/Monitoria/mock/*.tsx` (12 componentes) — intencionalmente simulados.
- `LiveAttackCard` (ThreatMap) — dados via WebSocket/context, não REST.

### Serviços com nomes próximos (verificar se são realmente distintos)
- `wazuh/topagents.service.ts` vs `wazuh/topagentscis.ts` — ambos em uso, escopos diferentes (agents vs CIS benchmark).
- `wazuh/topseveridades.service.ts` vs `wazuh/vulnseveridades.service.ts` — contextos distintos (top scores vs distribuição severidade), ambos usados.
- `wazuh/firewalls.service.ts` vs `wazuh/topfirewall.service.ts` — escopos diferentes (eventos vs ranking), ambos usados.
- `zabbix/firewalls.service.ts` alimenta 2 componentes órfãos distintos (`FirewallCard` e `TopFirewallTrafego`).

### Convenção de nomenclatura inconsistente
- A maioria dos serviços segue `*.service.ts`, mas em `services/zabbix/` há arquivos sem o sufixo: `alertas.ts`, `ativos.ts`, `links-wan.ts`, `routers.ts`, `severidade.ts`, `switches-status.ts`, `top-hosts-cpu.ts`, `top-switches-cpu.ts`, `vpn.ts`, `zabbix-config.ts`. Também em `services/wazuh/topagentscis.ts`.

---

## Matriz de impacto (resumo)

| Backend | Serviços ativos | Páginas impactadas | Nível de impacto de migração |
|---|---|---|---|
| **Wazuh** | 24 | RiskLevel, Dashboard, VulnerabilitiesDetection, ThreatMap, MonitoriaSOC, Reports | **Crítico** — núcleo do SOC |
| **Strapi (auth)** | 8 | Login, Config, SideBar | **Crítico** — autenticação |
| **Strapi (tenant/dashboard/storage/reports)** | 12 | Dashboard, MonitoriaSOC, Reports, ReportDash/View, MultiTenant, Integrations, Incidentes | **Alto** |
| **IRIS** | 2 | RiskLevel, Incidentes | **Alto** |
| **Azure / LLM** | 3 | Integrations, SOCAnalytics, Chat (global) | **Médio** |
| **Zabbix** | 11 | MonitoriaCSC (somente via mocks) | **Zero em produção** — apenas mock |
| **FortiSIEM** | 1 | — | **Zero** — órfão |

---

## Tabela Geral — Componente × Serviço × Página

> Visão consolidada, ordenada por página (alfabética). Uma linha por par (componente, página). Componentes usados em múltiplas páginas aparecem múltiplas vezes.

| Componente | Serviço | Página | Backend |
|---|---|---|---|
| _(global)_ ChatWidget / ChatWindow / ChatInput / MessageBubble | `azure-api/chat.service.ts` | (global – layout) | Azure/LLM |
| _(global)_ SideBar | `auth/getUserProfile.service.ts` | (global – layout) | Strapi |
| _(global)_ TenantSelector | `tenant/tenant.service.ts` | (global – layout) | Strapi |
| _(consumo direto)_ | `auth/changePassword.service.ts` | Config | Strapi |
| _(consumo direto)_ | `auth/createUser.service.ts` | Config | Strapi |
| _(consumo direto)_ | `auth/deleteUser.service.ts` | Config | Strapi |
| _(consumo direto)_ | `auth/getUserList.service.ts` | Config | Strapi |
| _(consumo direto)_ | `auth/getUserProfile.service.ts` | Config | Strapi |
| _(consumo direto)_ | `auth/resendInvite.service.ts` | Config | Strapi |
| _(consumo direto)_ | `auth/updateUser.service.ts` | Config | Strapi |
| WidgetConfig / WidgetMenu / WidgetMap | `dashboard/dashboardLayout.service.ts` | Dashboard | Strapi |
| _(consumo direto)_ | `wazuh/risklevel.service.ts` | Dashboard | Wazuh |
| GraficosPainel | `iris/cases.service.ts` (via `useIncidentes`) | Incidentes | IRIS |
| IncidenteTabela | `iris/cases.service.ts` (via `useIncidentes`) | Incidentes | IRIS |
| ModalEditar | `iris/updatecase.service.ts` | Incidentes | IRIS |
| _hook `useIncidentes`_ | `user/userstenant.service.ts` | Incidentes | Strapi |
| LLMConfigPanel | `azure-api/llm.service.ts` | Integrations | Azure/LLM |
| SourceConfigModal | `integrations/source.service.ts` | Integrations | Strapi |
| _(consumo direto)_ | `auth/loginAttemps.service.ts` | Login | Strapi |
| _hook `useZabbixAtivo`_ | `zabbix/zabbix-config.ts` | MonitoriaCSC | Zabbix |
| _(mocks — sem consumo de API real)_ | — | MonitoriaCSC | Zabbix (mock) |
| EdrCard | `wazuh/edr.service.ts` | MonitoriaSOC | Wazuh |
| FirewallCard (Wazuh) | `wazuh/firewalls.service.ts` | MonitoriaSOC | Wazuh |
| ServidoresCard | `wazuh/servidores.service.ts` | MonitoriaSOC | Wazuh |
| _(consumo direto)_ | `storage/storage.service.ts` | MonitoriaSOC | Strapi |
| _(consumo direto)_ | `storage/timeline.service.ts` | MonitoriaSOC | Strapi |
| _(consumo direto)_ | `multi-tenant/summary.service.ts` | MultiTenantManager | Strapi |
| _(consumo direto)_ | `report-entry/report.service.ts` | ReportDash | Strapi |
| _(consumo direto)_ | `report-entry/report.service.ts` | ReportView | Strapi |
| OvertimeCard | `wazuh/overtimeeventos.service.ts` | Reports | Wazuh |
| SeveridadeCard | `wazuh/severidade.service.ts` | Reports | Wazuh |
| TopAgentsCard | `wazuh/topagents.service.ts` | Reports | Wazuh |
| TopAgentsCisCard | `wazuh/topagentscis.ts` | Reports | Wazuh |
| TopOSVulnerabilidadeCard | `wazuh/topsovulnerabilidades.service.ts` | Reports | Wazuh |
| TopUsersCard | `wazuh/topusers.service.ts` | Reports | Wazuh |
| VulnServeridadeCard | `wazuh/vulnseveridades.service.ts` | Reports | Wazuh |
| _(consumo direto)_ | `wazuh/tenant.service.ts` | Reports | Wazuh |
| _(consumo direto)_ | `reports/report.service.ts` | Reports | Strapi |
| DistribuicoesAcoesCard | `wazuh/overtimeeventos.service.ts` | RiskLevel | Wazuh |
| EventosSummaryCard | `wazuh/eventossummary.service.ts` | RiskLevel | Wazuh |
| FirewallDonutCard | `wazuh/topfirewall.service.ts` | RiskLevel | Wazuh |
| FluxoIncidentes | `iris/cases.service.ts` | RiskLevel | IRIS |
| IaHumans | `iris/cases.service.ts` | RiskLevel | IRIS |
| OvertimeCard | `wazuh/overtimeeventos.service.ts` | RiskLevel | Wazuh |
| RuleDistributionCard | `wazuh/ruledistribution.service.ts` | RiskLevel | Wazuh |
| SeveridadeCard | `wazuh/severidade.service.ts` | RiskLevel | Wazuh |
| TopAgentsCard | `wazuh/topagents.service.ts` | RiskLevel | Wazuh |
| TopAgentsCisCard | `wazuh/topagentscis.ts` | RiskLevel | Wazuh |
| TopAgentsDonutCard | `wazuh/topagentesyscheck.service.ts` | RiskLevel | Wazuh |
| TopFirewallCard | `wazuh/topfirewall.service.ts` | RiskLevel | Wazuh |
| TopIncidents | `iris/cases.service.ts` | RiskLevel | IRIS |
| _(consumo direto)_ | `wazuh/risklevel.service.ts` | RiskLevel | Wazuh |
| _(consumo direto)_ | `wazuh/tenant.service.ts` | RiskLevel | Wazuh |
| _(consumo direto)_ | `azure-api/soc-analytics.service.ts` | SOCAnalytics | Azure/LLM |
| ThreatSeverityCard | `wazuh/topcountries-severity.service.ts` | ThreatMap | Wazuh |
| TopAttackCard | `wazuh/mitre-techniques.service.ts` | ThreatMap | Wazuh |
| TopCountriesCard | `wazuh/toppaises.service.ts` | ThreatMap | Wazuh |
| TopCountriesTable | `wazuh/toppaises.service.ts` | ThreatMap | Wazuh |
| TopThreatCard | `wazuh/mitre-techniques.service.ts` | ThreatMap | Wazuh |
| AnoVulnerabilidadeCard | `wazuh/anovulnerabilidades.service.ts` | VulnerabilitiesDetection | Wazuh |
| TopAgenteVulnerabilidadeCard | `wazuh/agentesvulnerabilidades.service.ts` | VulnerabilitiesDetection | Wazuh |
| TopOSGraficoCard | `wazuh/topsovulnerabilidades.service.ts` | VulnerabilitiesDetection | Wazuh |
| TopOSVulnerabilidadeCard | `wazuh/topsovulnerabilidades.service.ts` | VulnerabilitiesDetection | Wazuh |
| TopPackageVulnerabilidadeCard | `wazuh/packagesvulnerabilidades.service.ts` | VulnerabilitiesDetection | Wazuh |
| TopScoreVulnerabilidadeCard | `wazuh/vulntopscores.service.ts` | VulnerabilitiesDetection | Wazuh |
| TopVulnerabilidadeCard | `wazuh/topseveridades.service.ts` | VulnerabilitiesDetection | Wazuh |
| VulnServeridadeCard | `wazuh/vulnseveridades.service.ts` | VulnerabilitiesDetection | Wazuh |
| zabbix/Monitoria/Alertas ⚠órfão | `zabbix/alertas.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/Ativos ⚠órfão | `zabbix/ativos.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/FirewallCard ⚠órfão | `zabbix/firewalls.service.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/LinksWan ⚠órfão | `zabbix/links-wan.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/Roteadores ⚠órfão | `zabbix/routers.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/Severidade ⚠órfão | `zabbix/severidade.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/SwitchesStatus ⚠órfão | `zabbix/switches-status.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/TopFirewallTrafego ⚠órfão | `zabbix/firewalls.service.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/TopHostsCPU ⚠órfão | `zabbix/top-hosts-cpu.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/TopSwitchesCPU ⚠órfão | `zabbix/top-switches-cpu.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/TopUseCPU ⚠órfão | `zabbix/top-hosts-cpu.ts` | — (sem consumo) | Zabbix |
| zabbix/Monitoria/VPN ⚠órfão | `zabbix/vpn.ts` | — (sem consumo) | Zabbix |
| — ⚠órfão | `fortsiem.service.ts` | — (sem consumo) | FortiSIEM |
| — ⚠órfão | `multi-tenant/adminmultitenant.service.ts` | — (sem consumo) | Strapi |
| — ⚠órfão (legado) | `iris.service.ts` (raiz) | — (sem consumo) | IRIS |
