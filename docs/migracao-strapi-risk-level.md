# Migração Strapi → .NET: Tela /risk-level

> Documento de diagnóstico técnico. Nenhuma implementação foi feita.
> Data: 2026-04-22

---

## 1. O que o Strapi faz hoje

### 1.1 Rotas expostas para /risk-level

| Método | Rota | Handler | Arquivo |
|--------|------|---------|---------|
| GET | `/acesso/wazuh/riskLevel` | `acesso-wazuh.riskLevel` | `controllers/risklevel.controller.ts` |
| GET | `/acesso/wazuh/top-agentes` | `acesso-wazuh.topAgentes` | `controllers/agentes.controller.ts` |
| GET | `/acesso/wazuh/top-agentes-cis` | `acesso-wazuh.topAgentesCis` | `controllers/agentes.controller.ts` |
| GET | `/acesso/wazuh/top-geradores` | `acesso-wazuh.topGeradores` | `controllers/firewalls.controller.ts` |

Todas as rotas recebem `?dias=N` (default `"1"`) e opcionalmente `?from=ISO&to=ISO` para período customizado. `/riskLevel` aceita ainda `diasFirewall`, `diasAgentes` e `diasIris` para sobrescrever a janela por card.

---

### 1.2 De onde busca os dados

| Fonte | O que busca | Protocolo |
|-------|-------------|-----------|
| **Wazuh/Elasticsearch** (`wazuh-*`) | Alertas de agentes, eventos de firewall, dados SCA/CIS | HTTPS + Basic Auth (usuário/senha por tenant) |
| **IRIS REST API** | Lista de casos/incidentes abertos | HTTPS + Bearer Token por tenant |
| **Strapi Store** | Baselines persistidos por janela canônica (1d/7d/15d/30d) | Banco interno do Strapi (chave: `risklevel_baseline_v2_tenant_{id}`) |

Não há banco de dados próprio do Strapi para alertas — todos os eventos vêm em tempo real do Elasticsearch.

---

### 1.3 Queries por rota

#### `/riskLevel` — 4 chamadas paralelas ao Elasticsearch + IRIS

**Card 1 — Top Hosts (agentes Wazuh)** — `agentes.service.ts`

```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        { "range": { "data.timestamp | @timestamp": { "gte": "now-Nd", "lte": "now" } } }
      ],
      "should": [
        { "match_phrase": { "customer": "<wazuh_client_name>" } },
        { "match_phrase": { "agent.labels.customer": "<wazuh_client_name>" } },
        { "match_phrase": { "manager.name": "manager-<wazuh_client_name>" } }
      ],
      "minimum_should_match": 1,
      "filter": [
        { "terms": { "rule.groups": ["attack","authentication_failed","invalid_login","access_control","vulnerability-detector","fortigate","windows","syscheck"] } }
      ],
      "must_not": [
        { "match_phrase": { "agent.name": "wazuhhackone" } }
      ]
    }
  },
  "aggs": {
    "top_agentes_alertas": {
      "terms": { "field": "agent.name", "order": { "_count": "desc" }, "size": 9 },
      "aggs": {
        "por_severidade": { "terms": { "field": "rule.level" } }
      }
    }
  }
}
```

**Card 2 — CIS (Conformidade SCA)** — `agentes.service.ts`

```json
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "rule.groups": "sca" } },
        { "term": { "data.sca.type": "summary" } },
        { "range": { "@timestamp": { "gte": "now-Nd", "lte": "now" } } }
      ],
      "should": [ "<mesmo filtro de customer acima>" ],
      "minimum_should_match": 1
    }
  },
  "aggs": {
    "agentes": {
      "terms": { "field": "agent.name", "size": 20 },
      "aggs": {
        "ultimos_summary": {
          "top_hits": { "_source": ["agent.name","data.sca"], "size": 1, "sort": [{ "@timestamp": { "order": "desc" } }] }
        }
      }
    }
  }
}
```

**Card 3 — Top Geradores de Firewall** — `firewalls.service.ts`

```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        { "range": { "@timestamp": { "gte": "now-Nd", "lte": "now" } } },
        { "bool": { "should": [ "<filtros customer>"], "minimum_should_match": 1 } }
      ]
    }
  },
  "aggs": {
    "top_geradores": {
      "terms": { "field": "data.devname.keyword", "size": 8, "order": { "_count": "desc" } },
      "aggs": {
        "get_ip": { "top_hits": { "_source": ["@timestamp","location"], "size": 1 } },
        "com_severidade": {
          "filter": { "exists": { "field": "rule.level" } },
          "aggs": {
            "severidade": {
              "range": {
                "field": "rule.level",
                "ranges": [
                  { "from": 0, "to": 6,  "key": "Low" },
                  { "from": 7, "to": 11, "key": "Medium" },
                  { "from": 12, "to": 14, "key": "High" },
                  { "from": 15,          "key": "Critical" }
                ]
              }
            }
          }
        }
      }
    }
  }
}
```

**Card 4 — Incidentes IRIS** — `acesso-iris.ts`

Não usa Elasticsearch. Faz `GET /manage/cases/list` na API IRIS com Bearer Token e filtra localmente em Node.js por período e owner.

---

#### `/top-agentes`
Mesma query do Card 1 acima, retornando os agentes individualmente com score calculado.

#### `/top-agentes-cis`
Mesma query do Card 2 acima, retornando agentes com score de conformidade CIS.

#### `/top-geradores`
Mesma query do Card 3 acima, retornando os dispositivos firewall individualmente.

---

### 1.4 Cálculos e agregações

#### Pesos de severidade (Wazuh `rule.level`)

| `rule.level` | Categoria | Peso |
|-------------|-----------|------|
| ≤ 6 | Baixo | 1 (3⁰) |
| 7–11 | Médio | 3 (3¹) |
| 12–14 | Alto | 9 (3²) |
| ≥ 15 | Crítico | 27 (3³) |

**Raw points por card:**
```
raw = Σ(doc_count × peso)
```

**Raw CIS** (inversão de conformidade):
```
raw_cis = 100 - média_global_de_scores_cis
```
Onde `score_cis` = campo `data.sca.score` do evento Wazuh (% de conformidade).

#### Baseline com decaimento

```
baseline_novo = max(minFloor, rawAtual, baseline_anterior × decay)
```

| Parâmetro | Alertas | Incidentes |
|-----------|---------|------------|
| `decay` | 0.98 | 0.99 |
| `minFloor` | 50 | 10 |
| Primeira vez (warmup) | `raw × 2` | `raw × 2` |

Baselines são persistidos no Strapi Store apenas para janelas canônicas (`"1"`, `"7"`, `"15"`, `"30"`). Períodos customizados (`from`/`to`) usam fallback read-only para a janela mais próxima.

#### Risco normalizado por card (0–1)

```
risco_card = min(1, (raw / baseline) ^ 1.5)
```

#### Índice de risco total (0–100)

Média ponderada dos cards com dados, com redistribuição de pesos quando algum card está ausente:

```
indiceRisco = 100 × Σ(peso_card_ativo / soma_pesos_ativos × risco_card)
```

Cada card tem peso = 0.25 (25%). Se um card não tem dados, seu peso é redistribuído entre os demais.

---

### 1.5 Lógica de filtros

```
diasGlobal (default "1")
  ├── diasFirewall (sobrescreve Card 3 e Card 4 firewall)
  ├── diasAgentes  (sobrescreve Card 1 e Card 2)
  └── diasIris     (sobrescreve Card 4 IRIS)

periodo { from, to } → sobrescreve TODOS os dias, nunca persiste baseline
```

**Resolução de janela canônica:**
- Se `diasFirewall == diasAgentes == diasIris` E valor está em `{1, 7, 15, 30}` → janela canônica → persiste baseline
- Se `periodo` fornecido OU dias diferente entre cards → janela customizada → usa fallback (range ≤4d → baseline "1"; ≤10d → "7"; ≤20d → "15"; >20d → "30")

---

## 2. Análise de viabilidade de migração para .NET

### Rota `/riskLevel`

| Dado | Temos no .NET? | O que falta? |
|------|---------------|--------------|
| Severidades por janela de tempo (FortiGate) | ✅ Sim | `GROUP BY Severity` em `NormalizedEvents` com filtro `EventTime` |
| Card firewall — contagem de eventos | ✅ Sim | `COUNT(*)` em `NormalizedEvents WHERE Product = 'FortiGate'` |
| Card incidents — contagem por severidade | ✅ Sim | `Incidents` com `Severity` enum e filtro `LastSeenAt` |
| Card topHosts — contagem por host | ⚠️ Parcial | `AssetJson` é blob JSON — campo de hostname não está estruturado como coluna |
| Card CIS — conformidade por agente | ❌ Não | Dados do módulo SCA do Wazuh — não coletados do FortiGate, fora do MVP (G22) |
| Baseline com decaimento | ❌ Não | Não existe tabela/cache para persistência de baseline no .NET |
| Cálculo do índice de risco | ⚠️ Parcial | Lógica pura em C# é viável, mas depende do baseline existir |
| Janelas canônicas e fallback | ⚠️ Parcial | Lógica reimplementável, sem impedimentos técnicos |

### Rota `/top-agentes`

| Dado | Temos no .NET? | O que falta? |
|------|---------------|--------------|
| Lista de agentes Wazuh com alertas | ❌ Não | "Agente Wazuh" = endpoint monitorado por agente Wazuh — conceito inexistente no .NET atual |
| Severidades por agente (`rule.level`) | ❌ Não | `rule.level` é campo nativo do Elasticsearch/Wazuh |
| Score por agente (pesos × severidade) | ❌ Não | Depende dos dados acima |

### Rota `/top-agentes-cis`

| Dado | Temos no .NET? | O que falta? |
|------|---------------|--------------|
| Score de conformidade CIS por agente | ❌ Não | 100% Wazuh SCA — não há equivalente no pipeline FortiGate |

### Rota `/top-geradores`

| Dado | Temos no .NET? | O que falta? |
|------|---------------|--------------|
| Lista de dispositivos FortiGate | ✅ Sim | Tabela `Sources` com `Vendor`, `Product` |
| Nome amigável do gerador | ⚠️ Parcial | `Sources` não tem campo `Name` — só `Vendor`/`Product`; precisaria adicionar ou derivar |
| IP do dispositivo | ⚠️ Parcial | `Sources.ApiUrl` contém a URL/IP, mas não como campo isolado |
| Total de eventos por dispositivo | ✅ Sim | `GROUP BY Vendor, Product` em `NormalizedEvents` |
| Severidades por dispositivo | ✅ Sim | `GROUP BY Severity` dentro de cada agrupamento |

---

## 3. Recomendação

### O que dá pra migrar agora

**`/top-geradores`** — pronto com ajuste mínimo:
- Adicionar campo `Name` (string, nullable) à entidade `Source` — serve como nome amigável do dispositivo
- Query: `NormalizedEvents GROUP BY SourceType + Vendor + Product` com `COUNT` por `Severity`
- Join com `Sources` para trazer `Name` e `ApiUrl`

**`/riskLevel` — cards firewall e incidents** — viável sem nova estrutura:
- Card firewall: `NormalizedEvents WHERE EventTime > now-N GROUP BY Severity`
- Card incidents: `Incidents WHERE LastSeenAt > now-N GROUP BY Severity`

### O que precisa de estrutura nova

**Baseline persistence:**
- Criar tabela `RiskLevelBaseline` (schema `alert` ou novo schema `analytics`):
  ```
  TenantId | Window ("1","7","15","30") | Card ("topHosts","cis","firewall","incidents") | Value | UpdatedAt
  ```
- Alternativa mais simples: usar Redis/MemoryCache distribuído por tenant+window+card

**Card topHosts:**
- Extrair campo de hostname de `AssetJson` (provavelmente `$.host.hostname` ou similar)
- Ou adicionar coluna computada/índice no campo extraído do JSON (PostgreSQL suporta)

**Cálculo do índice de risco:**
- Criar `RiskLevelService` em C# com as funções:
  - `CalculateRawPoints(SeverityCounts)` — pesos exponenciais (1, 3, 9, 27)
  - `UpdateBaseline(rawAtual, baselineAnterior, warmup, decay, minFloor)` — decaimento
  - `CalculateCardRisk(raw, baseline)` — normalização com gamma=1.5
  - `CalculateTotalRisk(cards[])` — média ponderada com degradação graciosa

### O que deve continuar no Strapi/Wazuh

| Rota | Motivo |
|------|--------|
| `/top-agentes` | Requer Wazuh agents (endpoints monitorados). G22 (adapter Wazuh) está fora do MVP. |
| `/top-agentes-cis` | Requer dados SCA/CIS do Wazuh. Sem equivalente no pipeline FortiGate. |
| Card CIS do `/riskLevel` | Mesma razão. Ao migrar, o card simplesmente fica ausente (degradação graciosa já trata isso). |

### Riscos e pontos de atenção

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Mapeamento de `Severity` string em `NormalizedEvents` — não sabemos os valores exatos que o adapter FortiGate grava | Alta | Verificar `SendAlertCommand` e o adapter FortiGate; confirmar que grava `"LOW"/"MEDIUM"/"HIGH"/"CRITICAL"` |
| `AssetJson` sem schema definido — estrutura depende do adapter | Média | Verificar um evento real no banco; definir o campo de hostname antes de implementar card topHosts |
| Baseline em warmup — primeira execução no .NET inflaciona o índice de risco (raw × 2) | Baixa | Aceitar warmup como comportamento esperado, igual ao Strapi |
| Multi-tenant — baseline deve ser isolado por `TenantId` | Alta | Garantir `WHERE TenantId = @tenantId` em todas as queries |
| Período customizado (`from`/`to`) — lógica de fallback de janela precisa ser fiel ao Strapi | Média | Replicar exatamente a tabela de fallback (≤4d→"1", ≤10d→"7", ≤20d→"15", >20d→"30") |

---

## 4. Plano de implementação

### Ordem sugerida

```
[1] Verificar Severity no NormalizedEvent
    ↓
[2] Migrar /top-geradores (mais simples, maior valor imediato)
    ↓
[3] Implementar cards firewall + incidents no /riskLevel (sem baseline)
    ↓
[4] Implementar baseline persistence (tabela ou cache)
    ↓
[5] Implementar cálculo completo do indiceRisco
    ↓
[6] Card topHosts (extrair hostname do AssetJson)
    ↓
[7] Deprecar chamadas ao Strapi para as rotas migradas
```

---

### Passo 1 — Verificar mapeamento de Severity

**Onde verificar:** `SecurityOne.Alerts` → `Application/Alerts/Commands/SendAlertCommand.cs`  
**O que confirmar:** qual string é gravada em `NormalizedEvents.Severity` para eventos FortiGate.  
**Esperado:** `"LOW"` / `"MEDIUM"` / `"HIGH"` / `"CRITICAL"`

---

### Passo 2 — `/top-geradores`

**Estrutura:**
- Adicionar `Name` (string, nullable, max 100) à entidade `Source` em `SecurityOne.Customers`
- Migration: `ALTER TABLE "customer"."Sources" ADD COLUMN "Name" varchar(100)`

**Query .NET (EF Core):**
```csharp
var topGeradores = await _db.NormalizedEvents
    .Where(e => e.TenantId == tenantId
             && e.EventTime >= cutoff
             && e.Product == "FortiGate")
    .GroupBy(e => new { e.Vendor, e.Product })
    .Select(g => new {
        Vendor  = g.Key.Vendor,
        Product = g.Key.Product,
        Total   = g.Count(),
        Severidades = new {
            Baixo   = g.Count(e => e.Severity == "LOW"),
            Medio   = g.Count(e => e.Severity == "MEDIUM"),
            Alto    = g.Count(e => e.Severity == "HIGH"),
            Critico = g.Count(e => e.Severity == "CRITICAL"),
        }
    })
    .OrderByDescending(g => g.Total)
    .Take(8)
    .ToListAsync();
```

**Join com Sources para enriquecer com Name e IP:**
```csharp
// Join por Vendor+Product (ou adicionar SourceId em NormalizedEvent futuramente)
var sources = await _customersDb.Sources
    .Where(s => s.TenantId == tenantId && s.Product == "FortiGate")
    .ToDictionaryAsync(s => s.Vendor + "|" + s.Product);
```

**Endpoint sugerido:** `GET /api/analytics/top-geradores?dias=1`  
**Serviço:** `SecurityOne.Alerts` (tem acesso ao NormalizedEvents)  
**Ou:** novo microserviço `SecurityOne.Analytics` (se a separação fizer sentido)

---

### Passo 3 — `/riskLevel` (cards firewall + incidents)

**Severidades FortiGate:**
```csharp
var severidades = await _db.NormalizedEvents
    .Where(e => e.TenantId == tenantId
             && e.EventTime >= cutoff
             && e.Product == "FortiGate")
    .GroupBy(e => e.Severity)
    .Select(g => new { Severity = g.Key, Count = g.Count() })
    .ToListAsync();
```

**Card incidents:**
```csharp
var incidents = await _ticketsDb.Incidents
    .Where(i => i.TenantId == tenantId
             && i.LastSeenAt >= cutoff)
    .GroupBy(i => i.Severity)
    .Select(g => new { Severity = g.Key, Count = g.Count() })
    .ToListAsync();
```

**Mapeamento Severity enum → counts:**
```csharp
record SeverityCounts(int Baixo, int Medio, int Alto, int Critico);

SeverityCounts FromIncidents(IEnumerable<...> rows) => new(
    Baixo:   rows.FirstOrDefault(r => r.Severity == Severity.LOW)?.Count  ?? 0,
    Medio:   rows.FirstOrDefault(r => r.Severity == Severity.MEDIUM)?.Count ?? 0,
    Alto:    rows.FirstOrDefault(r => r.Severity == Severity.HIGH)?.Count   ?? 0,
    Critico: rows.FirstOrDefault(r => r.Severity == Severity.CRITICAL)?.Count ?? 0
);
```

---

### Passo 4 — Baseline persistence

**Nova tabela (migration em `SecurityOne.Alerts` ou `SecurityOne.Analytics`):**
```csharp
public class RiskLevelBaseline
{
    public Guid   Id        { get; set; }
    public Guid   TenantId  { get; set; }
    public string Window    { get; set; }  // "1", "7", "15", "30"
    public string Card      { get; set; }  // "topHosts", "cis", "firewall", "incidents"
    public double Value     { get; set; }
    public bool   Initialized { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

---

### Passo 5 — RiskLevelCalculationService

**Funções a implementar em C#:**

```csharp
public static class RiskLevelCalculations
{
    // Pesos: 3^0=1, 3^1=3, 3^2=9, 3^3=27
    public static double CalculateRawPoints(SeverityCounts c)
        => c.Baixo * 1 + c.Medio * 3 + c.Alto * 9 + c.Critico * 27;

    // Decaimento com piso mínimo e warmup
    public static double UpdateBaseline(
        double rawAtual, double baselineAnterior,
        bool initialized, double decay, double minFloor)
        => !initialized || baselineAnterior <= 0
            ? Math.Max(minFloor, rawAtual * 2)           // warmup
            : Math.Max(minFloor, Math.Max(rawAtual, baselineAnterior * decay));

    // Normalização (0–1) com gamma=1.5
    public static double CalculateCardRisk(double raw, double baseline)
        => baseline <= 0 ? 0 : Math.Min(1, Math.Pow(raw / baseline, 1.5));

    // Média ponderada com degradação graciosa
    public static double? CalculateTotalRisk(
        IEnumerable<(double Risk, double Raw, double Peso)> cards)
    {
        var active = cards.Where(c => c.Raw > 0).ToList();
        if (active.Count == 0) return null;
        var totalPeso = active.Sum(c => c.Peso);
        return 100 * active.Sum(c => (c.Peso / totalPeso) * c.Risk);
    }
}
```

**Parâmetros:**
```csharp
const double DecayAlertas    = 0.98;
const double DecayIncidentes = 0.99;
const double MinFloorAlertas    = 50;
const double MinFloorIncidentes = 10;
const double PesoCard = 0.25;  // 25% cada (topHosts, cis, firewall, incidents)
```

---

### Endpoint final sugerido

**Serviço:** `SecurityOne.Alerts` (ou `SecurityOne.Analytics`)  
**Rota:** `GET /api/analytics/risk-level?dias=1`

**Response compatível com o frontend atual:**
```json
{
  "severidades": { "baixo": 0, "medio": 0, "alto": 0, "critico": 0, "total": 0 },
  "indiceRisco": 50,
  "filtrosUsados": { "diasGlobal": "1", "periodo": null, "diasFirewall": "1", "diasAgentes": "1", "diasIris": "1" },
  "_debug": {
    "janela": "1",
    "cards": {
      "topHosts":  { "raw": 0, "baseline": 0, "risco": 0 },
      "cis":       { "raw": 0, "baseline": 0, "risco": 0 },
      "firewall":  { "raw": 0, "baseline": 0, "risco": 0 },
      "incidents": { "raw": 0, "baseline": 0, "risco": 0 }
    },
    "warmup": false
  }
}
```

> **Nota:** Card `cis` e rota `/top-agentes*` retornam dados zerados/vazios inicialmente (cards ausentes são tratados pela degradação graciosa do cálculo).
