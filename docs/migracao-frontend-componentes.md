# Migração Frontend — Detalhamento por Tela

> Documento complementar a [`mapeamento-componentes-apis.md`](./mapeamento-componentes-apis.md).
> Para cada tela: layout visual, props × estado × dependências de cada componente,
> contratos de dados necessários para substituir as chamadas diretas ao Wazuh/IRIS.
> Data: 2026-05-13.

---

## 1. ThreatMap.tsx

### 1.1 Layout visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LayoutModel (header global)                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐                              ┌──────────────────────┐  │
│ │ TopAttackCard    │                              │ TopCountriesCard     │  │
│ │ (MITRE techniques│        GeoHitsMap            │ (Top países, total)  │  │
│ │  — top N)        │        (mapa mundi,          │                      │  │
│ ├──────────────────┤         linhas origem→destino│──────────────────────┤  │
│ │ TopThreatCard    │         alimentado pelo      │ ThreatSeverityCard   │  │
│ │ (MITRE tactics — │         AttackStream)        │ (top países com      │  │
│ │  top N)          │                              │  breakdown severid.) │  │
│ └──────────────────┘                              └──────────────────────┘  │
│                       ┌──────────────────────────────┐                      │
│                       │ LiveAttackCard               │                      │
│                       │ (feed em tempo real do       │                      │
│                       │  AttackStreamProvider, 5s)   │                      │
│                       └──────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Endpoints atuais (Wazuh)

| Componente | Endpoint | Params | Payload essencial |
|---|---|---|---|
| `TopAttackCard` | `GET /api/acesso/wazuh/mitre-techniques` | `dias` | `{ topMitreTechniques: [{ tecnica, total, percentual }] }` |
| `TopThreatCard` | mesmo acima | `dias` | `{ topMitreTactics: [{ tatica, total, percentual }] }` |
| `TopCountriesCard` | `GET /api/acesso/wazuh/top-paises` | `dias` | `{ topPaises: [{ pais, total, severidades?: [{ key, doc_count }] }] }` |
| `ThreatSeverityCard` | mesmo acima | `dias`, `size` | usa `severidades[]` agregado em `{low, medium, high, critical}` |
| `GeoHitsMap` | consome `useAttackStream` | — | `AttackEvent[]` (do provider) |
| `LiveAttackCard` | consome `useAttackStream` | — | `AttackEvent[]` (do provider) |
| `AttackStreamProvider` | `GET /api/acesso/wazuh/top-paises-geo` | `range=30s` (poll 5s) | `{ flows: LiveAttackItem[] }` |

### 1.3 Props × Estado × Dependências

#### `TopAttackCard`
**Props**: `titulo?` (default `"Top Ataques"`), `dias?` (default `"1"`), `onDadosCarregados?`.
**Estado**: `items: MitreItem[]`, `loading`, `erro`.
**Constantes**: `LIMIT=5`, `MIN_BAR_PCT=6`.
**Reage a**: `[tenantAtivo, dias]`.
**Service**: `getMitreTechniquesAndTactics(dias)` — usa **somente** `data.techniques`.

#### `TopThreatCard`
**Props**: `className?`, `dias?` (default `"1"`).
**Estado**: `dados: TacticItem[]`, `loading`, `erro`.
**Derivado**: `top5 = sort(total desc).slice(0,5)` → `labels[]` + `series[]` p/ `GraficoDonutSimples`.
**Cores fixas**: `["#EC4899","#8B5CF6","#F59E0B","#38BDF8","#22C55E"]`.
**Reage a**: `[tenantAtivo, dias]`.
**Service**: `getMitreTechniquesAndTactics(dias)` — usa **somente** `data.tactics`.

#### `TopCountriesCard`
**Props**: `titulo?`, `onDadosCarregados?`.
**Estado**: `dias` (local, default `"1"`), `items`, `loading`, `erro`.
**Helpers**: `guessCountryCode` → bandeira via `flagcdn.com`.
**Reage a**: `[dias, tenantAtivo]`.
**Service**: `getTopPaises(dias)`.

#### `ThreatSeverityCard`
**Props**: `className?`, `dias?` (default `"1"`, página passa `"todos"`), `topN?` (default `5`).
**Estado**: `loading`, `erro`, `totais: {critical, high, medium, low, total}`.
**Lógica**: agregação roda no front (reduce de `severidades` dos `topN` países).
**Reage a**: `[dias, topN, tenantAtivo]`.
**Service**: `getTopCountriesWithSeverity(dias, topN)` (que também bate em `/wazuh/top-paises`).

#### `LiveAttackCard`
**Props**: `className?`.
**Estado**: `ataques`, `offsetY`, `animando`, `primeiraCarga: useRef`.
**Constantes**: `VISIBLE_COUNT=5`, `BUFFER=1`, `ROW_HEIGHT=36px`, `TICK_MS=20ms`.
**Fonte**: `useAttackStream()` (`newEvents`, `ready`) — sem fetch próprio.

#### `GeoHitsMap`
**Props**: `height?` (página passa `"100%"`).
**Estado**: `nowTick` (recalc 1s), `activeEvents` (TTL 8s), `flows` (arcos Bézier).
**Constantes**: `MAX_FLOWS=120`, `MAP_LIFETIME_MS=8000`.
**Fonte**: `useAttackStream()` (`events`).

#### `AttackStreamProvider` (contexto)
**Estado**: `events` (buffer 300), `newEvents` (delta), `ready`, `seenRef: Set<string>`.
**Polling**: `setInterval 5000ms` → `getTopPaisesGeoRange("30s")`.
**Filtros**: lat/lng obrigatórios; origem ≠ destino; `rule.mitre.technique` ou `rule.description` obrigatório; dedup por `${ruleKey}-${origem.ip}-${destino.ip}-${destino.devname}`.
**Reage a**: `[tenantAtivo]`.

### 1.4 Quadro consolidado

| Componente | Props externas | Estados internos | Reage a |
|---|---|---|---|
| `TopAttackCard` | `titulo`, `dias`, `onDadosCarregados` | `items`, `loading`, `erro` | `tenantAtivo`, `dias` |
| `TopThreatCard` | `className`, `dias` | `dados`, `loading`, `erro` | `tenantAtivo`, `dias` |
| `TopCountriesCard` | `titulo`, `onDadosCarregados` | `dias`, `items`, `loading`, `erro` | `tenantAtivo`, `dias` (local) |
| `ThreatSeverityCard` | `className`, `dias`, `topN` | `totais`, `loading`, `erro` | `tenantAtivo`, `dias`, `topN` |
| `LiveAttackCard` | `className` | `ataques`, `offsetY`, `animando` | `newEvents`, `ready` |
| `GeoHitsMap` | `height` | `nowTick`, `activeEvents`, `flows` | `events`, tick 1s |
| `AttackStreamProvider` | — | `events`, `newEvents`, `ready`, `seenRef` | `tenantAtivo` |

### 1.5 Contratos para o novo backend

```ts
// GET /threatmap/mitre?dias=7
{ topMitreTechniques: [{ tecnica: string; total: number; percentual: number }],
  topMitreTactics:    [{ tatica:  string; total: number; percentual: number }] }

// GET /threatmap/top-paises?dias=30
{ topPaises: [{ pais: string; total: number;
    severidades: [{ key: "low"|"medium"|"high"|"critical"; doc_count: number }] }] }

// GET /threatmap/geo-flows?range=30s | ?dias=todos
{ flows: [{
    rule: { mitre?: { technique?: string|string[] }, description?: string },
    origem:  { ip: string; pais: string; city?: string; lat: number; lng: number },
    destino: { ip: string; pais: string; city?: string; devname?: string; lat: number; lng: number }
  }] }
```

### 1.6 Pontos de atenção

1. **Padronizar parâmetro temporal**: hoje convive `dias=1|7|30|todos` e `range=30s` — unificar (`24h`/`7d`/`30d`/`all`).
2. **Duplicação de chamadas**:
   - `TopAttackCard` + `TopThreatCard` chamam o mesmo `/mitre-techniques`.
   - `TopCountriesCard` + `ThreatSeverityCard` chamam o mesmo `/top-paises`.
   → considerar hook compartilhado (`useMitreData`, `useTopPaisesData`).
3. **Stream frágil**: depende de `lat/lng` + `rule` + `devname` no payload. Sem isso, esvazia silenciosamente.
4. **Callbacks `onDadosCarregados`** alimentam `setScreenData("threat-map", …)` — usado pelo chat/IA. Preservar.

---

## 2. RiskLevel.tsx

### 2.1 Layout visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LayoutModel (header global)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                            ┌─[ DateRangePicker ]─[Limpar]─┐ │
│                                                                             │
│ ┌─[ Nível de alertas ]─────────────────────────────[ XX alertas totais ]─┐ │
│                                                                             │
│ ┌────────────┐ ┌────────────────────────────────────────────────────────┐  │
│ │ GraficoG.  │ │ SeveridadeCard                                         │  │
│ │ (gauge     │ │  Crítico  |  Alto  |  Médio  |  Baixo                  │  │
│ │  indiceRisc)│ │  (4 cards com valores e barras de slot)                │  │
│ └────────────┘ └────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │
│ │ TopAgentsCard    │ │ TopAgentsCisCard │ │ FirewallDonutCard            │ │
│ │ (tabela hosts ×  │ │ (auditoria CIS — │ ├──────────────────────────────┤ │
│ │  severidade)     │ │  score por host) │ │ FluxoIncidentes (IRIS)       │ │
│ │                  │ │                  │ │ (gráfico área spline +       │ │
│ │                  │ │                  │ │  abertos/atribuídos)         │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────────────────┘ │
│                                                                             │
│ [ DebugPanel (oculto; habilita via __debugRL() no console) ]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Endpoints atuais (Wazuh + IRIS)

| Componente | Endpoint | Params | Payload essencial |
|---|---|---|---|
| `RiskLevel.tsx` (direto) | `GET /api/acesso/wazuh/riskLevel` | `dias` **ou** `from`+`to` | `{ severidades:{baixo,medio,alto,critico,total}, indiceRisco, _debug, dataAvailability, filtrosUsados }` |
| `SeveridadeCard` | — (recebe `severidades` via props) | — | — |
| `TopAgentsCard` | `GET /api/acesso/wazuh/top-agentes` | `dias` **ou** `from`+`to` | `{ topAgentes: [{ agente, total_alertas, score, severidades:[{key,doc_count}], modified, added, deleted }] }` |
| `TopAgentsCisCard` | `GET /api/acesso/wazuh/top-agentes-cis` | `dias` **ou** `from`+`to` | `{ topAgentesCis: [{ agente, total_eventos, media_score, score_cis_percent }] }` |
| `FirewallDonutCard` | `GET /api/acesso/wazuh/top-geradores` | `dias` **ou** `from`+`to` | `{ topGeradores: [{ gerador, ip, timestamp, total, severidade:{baixo,medio,alto,critico} }] }` |
| `FluxoIncidentes` | `GET /api/acesso/iris/manage/cases/list` | — (filtro feito no front por `client_name` + datas) | `Incidente[]` (case_id, case_name, case_open_date, case_initial_date, state_name, owner, client_name) |
| `DebugPanel` | — (recebe `RLDebugData` via props) | — | — |

### 2.3 Filtros globais da página

A página mantém dois filtros mutuamente exclusivos:

- **`dias: string`** — janela canônica (`"1"`, `"7"`, `"15"`, `"30"`); default `"1"`.
- **`periodo: {from, to} | null`** — range customizado do calendário (`DateRangePicker`).

**Handler** `handleFiltro(payload)`:
- Se `payload.dias` → seta `dias`, limpa `periodo`.
- Senão → seta `periodo`, força `dias="1"` (fallback para o baseline do `riskLevel`).

Reset: `setDias("1"); setPeriodo(null); setResetFiltroKey(v=>v+1)`.

### 2.4 Props × Estado × Dependências

#### `RiskLevel` (página)
**Estado**:
- Filtros: `dias`, `periodo`, `resetFiltroKey`.
- Dados: `severidades`, `indiceRisco`, `totalIncidentes`, `firewallDados`, `topAgentes`, `topAgentesCis`.
- UI: `loadingSeveridade`, `debugData`.
**Reage a**: `[tenantAtivo, dias, periodo, token]` — refetch global do `riskLevel`.
**ScreenContext**: alimenta `setScreenData("risk-level", …)` com totais, %, top hosts (consumido pelo chat).

#### `SeveridadeCard`
**Props**: `dados: {baixo,medio,alto,critico,total}` (obrigatório), `loading?`, `periodo?`, `isWidget?`, `disabled?`.
**Sem estado próprio**. Apenas computa `ratio` + `slots` (10) com easing `pow(ratio, 1/3)` para barra visual.
**Cores fixas** por nível.

#### `TopAgentsCard`
**Props**: `dias: string` (obrigatório), `periodo?`, `isWidget?`, `onDadosCarregados?`.
**Estado**: `agentes: TopAgentItem[]`, `carregando`, `erro`, `animReady`.
**Comportamento**: delay mínimo de 500ms (`Math.max(500-elapsed,0)`) antes de mostrar dados.
**Callback**: emite até 10 itens `{nome, totalAlertas}` para a página.
**Reage a**: `[dias, periodo, tenantAtivo]`.
**Service**: `getTopAgents({from,to} | {dias})`.

#### `TopAgentsCisCard`
**Props**: `dias: string`, `periodo?`, `isWidget?`, `onDadosCarregados?`.
**Estado**: `itens: TopAgentCisItem[]`, `carregando`, `erro`, `animReady`.
**Derivado**: `lista = sort(score_cis_percent desc).slice(0,15)`.
**Cores por faixa**: `<30` rosa, `<40` roxo, `≤75` azul, `>75` verde.
**Callback**: emite até 10 `{nome, scoreCis}`.
**Reage a**: `[dias, periodo, tenantAtivo]`.
**Service**: `getTopAgentsCis(dias?, periodo?)`.

#### `FirewallDonutCard`
**Props**: `dias: string`, `periodo?`, `isWidget?`, `onDadosCarregados?`.
**Estado**: `dados: TopFirewallItem[]`, `carregando`, `erro`, `idxSelecionado` (legenda clicável).
**Derivado** (`useMemo`): agregação `{baixo, medio, alto, critico, total}` somando severidades dos firewalls.
**Callback**: emite `FirewallDonutSummary` após carga.
**Reage a**: `[dias, periodo, tenantAtivo]`.
**Service**: `getTopFirewalls(dias, periodo?)`.

#### `FluxoIncidentes` (IRIS)
**Props**: `token: string`, `diasGlobal?`, `periodo?`, `onUpdateTotais?`, `isWidget?`.
**Estado**: `series`, `categoriasX`, `totalAbertos`, `totalAtribuidos`, `totalCasos`, `carregando`, `erro`.
**Lógica crítica** (toda no front!):
1. Busca **todos** os casos (`getTodosCasos(token)`).
2. Filtra por `client_name === tenantAtivo.cliente_name`.
3. Aplica janela: prioriza `case_initial_date` (UTC, comparação exata); fallback `case_open_date` (`MM/DD/YYYY`, comparação por dia).
4. Conta `Open` → `totalAbertos`; `owner === tenantAtivo.owner_name` → `totalAtribuidos`.
5. Agrupa por dia (`agruparPorDia`) → série temporal com 2 linhas (Abertos / Atribuídos).
**Reage a**: `[token, diasEfetivo, periodo, tenantAtivo]`.
**Service**: `getTodosCasos(token)` → `GET /api/acesso/iris/manage/cases/list`.

#### `DebugPanel`
**Props**: `data: RLDebugData | null`.
**Estado**: `visivel` (lido de `localStorage('__rlDebug')`), `minimizado`.
**Ativação**: `window.__debugRL()` no console.
**Conteúdo**: mostra `filtrosUsados`, `dataAvailability`, breakdown por card (`raw`/`baseline`/`risco`), warmup status — usa o sub-objeto `_debug` retornado pelo backend.

### 2.5 Quadro consolidado

| Componente | Props obrigatórias | Estados internos | Reage a |
|---|---|---|---|
| `RiskLevel` (página) | — | `dias`, `periodo`, `severidades`, `indiceRisco`, `totalIncidentes`, `firewallDados`, `topAgentes`, `topAgentesCis`, `debugData` | `tenantAtivo`, `dias`, `periodo`, `token` |
| `SeveridadeCard` | `dados` | — (puramente apresentacional) | — |
| `TopAgentsCard` | `dias` | `agentes`, `carregando`, `erro`, `animReady` | `dias`, `periodo`, `tenantAtivo` |
| `TopAgentsCisCard` | `dias` | `itens`, `carregando`, `erro`, `animReady` | `dias`, `periodo`, `tenantAtivo` |
| `FirewallDonutCard` | `dias` | `dados`, `carregando`, `erro`, `idxSelecionado` | `dias`, `periodo`, `tenantAtivo` |
| `FluxoIncidentes` | `token` | `series`, `categoriasX`, totais, `carregando`, `erro` | `token`, `diasGlobal`, `periodo`, `tenantAtivo` |
| `DebugPanel` | `data` | `visivel`, `minimizado` | `localStorage('__rlDebug')` |

### 2.6 Contratos para o novo backend

```ts
// GET /risklevel?dias=7  | ?from=...&to=...
{
  severidades: { baixo: number; medio: number; alto: number; critico: number; total: number },
  indiceRisco: number,                  // 0–100 (gauge)
  filtrosUsados?: any,                  // ecoa o filtro efetivo (para o DebugPanel)
  dataAvailability?: {                  // status por card: "ok" | "warmup" | "missing"
    topHosts: string; cis: string; firewall: string; iris: string
  },
  _debug?: {
    janela: string; warmup: boolean;
    cards: {
      topHosts:   { raw, baseline, risco },
      cis:        { raw, baseline, risco },
      firewall:   { raw, baseline, risco },
      incidents:  { raw, baseline, risco }
    }
  }
}

// GET /top-agentes?dias=7  | ?from=...&to=...
{ topAgentes: [{
    agente: string, total_alertas: number, score: number,  // 0–100
    severidades: [{ key: string /* "0".."15" */, doc_count: number }],
    modified: number, added: number, deleted: number
  }] }

// GET /top-agentes-cis?dias=7  | ?from=...&to=...
{ topAgentesCis: [{
    agente: string, total_eventos: number,
    media_score: number, score_cis_percent: number  // 0–100
  }] }

// GET /top-geradores?dias=7  | ?from=...&to=...   (firewall)
{ topGeradores: [{
    gerador: string, ip: string|null, timestamp: string|null,
    total: number,
    severidade: { baixo: number; medio: number; alto: number; critico: number }
  }] }

// GET /iris/cases  (IRIS — preferível NOVO endpoint paginado + filtrado server-side)
[{
  case_id: number, case_name: string, case_description: string,
  case_open_date: string,             // "MM/DD/YYYY"
  case_initial_date: string | null,   // ISO sem 'Z' (tratado como UTC no front)
  state_name: string, owner: string, client_name: string
}]
```

### 2.7 Pontos de atenção

1. **Cálculo do `indiceRisco`** é **server-side** (composto de 4 cards × baseline × warmup). O backend novo precisa replicar essa lógica — não é apenas soma de severidades.
2. **`_debug` + `dataAvailability`** são contratos vivos consumidos pelo `DebugPanel`. Manter o shape se for útil em produção; senão, planejar remoção coordenada.
3. **`FluxoIncidentes` é o maior gargalo**: hoje busca **todos os casos** e filtra no front (por tenant, por janela, por owner). Migrar para endpoint filtrado server-side reduz payload drasticamente e elimina o parsing manual de `MM/DD/YYYY`.
4. **Dois formatos de data no IRIS**: `case_open_date` (`MM/DD/YYYY` sem hora) e `case_initial_date` (ISO sem `Z`, tratado como UTC). Padronizar ISO-8601 no novo backend.
5. **Padronizar parâmetro temporal**: o filtro convive com `dias` e `from/to` em todos os 4 endpoints. Replicar a mesma convenção, ou unificar.
6. **`tenantAtivo` é trigger universal** — todos os 4 cards + página + IRIS dependem dele. Backend novo precisa garantir tenant via header/JWT.
7. **Delay artificial de 500ms** em `TopAgentsCard`/`TopAgentsCisCard` (`Math.max(500-elapsed,0)`) é decisão de UX — preservar ou parametrizar.
8. **ScreenContext (`screenData["risk-level"]`)** é consumido pelo chat/IA com totais, %, top hosts. Preservar a estrutura ao migrar.
9. **Componentes "fantasma"** listados no mapeamento original (`EventosSummaryCard`, `OvertimeCard`, `RuleDistributionCard`, `TopAgentsDonutCard`, etc.) **não estão na `RiskLevel.tsx` atual**. Verificar se foram movidos para `Reports.tsx` ou se podem ser depreciados.

---

## 3. VulnerabilitiesDetection.tsx

### 3.1 Layout visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LayoutModel (header global)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                       ┌─[ AgentSelectFilter ]─[Limpar]─┐    │
│                                                                             │
│ ┌─[ VulnSeveridadeCard ]──────────────────────────────────────[Atualizar]─┐ │
│ │ Crítico │ Alto │ Médio │ Baixo │ Pendentes                             │ │
│ │  (5 cards de contagem agregada, cores por severidade)                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│ │ TopVuln     │ │ TopOSVuln   │ │ TopAgente   │ │ TopPackageVuln      │    │
│ │ (Top 5 CVEs)│ │ (Top 5 SOs) │ │ (Top 5      │ │ (Top 5 pacotes)     │    │
│ │             │ │             │ │  agentes)   │ │                     │    │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘    │
│                                                                             │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │
│ │ TopScoreVuln     │ │ TopOSGraficoCard │ │ AnoVulnerabilidadeCard       │ │
│ │ (Bar horizontal  │ │ (Bar horizontal  │ │ (Stacked bar por ano)        │ │
│ │  CVSS scores)    │ │  SOs)            │ │                              │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Endpoints atuais (Wazuh)

> Todos sob o prefixo `/api/acesso/wazuh/vulnerabilidades/*`.

| Componente | Endpoint | Params | Payload essencial |
|---|---|---|---|
| `VulnSeveridadeCard` | `GET /vulnerabilidades/severidade` | `agent?` | `{ aggregations: { Critical, High, Medium, Low, Pending, Total } }` |
| `TopVulnerabilidadeCard` | `GET /vulnerabilidades/top` | `by=cve`, `size=5`, `dias=todos`, `agent?` | `{ topVulnerabilidades: [{ key, total, severity: Record<string,number> }] }` |
| `TopOSVulnerabilidadeCard` | `GET /vulnerabilidades/top-os` | `size=5`, `dias=todos`, `agent?` | `{ topOS: [{ os, total, severity }] }` |
| `TopAgenteVulnerabilidadeCard` | `GET /vulnerabilidades/top-agentes` | `size=5`, `dias=todos`, `agent?` | `[{ agent, total, severity }]` (**array raiz**, sem wrapper) |
| `TopPackageVulnerabilidadeCard` | `GET /vulnerabilidades/top-packages` | `size=5`, `dias=todos`, `agent?` | `{ topPackages: [{ package, total, severity }] }` |
| `TopScoreVulnerabilidadeCard` | `GET /vulnerabilidades/top-scores` | `size=5`, `dias=todos`, `agent?` | `{ topScores: [{ score: string, total: number }] }` |
| `TopOSGraficoCard` | `GET /vulnerabilidades/top-os` | **mesmo de TopOSVuln** | mesmo payload |
| `AnoVulnerabilidadeCard` | `GET /vulnerabilidades/por-ano` | `dias=todos`, `agent?` | `{ porAno: [{ ano, total, severity }] }` |
| Página (carregar lista de agents) | `GET /vulnerabilidades/top-agentes` | `size=200`, `dias=todos` | usado p/ popular `AgentSelectFilter` |

### 3.3 Filtro global da página

A página tem **um único filtro**: `agentSelecionado: string | null`.

- `null` → todos os agentes; cards usam `dias="todos"` (hardcoded em cada card).
- `string` → propagado como prop `agent` para todos os 8 cards via `forwardRef`.
- `AgentSelectFilter.onApply(agent)` → `setAgentSelecionado(agent); atualizarTudo()`.
- Botão **Limpar** → `setAgentSelecionado(null); atualizarTudo()`.

**Não há filtro de janela temporal nesta tela** — todos os cards passam `dias="todos"` fixo.

### 3.4 Padrão arquitetural (8 cards)

Todos os 8 cards seguem o **mesmo padrão** com pequenas variações:

```ts
// Pattern comum
forwardRef<{ carregar: () => void }, Props>
  Props: { isWidget?: boolean; agent?: string | null;
           onDadosCarregados? /* só 2 cards */;
           onAtualizar?       /* só VulnSeveridadeCard */ }

  Estado: { dados: T[]; carregando: boolean; erro: string | null }

  useEffect: [tenantAtivo, agent] → carregar()
  useImperativeHandle: expõe { carregar }  // (+ getTotal no VulnSeveridadeCard)
```

A página mantém **8 refs**, um por card. `atualizarTudo()` chama `ref.current?.carregar()` em todos — disparado pelo `AgentSelectFilter` e pelo botão **Limpar**.

### 3.5 Props × Estado × Dependências

#### `VulnerabilitiesDetection` (página)
**Estado**:
- `agentSelecionado: string | null` — filtro global.
- `agents: string[]` — lista de agentes p/ o select (deduplicada/ordenada).
- `vulnSeveridades: VulnSeveridades | null` — alimenta `ScreenContext`.
- `topCVEs: Array<{ cve, total }>` — alimenta `ScreenContext`.
- 8 refs aos cards.
**Reage a**: `[tenantAtivo]` (recarrega lista de agentes + reseta `agentSelecionado`).
**ScreenContext**: `setScreenData("vulnerabilidades", { agentFiltrado, totalAgentes, severidades (com %), topCVEs })`.

#### `VulnSeveridadeCard`
**Props**: `agent?`, `onAtualizar?`, `onDadosCarregados?`, `isWidget?`.
**Ref expõe**: `{ carregar, getTotal }`.
**Estado**: `data: VulnSeveridades | null`, `loading`, `err`.
**Service**: `getVulnSeveridades(agent?)`.
**Callback**: emite `VulnSeveridades` para a página.
**Botão "Atualizar"**: chama `onAtualizar` (= `atualizarTudo`) se fornecido; senão `carregar()` próprio.

#### `TopVulnerabilidadeCard` (Top CVEs)
**Props**: `agent?`, `onDadosCarregados?`, `isWidget?`.
**Ref expõe**: `{ carregar }`.
**Estado**: `topVulns: TopVulnerabilidade[]`, `carregando`, `erro`.
**Service**: `getTopVulnerabilidades("cve", 5, "todos", agent?)`.
**Callback**: emite `[{ cve: key, total }]` para a página.

#### `TopOSVulnerabilidadeCard` (Top SOs — visualização lista)
**Props**: `agent?`, `isWidget?`.
**Ref expõe**: `{ carregar }`.
**Estado**: `topSo: TopOSVulnerabilidade[]`, `carregando`, `erro`.
**Service**: `getTopOSVulnerabilidades(5, "todos", agent?)`.

#### `TopAgenteVulnerabilidadeCard`
**Props**: `agent?`, `isWidget?`.
**Ref expõe**: `{ carregar }`.
**Estado**: `topAgents: TopAgenteVulnerabilidade[]`, `carregando`, `erro`.
**Service**: `getTopAgentesVulnerabilidades(5, "todos", agent?)`.

#### `TopPackageVulnerabilidadeCard`
**Props**: `agent?`, `isWidget?`.
**Ref expõe**: `{ carregar }`.
**Estado**: `topPackages: TopPackageVulnerabilidade[]`, `carregando`, `erro`.
**Service**: `getTopPackagesVulnerabilidades(5, "todos", agent?)`.

#### `TopScoreVulnerabilidadeCard` (CVSS — gráfico de barras)
**Props**: `agent?`, `isWidget?`.
**Ref expõe**: `{ carregar }`.
**Estado**: `topScores: TopScoreItem[]`, `carregando`, `erro`.
**Service**: `getTopScoresVulnerabilidades(5, "todos", agent?)`.
**Render**: `GraficoBarHorizontal`.

#### `TopOSGraficoCard` (Top SOs — visualização gráfico de barras)
**Props**: `agent?`, `isWidget?`.
**Ref expõe**: `{ carregar }`.
**Estado**: `topSo: TopOSVulnerabilidade[]`, `carregando`, `erro`.
**Service**: `getTopOSVulnerabilidades(5, "todos", agent?)` — **mesmo endpoint do `TopOSVulnerabilidadeCard`**.

#### `AnoVulnerabilidadeCard`
**Props**: `agent?`, `isWidget?`.
**Ref expõe**: `{ carregar }`.
**Estado**: `anoVulns: AnoVulnerabilidade[]`, `carregando`, `erro`.
**Service**: `getAnoVulnerabilidades("todos", agent?)`.
**Render**: `GraficoStackedBarChart` (top 5 anos mais recentes).

### 3.6 Quadro consolidado

| Componente | Props | Ref expõe | Service | Callback p/ página |
|---|---|---|---|---|
| `VulnSeveridadeCard` | `agent`, `onAtualizar`, `onDadosCarregados` | `carregar`, `getTotal` | `getVulnSeveridades` | `VulnSeveridades` |
| `TopVulnerabilidadeCard` | `agent`, `onDadosCarregados` | `carregar` | `getTopVulnerabilidades` | `[{cve,total}]` |
| `TopOSVulnerabilidadeCard` | `agent` | `carregar` | `getTopOSVulnerabilidades` | — |
| `TopAgenteVulnerabilidadeCard` | `agent` | `carregar` | `getTopAgentesVulnerabilidades` | — |
| `TopPackageVulnerabilidadeCard` | `agent` | `carregar` | `getTopPackagesVulnerabilidades` | — |
| `TopScoreVulnerabilidadeCard` | `agent` | `carregar` | `getTopScoresVulnerabilidades` | — |
| `TopOSGraficoCard` | `agent` | `carregar` | `getTopOSVulnerabilidades` ⚠ duplicado | — |
| `AnoVulnerabilidadeCard` | `agent` | `carregar` | `getAnoVulnerabilidades` | — |

> Todos: `isWidget?: boolean`; reagem a `[tenantAtivo, agent]`; estado interno `{dados[], carregando, erro}`.

### 3.7 Contratos para o novo backend

```ts
// GET /vulnerabilidades/severidade?agent=...
{ aggregations: {
    Critical: number; High: number; Medium: number; Low: number;
    Pending: number; Total: number
  } }

// GET /vulnerabilidades/top?by=cve|package|agent&size=5&dias=todos&agent=...
{ topVulnerabilidades: [{
    key: string,          // CVE / pacote / agente
    total: number,
    severity: Record<"Critical"|"High"|"Medium"|"Low", number>
  }] }

// GET /vulnerabilidades/top-os?size=5&dias=todos&agent=...
{ topOS: [{ os: string; total: number; severity: Record<string, number> }] }

// GET /vulnerabilidades/top-agentes?size=5&dias=todos&agent=...
// ⚠ ATENÇÃO: retorna ARRAY RAIZ, sem wrapper
[{ agent: string; total: number; severity: Record<string, number> }]

// GET /vulnerabilidades/top-packages?size=5&dias=todos&agent=...
{ topPackages: [{ package: string; total: number; severity: Record<string, number> }] }

// GET /vulnerabilidades/top-scores?size=5&dias=todos&agent=...
{ topScores: [{ score: string /* "7.8" */; total: number }] }

// GET /vulnerabilidades/por-ano?dias=todos&agent=...
{ porAno: [{ ano: string; total: number; severity: Record<string, number> }] }
```

### 3.8 Pontos de atenção

1. **Inconsistência de envelope**: `/top-agentes` retorna **array raiz**, todos os outros retornam `{ topX: [...] }`. Padronizar no novo backend.
2. **Duplicação de chamada**: `TopOSVulnerabilidadeCard` e `TopOSGraficoCard` chamam o **mesmo endpoint** (`/top-os`) com os mesmos parâmetros, em paralelo, lado a lado. **Candidato direto a hook compartilhado** (`useTopOS(agent)`).
3. **`dias` está hardcoded como `"todos"` em todos os 8 cards** — a tela não expõe filtro temporal. Decidir se o novo backend mantém esse parâmetro ou remove (e considera "todos" implícito).
4. **Padrão `forwardRef` + `useImperativeHandle({ carregar })`** é a forma adotada de refetch imperativo. O backend novo precisa suportar essa frequência de re-chamadas (botão **Atualizar** + qualquer mudança no `AgentSelectFilter`).
5. **`AgentSelectFilter` é alimentado pela mesma API**: a página chama `getTopAgentesVulnerabilidades(200, "todos")` apenas para extrair a lista de nomes únicos. Isso desperdiça payload — vale criar `GET /vulnerabilidades/agentes` retornando só `string[]`.
6. **Severidades em formato livre** (`Record<string, number>`): o backend retorna chaves capitalizadas em inglês (`Critical`, `High`, `Medium`, `Low`, `Pending`). Padronizar essas chaves no novo contrato para evitar normalização ad-hoc no front.
7. **Sem janela temporal real** torna o cache server-side viável e barato — a maioria dessas agregações é estável ao longo de minutos/horas.
8. **`onDadosCarregados`** existe em apenas 2 dos 8 cards (`VulnSeveridadeCard`, `TopVulnerabilidadeCard`) — alimentam o `ScreenContext` consumido pelo chat. Preservar.
9. **`getTotal` no ref do `VulnSeveridadeCard`** é exposto mas **não é consumido** pela página atual. Verificar se algum widget externo usa antes de remover.

---

## 4. MonitoriaSOC.tsx

### 4.1 Layout visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LayoutModel (header global)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Volume de dados coletados ─────────────────────────────────────────────┐ │
│ │ [Total Contratado: XX GB] [Usado: XX GB] [Disponível: XX GB]            │ │
│ │                                                                         │ │
│ │   ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │   │  GraficoVolume (últimos 30 dias — série única "Volume utilizado")│  │ │
│ │   └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │   Últimos Descartes:                                                    │ │
│ │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                       │ │
│ │   │ Descarte 1  │ │ Descarte 2  │ │ Descarte 3  │ (top-3 mais recentes) │ │
│ │   └─────────────┘ └─────────────┘ └─────────────┘                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐           │
│ │ FirewallCard                 │ │ ServidoresCard               │           │
│ │ (lista paginada 5/pág,       │ │ (lista paginada 5/pág,       │           │
│ │  badge ativo/inativo)        │ │  status por timestamp)       │           │
│ └──────────────────────────────┘ └──────────────────────────────┘           │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐           │
│ │ EdrCard                      │ │ Outros Coletores             │           │
│ │ (gated por cliente_name;     │ │ (placeholder estático —      │           │
│ │  Microsoft Defender etc.)    │ │  sem dados, sempre 0/0)      │           │
│ └──────────────────────────────┘ └──────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Endpoints atuais (Wazuh + Strapi-storage)

| Componente / consumidor | Backend | Endpoint | Payload essencial |
|---|---|---|---|
| Página (volume) | Strapi | `GET /api/storage/state` | `{ used, deleted, totalAccumulated, remaining, totalCapacity }` |
| Página (descartes) | Strapi | `GET /api/storage/internal` | `{ deleted: [{ data, volume }] }` (array de descartes) |
| Página (gráfico 30d) | Strapi | `GET /api/storage/timeline` | `{ totalCapacity, totalUsed, usagePercent, series: [{ date, used, deleted }] }` |
| `FirewallCard` | Wazuh | `GET /api/acesso/wazuh/firewalls` | `{ firewalls: [{ id, nome, location, timestamp, ativo, logsRecentes }] }` |
| `ServidoresCard` | Wazuh | `GET /api/acesso/wazuh/servidores` | `{ servidores: [{ id, nome, ip, timestamp }] }` |
| `EdrCard` | Wazuh | `GET /api/acesso/wazuh/edr` | `{ edr: [{ deviceName, timestamp }] }` |

### 4.3 Filtros / contexto

**Sem filtros explícitos de usuário** (sem janela temporal, sem agente, sem severidade).
Único trigger é o `tenantAtivo` (useEffect na página dispara recarga de tudo).

**Contrato lido do tenant** (`tenantAtivo.contract`):
- `storage_gb` → total contratado (fallback: `timeline.totalCapacity`).
- `firewalls` → quantidade contratada (mostrado como "X / Y contratados").
- `servers` → quantidade contratada.

### 4.4 Lógica de derivação no front (importante)

**Volume total / usado / disponível** (página):
```ts
TOTAL_GB        = tenantAtivo?.contract?.storage_gb  ?? timeline?.totalCapacity ?? 0
totalUsado      = storage?.used                       ?? timeline?.totalUsed     ?? 0
totalDisponivel = max(TOTAL_GB - totalUsado, 0)
```

**Gráfico 30 dias** (`timeline.series`):
- Ordena por `date` asc → pega últimos 30.
- `categoriasX`: `date` (`yyyy-mm-dd`) invertido para `dd/mm/yyyy`.
- `dadosUtilizados`: `used.toFixed(4)`.
- `yMaxVisual = max(maxUsado * 1.2, 1)` (margem visual 20%).

**Descartes** (página):
- `internal.deleted: any[]` filtrado por `data !== "desconhecida"`.
- Normaliza data `dd/mm/yyyy` → `yyyy-mm-dd` antes de ordenar (desc por data).
- Sempre renderiza 3 slots (preenche com `{ volume: 0, data: "--" }` se faltar).

**Status visual** (cards `Servidores` e `Edr`):
- Computado **no front** a partir de `timestamp`:
  - `≤ 59 min` → 🟢 verde
  - `≤ 119 min` → 🟡 amarelo
  - `> 119 min` ou ausente → 🔴 vermelho
- `FirewallCard` é diferente: o backend já manda `ativo: boolean` — **sem cálculo no front**.

### 4.5 Props × Estado × Dependências

#### `MonitoriaSOC` (página)
**Estado**:
- `storage`, `loadingStorage`
- `internal`, `loadingInternal`
- `timeline: StorageTimelineResponse | null`, `loadingTimeline`
- 3 refs (`firewallRef`, `servidoresRef`, `edrRef`).
**Reage a**: `[tenantAtivo]` — chama os 3 loaders + `ref.current?.carregar()` em todos os cards.
**ScreenContext** (`setScreenData("monitoria-soc", ...)`): só dispara **após** todos os 3 fetches terminarem (condição `!loadingStorage && !loadingInternal && !loadingTimeline`).

#### `FirewallCard`
**Props**: nenhuma (apenas `ref`).
**Ref expõe**: `{ carregar }`.
**Estado**: `firewalls: FirewallInventarioItem[]`, `loading`, `paginaAtual` (5/pág).
**Derivado**: `ativos = filter(ativo)`, `inativos = filter(!ativo)`, `firewallsContratados = tenantAtivo.contract.firewalls`.
**Ordenação**: ativos primeiro, depois por `timestamp` desc.
**Reage a**: `[tenantAtivo]`.
**Service**: `getFirewallsList()`.

#### `ServidoresCard`
**Props**: nenhuma (apenas `ref`).
**Ref expõe**: `{ carregar }`.
**Estado**: `servidores: ServidorMonitorItem[]`, `loading`, `paginaAtual` (5/pág).
**Derivado**: `servidoresContratados = tenantAtivo.contract.servers`.
**Filtro local**: descarta itens sem `ip` válido (`""`, `"-"`).
**Status**: computado por `getStatus(timestamp)` (limiares 59/119 min).
**Reage a**: `[tenantAtivo]`.
**Service**: `getServidoresList()`.

#### `EdrCard`
**Props**: nenhuma (apenas `ref`).
**Ref expõe**: `{ carregar }`.
**Estado**: `itens: EdrItemMonitor[]`, `loading`, `paginaAtual` (5/pág).
**Permissão hardcoded**: `permitido = tenantAtivo?.cliente_name === "FEPA-PRD-FNL-0001"` — ⚠ regra de negócio no front.
**Map de nomes**: `ms-graph | microsoft-graph | graph` → `"Microsoft Defender"`.
**Status**: `getStatusByTimestamp(timestamp)` (mesmos limiares 59/119 min).
**Reage a**: `[tenantAtivo]`.
**Service**: `getEdrList()`.

### 4.6 Quadro consolidado

| Componente | Props | Ref expõe | Service | Estado-chave |
|---|---|---|---|---|
| `FirewallCard` | (ref-only) | `carregar` | `getFirewallsList` | `firewalls`, `paginaAtual` |
| `ServidoresCard` | (ref-only) | `carregar` | `getServidoresList` | `servidores`, `paginaAtual` |
| `EdrCard` | (ref-only) | `carregar` | `getEdrList` | `itens`, `paginaAtual`, gate por `cliente_name` |
| Página | — | — | `getStorageState` + `getStorageInternal` + `getStorageTimeline` | 3 estados separados, refs para os 3 cards |

> Os 3 cards seguem o mesmo padrão `forwardRef` + `useImperativeHandle({ carregar })`; sem props externas; paginação 5/pág; reagem a `[tenantAtivo]`.

### 4.7 Contratos para o novo backend

```ts
// GET /storage/state
{ used: number; deleted: number; totalAccumulated: number;
  remaining: number; totalCapacity: number }   // tudo em GB

// GET /storage/internal
{ deleted: [{ data: string /* "dd/mm/yyyy" ou "desconhecida" */;
              volume: number }] }

// GET /storage/timeline
{ totalCapacity: number; totalUsed: number; usagePercent: number;
  series: [{ date: string /* "yyyy-mm-dd" */; used: number; deleted: number }] }

// GET /wazuh/firewalls
{ firewalls: [{
    id: string; nome: string;
    location: string | null;
    timestamp: string | null;   // ISO
    ativo: boolean;             // calculado server-side
    logsRecentes: number
  }] }

// GET /wazuh/servidores
{ servidores: [{
    id: string; nome: string;
    ip: string | null;
    timestamp: string | null    // ISO
  }] }

// GET /wazuh/edr
{ edr: [{
    deviceName: string;
    timestamp: string           // ISO
  }] }
```

### 4.8 Pontos de atenção

1. **Inconsistência de cálculo de status** entre cards:
   - `FirewallCard` → `ativo: boolean` vem **pronto do backend** (modelo correto).
   - `ServidoresCard` e `EdrCard` → status calculado **no front** com limiares 59/119 min.
   → Padronizar: backend deve devolver `status` ou `ativo` para os 3 cards. Remove drift de relógio cliente vs servidor.

2. **Regra de negócio hardcoded no front** (`EdrCard`):
   ```ts
   permitido = tenantAtivo?.cliente_name === "FEPA-PRD-FNL-0001"
   ```
   Isto **precisa migrar** para flag de contrato (`tenantAtivo.contract.edr_enabled` ou similar). Hoje, adicionar um novo cliente exige redeploy do front.

3. **Formato de data inconsistente** no storage:
   - `timeline.series[].date`: `"yyyy-mm-dd"`
   - `internal.deleted[].data`: `"dd/mm/yyyy"` (e às vezes `"desconhecida"`)
   → Padronizar ISO-8601 no novo backend, eliminando `normalizarData()` do front.

4. **Lógica de fallback `storage_gb` × `timeline.totalCapacity`** está duplicada (página + cálculo do gráfico). Consolidar: o backend novo deve devolver `totalCapacity` autoritativa num único lugar.

5. **"Outros Coletores"** é placeholder estático (`0 / 0 contratados`, "Nenhum dado encontrado"). Sinalizado para futura implementação — verificar se há roadmap antes de remover.

6. **Botão "Atualizar"** do bloco "Outros Coletores" não tem `onClick`. Provavelmente artefato visual — confirmar se faz parte da feature pendente.

7. **`internal.deleted` está tipado como `any`** no service. Definir contrato firme `{ data: string; volume: number }` no novo backend.

8. **Página não usa nenhum endpoint Wazuh diretamente** — só via cards. O acoplamento com Strapi-storage é direto (3 fetches na página). Considerar mover essas 3 chamadas para um hook único `useStorageOverview()` para reduzir loadings independentes.

9. **`logsRecentes` em `FirewallCard`** é retornado pelo backend mas **não é exibido na UI** atual. Decidir se mantém no contrato ou remove.

---

## 5. Reports.tsx

### 5.1 Característica principal

**Não há componentes de domínio nesta página** — toda a UI vive em `Reports.tsx` (1.602 linhas). Os "componentes" são **seções de PDF** geradas dinamicamente via `jsPDF` + `jspdf-autotable` + `ApexCharts` renderizado off-screen. Os relatórios são persistidos em `localStorage` (chave `"relatoriosGerados"`).

### 5.2 Layout visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LayoutModel (header global)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  Gerar Relatório                                           │
│ │ Sidebar      │  ─────────────                                             │
│ │ - Novo       │  Escolha o período...        [Período▼] [Gerar Relatório]  │
│ │   Relatório  │                              (5d / 15d / 30d)              │
│ │              │                                                            │
│ │              │  ┌─[ Lista de relatórios gerados (localStorage) ]────┐    │
│ │              │  │ relatorio01-13052026   13/05/2026 • Tenant • 15d  │    │
│ │              │  │                          [Baixar PDF] [Excluir]   │    │
│ │              │  │ relatorio02-...        ...                        │    │
│ │              │  └────────────────────────────────────────────────────┘    │
│ └──────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**O PDF gerado** tem ~14 seções, organizadas em múltiplas páginas escuras (`#121212`).

### 5.3 Fluxo de uso

```
1. usuário escolhe periodo (5/15/30 dias)
   └─→ click "Gerar Relatório"
        ├─→ getTenant()                       (Wazuh)
        ├─→ getTopAgents(periodo)             (Wazuh)  ← cacheado no record
        └─→ cria RelatorioGerado { id, nome, data, tenant, periodo, dados }
            └─→ persiste em localStorage["relatoriosGerados"]

2. usuário clica "Baixar PDF" em um relatório
   └─→ exportarRelatorioTopHosts(r)           ← chamada de ~150 linhas
        ├─→ getReportData(tenant, periodo)    (Strapi — 5x repetido!)
        ├─→ getSeveridadeWazuh(periodo)       (Wazuh)
        ├─→ getVulnSeveridades()              (Wazuh)
        ├─→ getTopAgentsCis(periodo)          (Wazuh)
        ├─→ getTopOSVulnerabilidades(5, periodo || "todos")  + fallback "todos"
        ├─→ getTopAgents(periodo)             (Wazuh) ← refetch (não usa r.dados!)
        ├─→ getTopUsers(periodo)              (Wazuh)
        └─→ getOvertimeEventos(periodo)       (Wazuh)
```

> **⚠ Importante**: `r.dados` armazenado no `localStorage` (do `getTopAgents` no momento da geração) **não é usado** no PDF — o handler chama `getTopAgents(periodo)` novamente. O campo `dados` é dead-code no record salvo.

### 5.4 Endpoints atuais

| Backend | Endpoint | Service | Onde é usado no PDF |
|---|---|---|---|
| Wazuh | `GET /wazuh/tenant` | `getTenant()` | identifica organização ao gerar |
| Wazuh | `GET /wazuh/top-agentes` | `getTopAgents(periodo)` | Top Hosts por Nível de Alertas + Top Hosts por Alteração de Arquivos |
| Wazuh | `GET /wazuh/top-agentes-cis` | `getTopAgentsCis(periodo)` | Nível de Segurança dos Servidores (CIS) |
| Wazuh | `GET /wazuh/severidade` | `getSeveridadeWazuh(periodo)` | Risk Level |
| Wazuh | `GET /wazuh/vulnerabilidades/severidade` | `getVulnSeveridades()` ⚠ sem período | Detecção de Vulnerabilidades |
| Wazuh | `GET /wazuh/vulnerabilidades/top-os` | `getTopOSVulnerabilidades(5, periodo \|\| "todos")` | Top 5 Sistemas Operacionais |
| Wazuh | `GET /wazuh/top-users` | `getTopUsers(periodo)` | Top Hosts Alterados por Origem |
| Wazuh | `GET /wazuh/overtime-eventos` | `getOvertimeEventos(periodo)` | Distribuição de Ações nos Arquivos |
| Strapi | `GET /acesso/report/data/:cliente?period=X` | `getReportData(tenant, periodo)` | Top Acessos / Usuários / Apps / Categorias / Volume / IPs detalhado |
| Strapi | `POST /acesso/report` | `postReportData()` ⚠ definido no service mas **não chamado** | — |

### 5.5 Seções do PDF (ordem de renderização)

| # | Seção | Service | Visualização |
|---|---|---|---|
| 1 | Top Acessos (URLs) | `getReportData.topUrls` (top 10) | tabela + donut (top 3) |
| 2 | Top Usuários | `getReportData.topUsers` | tabela |
| 3 | Top Aplicações | `getReportData.topApps` (top 10) | tabela + donut |
| 4 | Top Categorias | `getReportData.topCats` | tabela |
| 5 | Top Usuários por Volume de Aplicação | `getReportData.tabelaResumo` | tabela |
| 6 | Top Acesso Detalhado (IPs) | `getReportData.topIps` / `output.topIps` | tabela |
| 7 | Risk Level | `getSeveridadeWazuh` | severidades + gráfico |
| 8 | Top Hosts por Nível de Alertas | `getTopAgents` | tabela |
| 9 | Detecção de Vulnerabilidades | `getVulnSeveridades` | severidades coloridas |
| 10 | Nível de Segurança dos Servidores (CIS) | `getTopAgentsCis` | tabela |
| 11 | Top 5 Sistemas Operacionais | `getTopOSVulnerabilidades` (+ fallback `"todos"`) | tabela + barras |
| 12 | Top Hosts por Alteração de Arquivos | `getTopAgents` ⚠ refetch | tabela |
| 13 | Top Hosts Alterados por Origem | `getTopUsers` | tabela |
| 14 | Resumo de Ações / Distribuição | `getOvertimeEventos` | tabela + gráfico |

### 5.6 Estado da página

```ts
periodo: string                 // "5" | "15" | "30"; default "15"
gerando: boolean                // botão "Gerar Relatório"
relatoriosGerados: RelatorioGerado[]   // sincronizado com localStorage
baixandoId: string | null       // qual record está exportando

type RelatorioGerado = {
  id: string;             // crypto.randomUUID()
  nome: string;           // ex: "relatorio01-13052026"
  data: string;           // toLocaleString("pt-BR")
  tenant: string;         // cliente_name OU wazuh_client_name
  periodo: string;        // "5" | "15" | "30"
  dados: TopAgentItem[]   // ⚠ dead-code, não é lido no export
}
```

**Persistência**: dois `useEffect`:
- mount → lê `localStorage["relatoriosGerados"]`.
- mudança em `relatoriosGerados` → grava no localStorage.

**ScreenContext**: `setScreenData("reports-legacy", { periodoSelecionado, totalRelatoriosLocais, observacao })`.

### 5.7 Contratos para o novo backend

```ts
// GET /wazuh/severidade?dias=15  | ?from=...&to=...
{ critico: number; alto: number; medio: number; baixo: number; total: number }

// GET /wazuh/top-users?dias=15  | ?from=...&to=...
[{ user: string; agent_id: string; agent_name: string; count: number }]

// GET /wazuh/overtime-eventos?dias=15  | ?from=...&to=...
{ labels: string[]; datasets: [{ name: string; data: number[] }] }
// ⚠ service converte `dias` → from/to ISO no front antes de chamar o backend

// GET /wazuh/tenant
// usado p/ identificar { cliente_name, wazuh_client_name, ... } da org ativa

// GET /report/data/:cliente?period=15
{
  period: string;
  totals: { sent: string; rcvd: string; total: string };
  topUrls:  [string, number][];   // [[url, count], ...]
  topUsers: [{ user: string; logs: number }];
  topIps:   [{ ip: string; fmt: string; total?: number }];
  topApps:  [string, number][];
  topCats:  [string, number][];
  tabelaResumo: [{ "#": number; application: string; category: string;
                   user: string; total_bytes: string }];
  output?: { topIps?, tabelaResumo? }    // wrapper alternativo
}
```

(Demais contratos — `top-agentes`, `top-agentes-cis`, `vulnerabilidades/severidade`, `vulnerabilidades/top-os` — já documentados em §2.6 e §3.7.)

### 5.8 Pontos de atenção

1. **`getVulnSeveridades()` é chamado SEM período** (linha 939) — todas as outras seções respeitam `periodo`, mas vulnerabilidades **sempre agrega tudo**. Verificar se é intencional ou bug. No novo backend, decidir: aceitar período para coerência, ou documentar a exceção.

2. **Refetch desnecessário de `getTopAgents`**: o record salvo já tem `dados: TopAgentItem[]`, mas o handler de export chama `getTopAgents(periodo)` novamente (linha 1230). O campo `dados` é dead-code. Resolver: (a) remover `dados` do record e do localStorage, ou (b) usar o cacheado.

3. **`getReportData` chamado 5x no mesmo export** (linhas 101, 446, 511, 608, 671) com **mesmos parâmetros** — uma chamada por seção do PDF. Trivial de consolidar em uma única chamada e passar adiante.

4. **Sem indicador de tenant nas listagens** — `Reports.tsx` não usa `useTenant()`. Pega `tenant` via `getTenant()` no momento da geração e congela no record. Trocar de tenant **não invalida** os relatórios da lista — eles continuam mostrando dados do tenant antigo. Avaliar se precisa filtrar a lista por `tenantAtivo`.

5. **Sem tratamento de relatórios antigos vs schema novo**: se `RelatorioGerado` mudar de shape, registros antigos no localStorage quebram silenciosamente o export.

6. **Backend `postReportData` existe no service mas nunca é chamado** — sinalizado para futura migração de "gerar relatório do lado servidor" (modelo correto para PDFs grandes). Possivelmente substituirá a geração local toda quando estiver pronto.

7. **Fallback `"todos"` em Top OS** (linha 1149): se o backend não devolver dados para o `periodo`, tenta `"todos"`. Documentar essa semântica no novo contrato (ou eliminar o fallback no backend).

8. **PDF renderiza gráficos ApexCharts em DOM off-screen** (`div.style.left = "-9999px"`) com width/height 3× e converte com `chart.dataURI()`. Custoso e síncrono — não é trivial migrar para SSR/headless. Se o backend novo gerar PDF server-side, este código todo desaparece.

9. **Sem feedback de erro granular** — `console.log` apenas; usuário só vê "Erro ao carregar [seção]" embutido no PDF. Considerar telemetria/log estruturado se mantiver geração client-side.

10. **`overtime-eventos` faz conversão `dias → from/to` no front** (no service). O backend deveria aceitar `dias` diretamente, como os outros endpoints, para uniformizar.

11. **`getTopUsers` aceita `{dias: number}` ou `{from, to}`**, mas o handler aqui chama `getTopUsers(relatorio.periodo)` passando uma **string** — pode estar gerando bug silencioso (não bate em nenhum dos casos do filtro). Verificar.

### 5.9 Recomendação estratégica

Esta tela é a **melhor candidata para migração radical**: substituir geração client-side por endpoint **`POST /reports`** que devolve o PDF pronto (server-side via Puppeteer/Playwright). Ganho duplo:

- elimina 8 endpoints frontend → 1 endpoint backend.
- elimina dependência de `jsPDF`, `jspdf-autotable`, `ApexCharts` no bundle do front.
- elimina drift entre dados snapshot vs dados ao baixar.
- `postReportData()` já existe parcialmente no service — sinaliza que o roadmap aponta nessa direção.

---

## 6. Dashboard.tsx

### 6.1 Característica principal

A `Dashboard.tsx` **não tem componentes próprios** — é um **container de widgets** baseado em `react-grid-layout`. Os widgets reaproveitam componentes de **outras telas** (RiskLevel, ThreatMap, VulnerabilitiesDetection, IRIS) renderizados em modo `isWidget={true}`. A configuração de layout (posição/tamanho de cada widget) é persistida por usuário no Strapi.

### 6.2 Layout visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LayoutModel (header global)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [ Redefinir layout padrão ] [+ Adicionar widgets ] │
│                                                                             │
│ ┌─ react-grid-layout (cols=12, rowHeight=30, draggable, resizable) ──────┐ │
│ │                                                                         │ │
│ │  ┌────────────┐  ┌─────────────────────────┐  ┌─────────────────┐      │ │
│ │  │ grafico_   │  │ geo_map                 │  │ top_paises      │      │ │
│ │  │ risco      │  │ (GeoHitsMap)            │  │ (TopCountries-  │      │ │
│ │  │ (gauge)    │  │                         │  │  Table dias=    │      │ │
│ │  │            │  │                         │  │  todos)         │      │ │
│ │  └────────────┘  └─────────────────────────┘  └─────────────────┘      │ │
│ │                                                                         │ │
│ │  ┌────────────┐  ┌─────────────────────────┐  ┌─────────────────┐      │ │
│ │  │ top_       │  │ ia_humans               │  │ top_firewalls   │      │ │
│ │  │ incidentes │  │ (IaHumans)              │  │ (TopFirewall)   │      │ │
│ │  └────────────┘  └─────────────────────────┘  └─────────────────┘      │ │
│ │                                                                         │ │
│ │  (+ qualquer widget arrastado do sidebar)                              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─[ WidgetMenuSidebar (slide-in direita) ]──────────────────────────────┐  │
│ │ Lista de widgets disponíveis (filtrando os já adicionados),           │  │
│ │ cada um draggable → drop na grid                                      │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Endpoints atuais

| Backend | Endpoint | Método | Uso |
|---|---|---|---|
| Strapi | `/api/custom-dashboards/me` | `GET` | Retorna layout do usuário (`{ id, layout, is_default }`) ou o padrão global |
| Strapi | `/api/custom-dashboards/me` | `PUT` | Salva layout do usuário (body: `{ layout: WidgetLayout[] }`) |
| Strapi | `/api/custom-dashboards/reset` | `?` | Reset global (admin) — definido no service mas **não usado nesta tela** |
| Strapi | `/api/custom-dashboards/reset-me` | `PUT` | Restaura layout do usuário para o padrão |
| Wazuh | `/api/acesso/wazuh/risklevel?dias=1` | `GET` | Alimenta o widget `grafico_risco` (gauge 24h) |

> **Observação**: os widgets **internos** disparam suas próprias chamadas (cada componente herdado tem fetch próprio reagindo a `[tenantAtivo]`). A página não orquestra essas chamadas — apenas renderiza.

### 6.4 Catálogo de widgets

19 widgets definidos em `WidgetConfig.tsx`, mapeados em `WidgetMap.tsx` para JSX:

| ID | Label | w×h (min) | Componente reusado | Origem |
|---|---|---|---|---|
| `grafico_risco` | Nível de Risco | 3×9 | `GraficoGauge` + botão "Acessar" | RiskLevel |
| `geo_map` | Mapa de Ataques | 6×13 | `GeoHitsMap` | ThreatMap |
| `top_paises` | Top Países | 3×13 | `TopCountriesTable dias="todos" limit=10` | ThreatMap |
| `top_incidentes` | Top Incidentes | 3×18 (min 3×16) | `TopIncidentesCard` | IRIS |
| `ia_humans` | IA x Humans | 6×14 | `IaHumans` | IRIS |
| `top_firewalls` | Top Firewalls | 3×14 | `TopFirewallCard` | (raiz `componentes/wazuh/`) |
| `top_agentes` | Top Hosts | 6×13 | `TopAgentsCard dias="1" isWidget` | RiskLevel |
| `top_agentes_cis` | Auditoria CIS | 6×13 | `TopAgentsCisCard dias="1" isWidget` | RiskLevel |
| `top_alertas_firewall` | Alertas Firewall | 3×9 | `FirewallDonutCard dias="1" isWidget` | RiskLevel |
| `severidade_card` | Nível de Alertas | 12×6 | `SeveridadeCard dias="1" isWidget` ⚠ | RiskLevel |
| `controle_incidentes` | Controle Incidentes | 6×12 | `FluxoIncidentesIris diasGlobal="1" isWidget` | IRIS |
| `vulnerabilidade_severidade` | Alertas Vulnerabilidades | 12×5 | `VulnSeveridadeCard isWidget` | VulnerabilitiesDetection |
| `top_vulnerabilidades` | Top 5 Vulnerabilidades | 3×7 | `TopVulnerabilidadeCard isWidget` | VulnerabilitiesDetection |
| `top_5_os` | Top 5 (OS) | 3×7 | `TopOSVulnerabilidadeCard isWidget` | VulnerabilitiesDetection |
| `top_5_agentes` | Top 5 Agentes | 3×7 | `TopAgenteVulnerabilidadeCard isWidget` | VulnerabilitiesDetection |
| `top_5_pacotes` | Top 5 Pacotes | 3×7 | `TopPackageVulnerabilidadeCard isWidget` | VulnerabilitiesDetection |
| `top_score_vulnerabilidades` | Pontuações CVSS | 4×11 | `TopScoreVulnerabilidadeCard isWidget` | VulnerabilitiesDetection |
| `top_os_grafico` | Vulnerabilidades por SO | 4×11 | `TopOSGraficoCard isWidget` | VulnerabilitiesDetection |
| `ano_vulnerabilidade` | Vulnerabilidades por Ano | 4×11 | `AnoVulnerabilidadeCard isWidget` | VulnerabilitiesDetection |

⚠ **Bug latente**: `SeveridadeCard` no widget recebe `dias="1"` mas seu type real exige `dados: Severidades` obrigatório. Ver §6.9.

### 6.5 Layout padrão (fallback do front)

Definido **no código do front** (`Dashboard.tsx` linhas 29-36):

```ts
const layoutPadrao: WidgetLayout[] = [
  { i: "grafico_risco",   x: 0, y: 0,  w: 3, h: 9 },
  { i: "geo_map",         x: 3, y: 0,  w: 6, h: 13 },
  { i: "top_paises",      x: 9, y: 0,  w: 3, h: 13 },
  { i: "top_incidentes",  x: 0, y: 10, w: 3, h: 18 },
  { i: "ia_humans",       x: 3, y: 12, w: 6, h: 14 },
  { i: "top_firewalls",   x: 9, y: 12, w: 3, h: 14 },
];
```

> ⚠ **Duplicação backend/frontend**: o backend também tem noção de "padrão" (`is_default`, endpoint `reset-me`). Se divergir, o front sempre vence quando a resposta vem vazia. Verificar consistência.

### 6.6 Lógica de persistência

```
mount
  └─→ getDashboardLayout()
       ├─ data.layout vazio    → setLayout(normalizar(layoutPadrao))
       └─ data.layout válido   → setLayout(normalizar(data.layout))

ação do usuário
  ├─ onDrop (do sidebar)        → setLayout + saveDashboardLayout(limpar(...))  [imediato]
  ├─ onLayoutChange (drag/resize) → setLayout + salvarLayoutDebounced(limpar(...)) [1s]
  ├─ removerWidget(id)          → setLayout + saveDashboardLayout(...)          [imediato]
  └─ "Redefinir layout padrão"  → resetUserDashboardLayout() + setLayout(layoutPadrao)
```

**Duas funções utilitárias** (`utils/dashboardLayout.ts`):
- `normalizarLayout(layout)` — aplica `minW`/`minH` (regras de UI) antes de renderizar.
- `limparLayoutParaSalvar(layout)` — **remove** `minW`/`minH` antes de salvar. Mantém o banco "limpo" (regras de UI ficam no front).

### 6.7 Estado da página

```ts
indiceRisco: number                  // alimenta widget grafico_risco
totalAtaques: number                 // alimentado pelo widget top_paises (callback)
topPaises: Array<{pais, total}>      // idem
topFirewalls: Array<{nome, total, critico, alto, medio, baixo}>
topIncidentes: Array<{id, nome, severidade, data}>
iaHumans: { totalIa, totalHumanos } | null

layout: WidgetLayout[]               // estado canônico do grid
loadingDashboard: boolean
resettingLayout: boolean             // overlay de loading no reset
sidebarOpen: boolean
draggingFromSidebar: boolean         // mostra o overlay "Solte aqui"
```

**Reage a**: `[tenantAtivo]` para o `getRiskLevel`. Mount-only para `getDashboardLayout`.

**ScreenContext**: `setScreenData("dashboard", { indiceRisco, totalEventosDetectados, tenant, widgetsVisiveis, topPaisesOrigem, topFirewalls, ultimosIncidentes, ataquesAutomatizados })` — agregado pelos callbacks dos widgets.

### 6.8 Props × callbacks dos widgets-chave

A página **injeta callbacks** nos widgets via `getWidgetMap()`:
```ts
getWidgetMap(
  navigate, token, indiceRisco,
  setTotalAtaques,          // → top_paises
  setTopPaises,             // → top_paises
  setTopFirewalls,          // → top_firewalls
  setTopIncidentes,         // → top_incidentes
  setIaHumans               // → ia_humans
)
```

Esses 5 callbacks viram `onDadosCarregados` / `onTotalChange` em cada widget. **O fluxo de dados é unidirecional**: widget faz fetch → emite via callback → página agrega no `ScreenContext`.

### 6.9 Pontos de atenção

1. **`getWidgetMap` chama `useRef` 8x dentro de uma função utilitária** (linhas 33-40 de `WidgetMap.tsx`). Esses hooks são **reexecutados a cada render** da `Dashboard.tsx`. Funciona porque `getWidgetMap` é invocada na fase de render do componente — mas **viola a regra dos hooks** (chamada em função que não é componente nem hook). Refatorar para um custom hook (`useWidgetMap()`) ou mover os refs para um componente wrapper.

2. **`SeveridadeCard` no widget** (`severidade_card`) é renderizado com `dias="1" isWidget`, mas o type do componente é `{ dados: Severidades; loading?: ... }` — `dados` é **obrigatório** e `dias` **não existe** na interface. Provável runtime crash ou rendering vazio. Já chega quebrado no novo backend se não for corrigido.

3. **Cada widget faz seu próprio fetch** — abrir o Dashboard com 6 widgets dispara 6+ requisições paralelas. Considerar batch endpoint `GET /dashboard/snapshot?widgets=...` no novo backend para reduzir round-trips.

4. **Widgets fixados em `dias="1"`** (24h) sem opção de filtro temporal na tela. Decisão consciente, mas conflita com o `RiskLevel.tsx` (que tem `DateRangePicker`). Possível confusão de UX (usuário vê valores diferentes na mesma página vs widget).

5. **Layout padrão duplicado** entre frontend (constante no código) e backend (`is_default`). Se backend mudar, o front continua com o antigo até redeploy. Centralizar no backend.

6. **`minW`/`minH` no front, não no banco** — força conhecimento do schema do widget no client. Se um widget for renomeado/removido do `widgetsConfig` mas existir no layout salvo no banco, a UI renderiza o fallback "Widget desconhecido". Não há reconciliação automática.

7. **`debounce` reimplementado inline** (linha 136) usando `useMemo` para estabilizar entre renders. Cuidado: se `salvarLayoutDebounced` capturar valores stale via closure, salva versão antiga. Hoje funciona porque o `newLayout` é passado como argumento.

8. **Salvar logo após `setLayout`** (assíncrono) em `removerWidget` salva o `novoLayout` calculado, não o `layout` do estado — correto. Mas o handler de `onDrop` salva imediatamente sem checar erro: se falhar no servidor, a UI já renderizou o widget novo e o usuário não percebe.

9. **`getRiskLevel("1")` é a única chamada Wazuh direta da página** — todo o resto vem dos widgets. Resolver isso (ex: o próprio widget `grafico_risco` buscar) eliminaria o último acoplamento da página com Wazuh.

10. **`WidgetMenuSidebar` não tem busca/filtro** — com 19 widgets a lista cresce. Vale paginar/filtrar antes de adicionar muitos novos.

11. **Sem agrupamento/categorias** no sidebar — widgets de Vulnerabilidades, RiskLevel, ThreatMap, IRIS misturados em uma lista única. O `WidgetConfig` já tem comentários separando categorias; vale promovê-los a campo `categoria`.

### 6.10 Contratos para o novo backend

```ts
// GET /custom-dashboards/me
{
  id: number;
  layout: WidgetLayout[];     // [{ i, x, y, w, h }] — SEM minW/minH
  is_default: boolean
}

// PUT /custom-dashboards/me
// body: { layout: WidgetLayout[] }
// → 200 com mesma estrutura do GET

// PUT /custom-dashboards/reset-me
// → restaura o layout do usuário para o padrão global e devolve o novo

// (GET /custom-dashboards/reset — definido no service, sem uso na UI)
```

> O contrato é simples e estável. **O grande ganho está no backend novo é**: (a) catálogo de widgets vir do servidor (`GET /widgets/catalog`) para eliminar a duplicação `widgetsConfig`; (b) endpoint batch `/dashboard/snapshot` para reduzir 6+ requisições paralelas no boot da tela.

### 6.11 Recomendação estratégica

A tela é **fina** — quase toda complexidade está nos widgets reusados. Migração deve:

1. **Manter o contrato `/custom-dashboards/me`** intacto na primeira fase.
2. **Mover `widgetsConfig` e `layoutPadrao` para o backend** — elimina duplicação de "verdade" entre front e back, e permite habilitar/desabilitar widgets por plano/tenant sem redeploy.
3. **Considerar endpoint batch** `/dashboard/snapshot?widgets=[...]` para reduzir requisições paralelas (cada widget hoje faz seu próprio fetch).
4. **Corrigir os 2 bugs latentes** (§6.9 #1 e #2) antes da migração — eles podem mascarar regressões.

