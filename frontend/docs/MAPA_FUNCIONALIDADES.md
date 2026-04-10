# Mapa de Funcionalidades — Hackone SOC Dashboard

> Visao macro → micro do sistema frontend. Atualizado em 2026-04-09 (rev.2 — pos-merge).

---

## 1. Visao Macro — Dominios do Sistema

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       HACKONE SOC DASHBOARD                              │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────┤
│  AUTH &  │DASHBOARD │SEGURANCA │MONITORIA │RELATORIOS│   ADMIN &        │
│   MFA    │ & RISK   │& AMEACAS │& INFRA   │& CATALOG │   CONFIG         │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────────────┘
     │           │          │          │          │           │
  Login       Widgets   Incidentes  SOC/CSC   Reports    Multi-Tenant
  MFA         Risk Map  Vulner.     Zabbix    Services   Usuarios
  Senha       Threat    Integrity   Storage   Catalog    Integracao
              Analytics                                  Chat IA
                                                         Config LLM
```

---

## 2. Modulos Detalhados

### 2.1 Autenticacao e Acesso

| Funcionalidade | Pagina | Rota | Acesso |
|---|---|---|---|
| Login com email/senha | `Login.tsx` | `/login` | Publica |
| CAPTCHA Turnstile (configuravel) | `Login.tsx` | `/login` | Publica |
| Autenticacao MFA (6 digitos) | `MFACode.tsx` | `/verify-code` | Publica |
| Reenvio de codigo MFA | `MFACode.tsx` | `/verify-code` | Publica |
| Esqueci minha senha | `ForgotPassword.tsx` | `/forgot-password` | Publica |
| Redefinicao de senha | `ResetPassword.tsx` | `/reset-password` | Publica |
| Indicador de forca da senha | `ResetPassword.tsx` | `/reset-password` | Publica |

**Controle de acesso (3 niveis):**
- `PublicRoute` — redireciona usuarios autenticados para o dashboard
- `PrivateRoute` — exige token JWT valido
- `AdminRoute` — exige `user_role.slug === "admin"`

**Contextos:** AuthContext (token, user, login/logout, sync entre abas)

---

### 2.2 Dashboard Principal

| Funcionalidade | Componente | Descricao |
|---|---|---|
| Layout de widgets drag-and-drop | `Dashboard.tsx` | Grid 12 colunas com react-grid-layout |
| Adicionar/remover widgets | `WidgetMenuSidebar` | Menu lateral com widgets disponiveis |
| Redimensionar widgets | `Dashboard.tsx` | Min/max constraints por widget |
| Auto-save de layout | `Dashboard.tsx` | Debounce 1000ms, salva no backend |
| Reset para layout padrao | `Dashboard.tsx` | Restaura layout global |
| Selecao de tenant | `TenantSelector` | Dropdown de organizacoes |
| Toggle tema claro/escuro | `LayoutModel` | Persistido localmente |

**Widgets disponiveis (20+):**

| Widget | Tipo | Fonte |
|---|---|---|
| Risk Level Gauge | Gauge | Wazuh |
| Mapa de Ataques (Geo) | Mapa Leaflet | Wazuh |
| Top Paises Atacantes | Tabela/Donut | Wazuh |
| Top Incidentes | Tabela | IRIS |
| IA vs Humanos | Grafico area | IRIS |
| Top Firewalls | Barra | Wazuh |
| Top Hosts/Agentes | Tabela | Wazuh |
| CIS Compliance | Tabela | Wazuh |
| Severidade de Alertas | Donut | Wazuh |
| Fluxo de Incidentes | Timeline | IRIS |
| Severidade Vulnerabilidades | Cards | Wazuh |
| Top Vulnerabilidades | Ranking | Wazuh |

---

### 2.3 Nivel de Risco

**Pagina:** `RiskLevel.tsx` | **Rota:** `/risk-level`

| Funcionalidade | Componente | Descricao |
|---|---|---|
| Gauge de risco (0-100) | `GraficoGauge` | Score geral colorido |
| Cards de severidade | `SeveridadeCard` | Contagem Low/Medium/High/Critical |
| Top agentes por risco | `TopAgentsCard` | Ranking de hosts |
| Top agentes CIS | `TopAgentsCisCard` | Benchmark CIS scores |
| Donut de firewall | `FirewallDonutCard` | Distribuicao de alertas |
| Fluxo de incidentes | `FluxoIncidentes` | Status aberto/atribuido/fechado |
| Filtro por periodo | `DataRangePicker` | 24h, 7d, 15d, 30d + customizado |

---

### 2.4 Mapa de Ameacas (Threat Map)

**Pagina:** `ThreatMap.tsx` | **Rota:** `/threat-map`

| Funcionalidade | Componente | Descricao |
|---|---|---|
| Mapa geo com ataques em tempo real | `GeoHitsMap` | Leaflet com arcos animados |
| Stream de ataques ao vivo | `AttackStreamProvider` | Polling a cada 5s |
| Top tipos de ataque | `TopAttackCard` | Card lateral esquerdo |
| Top ameacas | `TopThreatCard` | Card lateral esquerdo |
| Top paises atacantes | `TopCountriesCard` | Card lateral direito |
| Severidade por ameaca | `ThreatSeverityCard` | Card lateral direito |
| Feed de ataques ao vivo | `LiveAttackCard` | Card inferior central |

---

### 2.5 Incidentes (IRIS)

**Pagina:** `Incidentes.tsx` | **Rota:** `/incidentes`

| Funcionalidade | Componente | Descricao |
|---|---|---|
| Paineis resumo (donuts) | `GraficosPainel` | Abertos/Fechados/Atribuidos/Nao atribuidos |
| Tabela de incidentes | `IncidenteTabela` | Paginacao, ordenacao, busca |
| Filtro por severidade | `IncidenteTabela` | Click nos segmentos do donut |
| Filtro por data | `DataRangePicker` | Periodo customizavel |
| Edicao inline de incidentes | `ModalEditar` | Status, owner, severidade |
| Descricao formatada HTML | `DescricaoFormatada` | Renderizacao rich-text |
| Classificacao IA vs Humano | `IaHumans` | Grafico comparativo temporal |

**Hook:** `useIncidentes` — paginacao, sort, filtros, mapeamento de severidade, sync com URL params

**Servicos IRIS:**
- `getTodosCasos()` — lista todos os casos com filtro de data
- `getCasosRecentes()` — casos recentes por range
- `updateCasoIris()` — atualiza status/severidade/owner/notas

---

### 2.6 Deteccao de Vulnerabilidades

**Pagina:** `VulnerabilitiesDetection.tsx` | **Rota:** `/vulnerabilities-detections`

| Funcionalidade | Componente | Descricao |
|---|---|---|
| Filtro por agente | `AgentSelectFilter` | Dropdown com busca |
| Severidade de CVEs | `VulnSeveridadeCard` | Distribuicao por nivel |
| Top vulnerabilidades | `TopVulnerabilidadeCard` | Ranking das mais criticas |
| Top SOs afetados | `TopOSVulnerabilidadeCard` | Sistemas operacionais |
| Top agentes vulneraveis | `TopAgenteVulnerabilidadeCard` | Hosts com mais CVEs |
| Top pacotes vulneraveis | `TopPackageVulnerabilidadeCard` | Bibliotecas/pacotes |
| Top CVSS scores | `TopScoreVulnerabilidadeCard` | Distribuicao de scores |
| Vulnerabilidades por ano | `AnoVulnerabilidadeCard` | Tendencia temporal |
| Grafico por SO | `TopOSGraficoCard` | Visualizacao grafica |
| Atualizar todos os cards | Botao global | Refresh em lote |

**Servicos Wazuh (vulnerabilidades):**
- `getTopAgentesVulnerabilidades()` — top agentes
- `getTopOSVulnerabilidades()` — top SOs
- `getTopPackagesVulnerabilidades()` — top pacotes
- `getTopScoresVulnerabilidades()` — top CVSS
- `getTopVulnerabilidades()` — top por severidade
- `getAnoVulnerabilidades()` — por ano de publicacao
- `getVulnSeveridades()` — agregacao de severidade

---

### 2.7 Integridade de Arquivos

**Pagina:** `ArchivesIntegrity.tsx` | **Rota:** `/archives-integrity`

| Funcionalidade | Componente | Descricao |
|---|---|---|
| Alertas ao longo do tempo | `OvertimeCard` | Time-series chart |
| Top 5 hosts modificados | `TopAgentsDonutCard` | Donut chart |
| Resumo de eventos | `EventosSummaryCard` | Tabela por tipo |
| Distribuicao de regras | `RuleDistributionCard` | Donut chart |
| Distribuicao de acoes | `DistribuicaoAcoesCard` | Deleted/Modified/Added |
| Top 5 usuarios | `TopUsersCard` | Por atividade |
| Filtro rapido | Botoes periodo | 24h/7d/30d + custom |

---

### 2.8 Monitoria NG-SOC

**Pagina:** `MonitoriaSOC.tsx` | **Rota:** `/monitoria-ngsoc`

| Funcionalidade | Componente | Descricao |
|---|---|---|
| Grafico de volume (30d) | `GraficoVolume` | Tendencia de coleta |
| Status de storage | Badges | Usado/Disponivel/Contratado |
| Delecoes recentes | Cards | Top 3 purges com datas |
| Metricas de firewall | `FirewallCard` | Status e contagens |
| Status de servidores | `ServidoresCard` | Hosts monitorados |
| Status de EDR | `EdrCard` | Endpoint Detection |
| Tabela de coletores | Tabela | Origem, status, ultimo log |

**Servicos Storage:**
- `getStorageState()` — metricas atuais
- `getStorageInternal()` — detalhes internos
- `getStorageTimeline()` — historico diario

---

### 2.9 Monitoria CSC (Zabbix)

**Pagina:** `MonitoriaCSC.tsx` | **Rota:** `/monitoria-csc`

| Funcionalidade | Componente | Descricao |
|---|---|---|
| Dispositivos ativos | `Ativos` | Por grupo de host |
| Status de firewall | `FirewallCard` | RAM, CPU, trafego |
| Problemas por severidade | `Severidade` | Donut chart |
| Top switches por CPU | `TopSwitchesCPU` | Ranking |
| Top hosts por CPU | `TopHostsCPU` | Ranking |
| Trafego de firewall | `TopFirewallTrafego` | Metricas de trafego |
| Status de switches | `SwitchesStatus` | Online/Offline |
| Status de VPN | `VPN` | Tuneis ativos |
| Top hosts geral | `TopUseCPU` | Distribuicao CPU |
| Links WAN | `LinksWan` | Status e uso |
| Roteadores | `Roteadores` | CPU e status |
| Alertas Zabbix | `Alertas` | Tabela de alertas ativos |

**Validacao:** `useZabbixAtivo()` — verifica se integracao Zabbix esta ativa para o tenant

**Servicos Zabbix (12):**
- `getZabbixAlertas()`, `getZabbixAtivos()`, `getZabbixFirewalls()`
- `getZabbixLinksWan()`, `getZabbixRouters()`, `getZabbixSeveridade()`
- `getZabbixSwitchesStatus()`, `getTopHostsCPU()`, `getTopSwitchesCPU()`
- `getZabbixVpn()`, `getZabbixAtivo()`

---

### 2.10 SOC Analytics

**Pagina:** `SOCAnalytics.tsx` | **Rota:** `/soc-analytics`

| Funcionalidade | Componente | Descricao |
|---|---|---|
| MTTD (Mean Time To Detect) | MetricCard | Tempo medio em minutos |
| MTTA (Mean Time To Acknowledge) | MetricCard | Tempo de reconhecimento |
| MTTR (Mean Time To Resolve) | MetricCard | Tempo de resolucao |
| Incidentes abertos | MetricCard | Com badge de alerta |
| Gauge de risco | `GraficoGauge` | Nivel atual |
| Historico por severidade | `GraficoDonutSimples` | Critical/High/Medium/Low |
| Performance de IA | Barras de progresso | Triagem automatica %, tempo medio IA, escalacao % |
| Alertas por severidade | Mini bar charts | 4 colunas com breakdown |
| Filtro por periodo | Seletor | Semana/Mes/Trimestre/Ano |
| Banner de erro com retry | ErrorBanner | Tratamento de falhas |

---

### 2.11 Relatorios

| Funcionalidade | Pagina | Rota |
|---|---|---|
| Dashboard de relatorios | `ReportDash.tsx` | `/relatorios` |
| Geracao de relatorio | `Reports.tsx` | `/relatorios` |
| Visualizacao de relatorio | `ReportView.tsx` | `/relatorios/report-view` |

**Secoes disponiveis para relatorio (15):**
- Top URLs, Usuarios, Aplicacoes, Categorias
- Volume por Aplicacao/Usuario
- Nivel de Risco, Vulnerabilidades, Alertas de Host
- Deteccao de SO, Mudancas de Arquivo, Acoes de Usuario
- Incidentes

**Funcionalidades:**

| Funcionalidade | Descricao |
|---|---|
| Selecao de periodo | 5d/15d/30d |
| Multi-selecao de secoes | 15 secoes com busca |
| Barra de progresso | Acompanhamento da geracao |
| Listagem paginada | 10 itens/pagina |
| Visualizacao com toggle | Mostra/oculta secoes |
| Exportacao/Download | Por secao individual |
| Exclusao com confirmacao | SweetAlert dialog |

**Servicos:**
- `gerarRelatorio()` — gera novo relatorio
- `listarRelatorios()` — lista paginada
- `buscarRelatorioPorNome()` — busca por nome
- `deletarRelatorio()` — exclui relatorio

---

### 2.12 Catalogo de Servicos

| Funcionalidade | Pagina | Rota |
|---|---|---|
| Grid de servicos | `ServicesCatalog.tsx` | `/services-catalog` |
| Detalhe do servico | `ServicesModel.tsx` | `/service/:nome` |

**Servicos listados (6):**
1. Trafego Seguro & Controle de Acesso
2. Defesa de Endpoint (EDR/XDR)
3. Identidade & Acesso (IAM)
4. Vulnerabilidades
5. Protecao Web (WAF/WAAP)
6. Protecao de Dados

**Funcionalidades:**
- Cards com icone, titulo, descricao, metricas
- Pagina de detalhe com metricas e graficos
- Agendamento via Calendly (botao de booking)

---

### 2.13 Administracao e Configuracao

#### Config (Perfil e Usuarios)

**Pagina:** `Config.tsx` | **Rota:** `/config`

| Funcionalidade | Aba | Acesso |
|---|---|---|
| Alterar senha | Perfil | Todos os usuarios |
| Listar usuarios | Usuarios | Somente admin |
| Criar usuario | Usuarios | Somente admin |
| Editar usuario | Usuarios | Somente admin |
| Deletar usuario | Usuarios | Somente admin |
| Reenviar convite | Usuarios | Somente admin |
| Status de usuario | Usuarios | Ativo/Bloqueado/Convite em andamento |

#### Multi-Tenant Manager

**Pagina:** `MultiTenantManager.tsx` | **Rota:** `/multitenant-manager` | **Acesso:** Admin

| Funcionalidade | Descricao |
|---|---|
| Visao geral de tenants | Cards com metricas por organizacao |
| Score de risco por tenant | Colorido (green/blue/purple/pink) |
| Incidentes criticos | Contagem por tenant |
| Ativos ativos | Total por tenant |
| Volume de storage (GB) | Por tenant |
| Total de logs | Por tenant |
| Grid configuravel | Modal para toggle de metricas visiveis |
| Carousel de tenants | Swiper com navegacao |

---

### 2.14 Integracoes

**Pagina:** `Integrations.tsx` | **Rota:** `/integrations` (condicional via `VITE_ENABLE_INTEGRATIONS`)

| Categoria | Status | Plataformas |
|---|---|---|
| NG-SOC | Desbloqueado | SIEM: Wazuh, FortiSIEM, Splunk |
| | | SOAR: FortiSOAR, n8n, Shuffle |
| | | DFIR: IRIS, ServiceNow, Freshdesk |
| | | AI: OpenAI, DeepSeek, Gemini, Copilot |
| Firewall | Desbloqueado | Vendors de firewall |
| Monitoria | Desbloqueado | Zabbix e outros |
| EDR/XDR | Desbloqueado | Endpoint vendors |
| Protecao de Dados | Bloqueado | — |
| CSIRT | Bloqueado | — |
| Vulnerabilidades | Bloqueado | — |
| IAM | Bloqueado | — |

#### Configuracao de Provedor LLM (novo)

**Componente:** `LLMConfigPanel` (painel slide-out)

| Funcionalidade | Descricao |
|---|---|
| Selecao de provedor | OpenAI (0), Azure Foundry (1), DeepSeek (2), Claude (3), Gemini (4) |
| Validacao de API key | Testa chave contra o provedor selecionado |
| Listagem de modelos | Carrega modelos disponiveis do provedor |
| Salvamento de config | Provider, model, API key, endpoint, system prompt |
| Retorno de clientId | Usado para vincular chat ao provedor configurado |

**Servico:** `llm.service.ts`
- `validateApiKey()` — valida chave do provedor
- `getAvailableModels()` — lista modelos disponiveis
- `saveLLMConfig()` — salva config no backend Customers API

---

### 2.15 Chat IA

**Componentes:** `ChatWidget`, `ChatWindow`, `ChatInput`, `MessageBubble`, `LLMConfigPanel`

| Funcionalidade | Descricao |
|---|---|
| Botao flutuante | Presente em todas as paginas autenticadas |
| Janela de chat | Interface de mensagens com historico e auto-scroll |
| Persistencia de sessao | Historico salvo no backend por sessionId |
| Contexto de pagina | Envia tela atual (page, entity, metadata) para contexto da IA |
| Streaming de respostas | Respostas em tempo real |
| Input multiline | Shift+Enter para quebra de linha, auto-resize |
| Avatares user/assistant | Identificacao visual por bolha |

**Hook:** `useChat` — estado de mensagens, envio, historico, sessao, erros

**Servicos:**
- `sendChatMessage()` — envia mensagem com contexto (clientId fixo)
- `getChatHistory()` — historico paginado por sessao

---

## 3. Arquitetura de Backend (APIs)

> **IMPORTANTE:** O backend NAO e centralizado em um unico Strapi.
> O frontend consome **5 backends distintos** hospedados no Azure.

```
Frontend (React)
     │
     ├──▶ [1] STRAPI (VITE_API_URL)
     │    api-hackone-strapi.azurewebsites.net
     │    ├── Auth (login, MFA, users, password)     /api/auth/*  /api/acesso/user/*
     │    ├── Wazuh proxy (23 endpoints)              /api/acesso/wazuh/*
     │    ├── IRIS proxy (3 endpoints)                /api/acesso/iris/*
     │    ├── Zabbix proxy (12 endpoints)             /api/acesso/zabbix/*
     │    ├── Storage (3 endpoints)                   /api/storage/*
     │    ├── Dashboard layout                        /api/custom-dashboards/*
     │    ├── Reports (4 endpoints)                   /api/report-entry/*
     │    ├── Multi-tenant admin                      /api/admin/multitenant/*
     │    └── Tenant management                       /api/acesso/user/tenants
     │
     ├──▶ [2] TICKETS / SOC ANALYTICS (VITE_API_BASE_URL)
     │    api-hackone-tickets.azurewebsites.net
     │    └── SOC KPIs (MTTD/MTTA/MTTR)              /api/analytics/soc
     │
     ├──▶ [3] CHAT API (VITE_CHAT_API_URL)
     │    api-hackone-chat.azurewebsites.net
     │    ├── Envio de mensagens                      POST /api/chat
     │    ├── Historico de chat                        GET /api/chat/sessions/*/history
     │    ├── Validacao de API key LLM                POST /api/llm/validate
     │    └── Listagem de modelos LLM                 GET /api/llm/models
     │
     ├──▶ [4] CUSTOMERS API (VITE_CUSTOMERS_API_URL)
     │    api-hackone-customers.azurewebsites.net
     │    └── Salvamento de config LLM                POST /api/customers/llm-config
     │
     └──▶ [5] FORTISIEM (hardcoded, legado)
          148.230.50.68:14006
          └── Event query (HTTPS direto)              POST /phoenix/rest/query/eventQuery
```

**Total de backends: 5** | **Total de endpoints consumidos: ~60+**

---

## 4. Variaveis de Ambiente

| Variavel | Tipo | Valor/Descricao |
|---|---|---|
| `VITE_API_URL` | URL Backend | Strapi principal (auth, wazuh, iris, zabbix, storage, reports) |
| `VITE_API_BASE_URL` | URL Backend | Tickets/SOC Analytics API |
| `VITE_CHAT_API_URL` | URL Backend | Chat API + validacao LLM |
| `VITE_CUSTOMERS_API_URL` | URL Backend | Customers API (config LLM) |
| `VITE_TURNSTILE_SITE_KEY` | Chave | Cloudflare Turnstile CAPTCHA |
| `VITE_ENABLE_TURNSTILE` | Feature flag | Habilita CAPTCHA no login |
| `VITE_ENABLE_INTEGRATIONS` | Feature flag | Habilita pagina de integracoes |
| `VITE_ENABLE_CONFIG` | Feature flag | Habilita funcionalidades de config |
| `VITE_WHATSAPP_SUPPORT` | URL | Link de suporte WhatsApp |

**Clientes HTTP:**
- `apiFetch()` (wrapper nativo fetch) — usado pela maioria dos servicos, base `VITE_API_URL`
- `axios` — usado por FortiSIEM (legado) e alguns servicos isolados

---

## 5. Biblioteca de Graficos

| Tipo | Componente | Uso |
|---|---|---|
| Donut | `GraficoDonut`, `GraficoDonutSimples`, `GraficoDonutIncidentes`, `GraficoDonutLimpo` | Distribuicoes |
| Linha | `GraficoLinha` | Series temporais |
| Area | `GraficoAreaSimples`, `GraficoAreaSpline`, `GraficoAreaStacked` | Tendencias |
| Barra | `GraficoBarraHorizontal`, `GraficoBarraEmpilhadaHorizontal`, `GraficoBarrasEmpilhadas`, `GraficoBarrasEmpilahdasMes` | Comparacoes |
| Gauge | `GraficoGauge`, `GraficoRadialMultiplo` | Indicadores |
| Volume | `GraficoVolume` | Capacidade |
| Stacked | `GraficoStackedBarChart` | Multi-series |
| Mapa vetor | `MapaIncidentes` | Paises (SVG) |
| Mapa geo | `GeoHitsMap` | Ataques ao vivo (Leaflet) |

---

## 6. Componentes Compartilhados

| Componente | Funcao |
|---|---|
| `LayoutModel` | Layout principal (sidebar + header + conteudo) |
| `SideBar` | Menu lateral colapsavel |
| `TenantSelector` | Seletor de organizacao |
| `DataRangePicker` | Seletor de periodo |
| `AgentSelectFilter` | Filtro de agentes com busca |
| `Modal` | Modal generico reutilizavel |
| `Contador` | Animacao de contagem numerica |
| `Swiper` | Carousel de cards |
| `TooltipRight` | Tooltip com indicador de status |

---

## 7. Contextos e Estado Global

| Contexto | Responsabilidade |
|---|---|
| `AuthContext` | JWT, user data, login/logout, sync entre abas |
| `TenantContext` | Tenant ativo, lista de tenants, troca de tenant |
| `AttackStreamProvider` | Stream de ataques em tempo real (polling 5s), dedup, animacao |

---

## 8. Resumo Numerico

| Metrica | Quantidade |
|---|---|
| Paginas | 21 |
| Componentes (total) | ~85+ |
| Servicos (arquivos) | 59 |
| Backends distintos | 5 |
| Endpoints consumidos | ~60+ |
| Graficos distintos | 18 |
| Widgets de dashboard | 20+ |
| Rotas publicas | 4 |
| Rotas privadas | 15 |
| Rotas admin | 1 |
| Contextos React | 3 |
| Hooks customizados | 3 (useIncidentes, useChat, useZabbixAtivo) |
| Variaveis de ambiente | 9 (4 URLs, 1 chave, 3 flags, 1 link) |
| Integracoes externas | Wazuh, IRIS, Zabbix, Azure AI (Chat + LLM), Fortinet |
| Provedores LLM suportados | 5 (OpenAI, Azure Foundry, DeepSeek, Claude, Gemini) |
