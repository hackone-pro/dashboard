# SOC Analytics API — Contrato do Endpoint

> Documento de referência para o endpoint de KPIs do SOC.
> Fonte canônica:
> - `src/SecurityOne.Tickets/src/Web/Endpoints/Analytics.cs`
> - `src/SecurityOne.Tickets/src/Application/Incidents/Queries/GetSocAnalytics/`

---

## 1. Endpoint

```
GET /api/analytics/soc
```

### Autenticação e isolamento de tenant

- Requer JWT Bearer válido (padrão da plataforma).
- O `TenantId` é extraído do contexto do usuário autenticado (`IUser.TenantId`). **Não é aceito como parâmetro na query string.**
- Todas as queries filtram por `TenantId` — impossível acessar dados de outro tenant.
- Retorna `400 Bad Request` se o token não contiver `TenantId`.

---

## 2. Query Parameters

| Parâmetro   | Tipo            | Obrigatório | Default | Descrição |
|-------------|-----------------|-------------|---------|-----------|
| `period`    | string          | Não         | `Day`   | Janela de análise. Valores válidos (case-insensitive): `Day`, `Week`, `Month`, `Quarter`, `Year`, `Custom`. Valores inválidos ou ausentes fazem fallback para `Day`. |
| `startDate` | ISO 8601 offset | Condicional | —       | Início do período customizado. Obrigatório quando `period=Custom`. |
| `endDate`   | ISO 8601 offset | Condicional | —       | Fim do período customizado. Obrigatório quando `period=Custom`. |

### Resolução de períodos

| `period`  | `currentStart`                        | `currentEnd` |
|-----------|---------------------------------------|--------------|
| `Day`     | `now - 24h`                           | `now`        |
| `Week`    | `now - 7d`                            | `now`        |
| `Month`   | Primeiro dia do mês corrente (UTC)    | `now`        |
| `Quarter` | Primeiro dia do trimestre corrente (UTC) | `now`     |
| `Year`    | `YYYY-01-01T00:00:00Z`                | `now`        |
| `Custom`  | `startDate` (fornecido)               | `endDate` (fornecido) |

O **período anterior** é calculado automaticamente com a mesma duração, imediatamente antes do período atual:
```
previousStart = currentStart - (currentEnd - currentStart)
previousEnd   = currentStart
```

---

## 3. Response Schema

**HTTP 200 OK** — `Content-Type: application/json`

```json
{
  "mttd":                { ... },
  "mtta":                { ... },
  "mttr":                { ... },
  "openIncidents":       { ... },
  "severityDistribution":{ ... },
  "riskLevel":           { ... },
  "iaPerformance":       { ... },
  "period":              { ... }
}
```

---

### 3.1 `mttd`, `mtta`, `mttr` — KpiMetric

KPIs de tempo médio (Mean Time to Detect / Acknowledge / Resolve).

```json
{
  "value":         12.5,
  "previousValue": 18.0,
  "deltaPercent":  -30.6,
  "unit":          "minutes",
  "trend":         "improving"
}
```

| Campo           | Tipo          | Descrição |
|-----------------|---------------|-----------|
| `value`         | number\|null  | Média do período atual. `null` se não há incidentes com dados suficientes. |
| `previousValue` | number\|null  | Média do período anterior. `null` se sem dados. |
| `deltaPercent`  | number\|null  | `(current - previous) / previous × 100`, arredondado a 1 casa. `null` se qualquer um dos valores é `null` ou `previousValue = 0`. |
| `unit`          | string        | `"minutes"` quando `value < 60`; `"hours"` quando `value >= 60`. |
| `trend`         | string\|null  | `"improving"` (delta < 0), `"worsening"` (delta > 0), `"stable"` (delta = 0). `null` se delta não disponível. |

**Fórmulas de coleta:**

| KPI  | Fórmula |
|------|---------|
| MTTD | `média(DetectedAt - FirstSeenAt)` em minutos, sobre incidentes do período. |
| MTTA | `média(AcknowledgedAt - CreatedAt)` em minutos, apenas incidentes com `AcknowledgedAt` preenchido. |
| MTTR | `média(ResolvedAt - CreatedAt)` em minutos, apenas incidentes com status `RESOLVED` ou `CLOSED` e `ResolvedAt` preenchido. |

> **Nota:** O cálculo inclui todos os incidentes do período sem filtrar diferenças negativas. Se `DetectedAt` for anterior a `FirstSeenAt` em algum incidente (dado inconsistente), a média será afetada. Valores negativos em `value` indicam dados de instrumentação incorretos.

> **Dependência SA01v:** MTTA requer `AcknowledgedAt`; MTTR requer `ResolvedAt`. Sem os campos de SA01, ambos retornam `null`.

---

### 3.2 `openIncidents` — OpenIncidentsKpiDto

Incidentes abertos **no momento da requisição** (independente do período selecionado).

```json
{
  "count":         14,
  "previousCount": 9,
  "deltaPercent":  55.6,
  "badge":         "High Alert",
  "hasCritical":   true
}
```

| Campo           | Tipo         | Descrição |
|-----------------|--------------|-----------|
| `count`         | integer      | Total de incidentes abertos agora (status ≠ `RESOLVED` e ≠ `CLOSED`). |
| `previousCount` | integer\|null | Incidentes que estavam abertos antes do `previousEnd` (aproximação: incidentes criados antes de `previousEnd` com estado atual aberto). `null` quando não há dados do período anterior. |
| `deltaPercent`  | number\|null | `(count - previousCount) / previousCount × 100`. `null` se `previousCount = 0`. |
| `badge`         | string       | Enum calculado (ver regras abaixo). |
| `hasCritical`   | boolean      | `true` se qualquer incidente aberto tem severidade `CRITICAL`. |

**Regras do `badge`:**

| Condição (avaliadas em ordem)                       | Badge         |
|-----------------------------------------------------|---------------|
| `hasCritical = true` OU `count > previousCount × 1.5` | `"High Alert"` |
| `count > previousCount`                             | `"Attention"` |
| Demais casos                                        | `"Normal"`    |

---

### 3.3 `severityDistribution` — SeverityDistributionDto

Distribuição de incidentes do **período atual** por severidade.

```json
{
  "buckets": [
    { "severity": "LOW",      "count": 20, "percent": 40.0, "previousCount": 15, "deltaPercent": 33.3 },
    { "severity": "MEDIUM",   "count": 18, "percent": 36.0, "previousCount": 20, "deltaPercent": -10.0 },
    { "severity": "HIGH",     "count": 8,  "percent": 16.0, "previousCount": 6,  "deltaPercent": 33.3 },
    { "severity": "CRITICAL", "count": 4,  "percent": 8.0,  "previousCount": 2,  "deltaPercent": 100.0 }
  ],
  "total": 50
}
```

| Campo          | Tipo         | Descrição |
|----------------|--------------|-----------|
| `buckets`      | array        | Um objeto por severidade (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), sempre os 4 presentes. |
| `total`        | integer      | Total de incidentes no período atual (soma de todos os buckets). |

**Campos por bucket:**

| Campo           | Tipo         | Descrição |
|-----------------|--------------|-----------|
| `severity`      | string       | `"LOW"`, `"MEDIUM"`, `"HIGH"` ou `"CRITICAL"`. |
| `count`         | integer      | Incidentes do período atual com essa severidade. |
| `percent`       | number       | `count / total × 100`, arredondado a 1 casa. `0` se `total = 0`. |
| `previousCount` | integer\|null | Incidentes do período anterior com essa severidade. |
| `deltaPercent`  | number\|null | `(count - previousCount) / previousCount × 100`. `null` se `previousCount = 0`. |

---

### 3.4 `riskLevel` — RiskLevelDto

Índice de risco calculado sobre os incidentes **abertos no momento** (mesma base de `openIncidents`).

```json
{
  "score": 68,
  "level": "High",
  "alertsBySeverity": [
    { "severity": "Critical", "count": 2 },
    { "severity": "High",     "count": 5 },
    { "severity": "Medium",   "count": 4 },
    { "severity": "Low",      "count": 3 }
  ]
}
```

| Campo               | Tipo    | Descrição |
|---------------------|---------|-----------|
| `score`             | integer | Índice de risco de 0 a 100. `0` se não há incidentes abertos. |
| `level`             | string  | `"Critical"`, `"High"`, `"Medium"` ou `"Low"` (ver faixas abaixo). |
| `alertsBySeverity`  | array   | Contagem de incidentes abertos por severidade (sempre 4 entradas). |

**Fórmula do score:**

```
score = min(100, round(
  (critical×40 + high×25 + medium×10 + low×2) / max(total, 1) × 10
))
```

Onde `critical`, `high`, `medium`, `low` são as contagens de incidentes abertos por severidade e `total = critical + high + medium + low`.

**Faixas do `level`:**

| Score       | Level       |
|-------------|-------------|
| 75 – 100    | `"Critical"` |
| 50 – 74     | `"High"`    |
| 25 – 49     | `"Medium"`  |
| 0 – 24      | `"Low"`     |

---

### 3.5 `iaPerformance` — IaPerformanceDto

Métricas de performance da triagem automática por IA.

```json
{
  "triageAutoRate":          78.5,
  "prevTriageAutoRate":      72.0,
  "triageAutoRateDeltaPct":  9.0,
  "avgAiTimeMinutes":        3.2,
  "prevAvgAiTimeMinutes":    4.1,
  "avgAiTimeMinutesDeltaPct": -22.0,
  "escalationRate":          12.5,
  "prevEscalationRate":      15.0,
  "escalationRateDeltaPct":  -16.7
}
```

| Campo                      | Tipo         | Descrição |
|----------------------------|--------------|-----------|
| `triageAutoRate`           | number\|null | `% incidentes com TriagedBy = AI` no período atual. `null` se sem incidentes. |
| `prevTriageAutoRate`       | number\|null | Mesmo cálculo para o período anterior. |
| `triageAutoRateDeltaPct`   | number\|null | Delta percentual entre os dois períodos. |
| `avgAiTimeMinutes`         | number\|null | Média de `(AiFirstResultAt - CreatedAt)` em minutos, apenas incidentes com `AiFirstResultAt` preenchido. |
| `prevAvgAiTimeMinutes`     | number\|null | Idem para período anterior. |
| `avgAiTimeMinutesDeltaPct` | number\|null | Delta percentual. |
| `escalationRate`           | number\|null | `% incidentes com Escalated = true` no período atual. |
| `prevEscalationRate`       | number\|null | Idem para período anterior. |
| `escalationRateDeltaPct`   | number\|null | Delta percentual. |

Todos os deltas usam a fórmula: `(current - previous) / previous × 100`, retornando `null` se qualquer valor for `null` ou `previous = 0`.

> **Nota:** Se não há incidentes no período atual, todos os campos retornam `null` — comportamento distinto do caso SA01v onde incidentes existem mas os campos de instrumentação não foram preenchidos.

> **Dependência SA01v:** `avgAiTimeMinutes` requer o campo `AiFirstResultAt` no modelo `Incident`. Sem SA01v, retorna `null`.

---

### 3.6 `period` — PeriodInfoDto

Metadados do período calculado, úteis para debug e exibição no frontend.

```json
{
  "currentStart":  "2026-04-13T00:00:00+00:00",
  "currentEnd":    "2026-04-20T14:32:00+00:00",
  "previousStart": "2026-04-06T00:00:00+00:00",
  "previousEnd":   "2026-04-13T00:00:00+00:00",
  "periodType":    "Week"
}
```

| Campo           | Tipo            | Descrição |
|-----------------|-----------------|-----------|
| `currentStart`  | ISO 8601 offset | Início do período atual. |
| `currentEnd`    | ISO 8601 offset | Fim do período atual. |
| `previousStart` | ISO 8601 offset | Início do período de comparação. |
| `previousEnd`   | ISO 8601 offset | Fim do período de comparação (= `currentStart`). |
| `periodType`    | string          | Nome do enum: `"Day"`, `"Week"`, `"Month"`, `"Quarter"`, `"Year"` ou `"Custom"`. |

---

## 4. Exemplos de Requisição

### Período semanal (default de autenticação via Bearer)

```http
GET /api/analytics/soc?period=Week
Authorization: Bearer <token>
```

### Range customizado

```http
GET /api/analytics/soc?period=Custom&startDate=2026-04-01T00:00:00Z&endDate=2026-04-15T23:59:59Z
Authorization: Bearer <token>
```

---

## 5. Exemplo de Response (parcial, valores realistas)

```json
{
  "mttd": {
    "value": 8.4,
    "previousValue": 11.2,
    "deltaPercent": -25.0,
    "unit": "minutes",
    "trend": "improving"
  },
  "mtta": {
    "value": 22.3,
    "previousValue": null,
    "deltaPercent": null,
    "unit": "minutes",
    "trend": null
  },
  "mttr": {
    "value": 127.5,
    "previousValue": 115.0,
    "deltaPercent": 10.9,
    "unit": "hours",
    "trend": "worsening"
  },
  "openIncidents": {
    "count": 14,
    "previousCount": 9,
    "deltaPercent": 55.6,
    "badge": "High Alert",
    "hasCritical": true
  },
  "severityDistribution": {
    "buckets": [
      { "severity": "LOW",      "count": 22, "percent": 44.0, "previousCount": 18, "deltaPercent": 22.2 },
      { "severity": "MEDIUM",   "count": 15, "percent": 30.0, "previousCount": 20, "deltaPercent": -25.0 },
      { "severity": "HIGH",     "count": 9,  "percent": 18.0, "previousCount": 7,  "deltaPercent": 28.6 },
      { "severity": "CRITICAL", "count": 4,  "percent": 8.0,  "previousCount": 2,  "deltaPercent": 100.0 }
    ],
    "total": 50
  },
  "riskLevel": {
    "score": 68,
    "level": "High",
    "alertsBySeverity": [
      { "severity": "Critical", "count": 2 },
      { "severity": "High",     "count": 5 },
      { "severity": "Medium",   "count": 4 },
      { "severity": "Low",      "count": 3 }
    ]
  },
  "iaPerformance": {
    "triageAutoRate": 78.5,
    "prevTriageAutoRate": 72.0,
    "triageAutoRateDeltaPct": 9.0,
    "avgAiTimeMinutes": null,
    "prevAvgAiTimeMinutes": null,
    "avgAiTimeMinutesDeltaPct": null,
    "escalationRate": 12.5,
    "prevEscalationRate": 15.0,
    "escalationRateDeltaPct": -16.7
  },
  "period": {
    "currentStart":  "2026-04-13T00:00:00+00:00",
    "currentEnd":    "2026-04-20T14:32:00+00:00",
    "previousStart": "2026-04-06T00:00:00+00:00",
    "previousEnd":   "2026-04-13T00:00:00+00:00",
    "periodType":    "Week"
  }
}
```

> No exemplo acima, `mtta` e `avgAiTimeMinutes` são `null` porque os campos SA01v (`AcknowledgedAt` e `AiFirstResultAt`) não estão preenchidos.

---

## 6. Respostas de Erro

| Status | Condição |
|--------|----------|
| `400 Bad Request` | `TenantId` ausente no contexto do usuário autenticado. Body: `"TenantId not found in user context."` |
| `400 Bad Request` | `period=Custom` sem `startDate` ou `endDate`. Body: ProblemDetails (FluentValidation). |
| `400 Bad Request` | `startDate >= endDate`. Body: ProblemDetails (FluentValidation). |
| `401 Unauthorized` | Token ausente ou inválido (tratado pelo middleware de auth). |

> **Nota:** Os erros de validação de `period=Custom` e `startDate/endDate` retornam ProblemDetails (formato estruturado com `errors`), diferente do `400` por `TenantId` que retorna uma string plana.

---

## 7. Performance

### Índice composto recomendado

```sql
CREATE INDEX idx_incidents_tenant_created
ON Incidents (TenantId, CreatedAt);
```

O handler executa **3 queries** contra a tabela `Incidents`, todas filtradas por `TenantId`:
1. Incidentes do período atual (com filtro `latestOnly` por versão).
2. Incidentes do período anterior (idem).
3. Incidentes abertos agora (status ≠ RESOLVED/CLOSED, sem filtro de data).

O padrão `latestOnly` usa uma subconsulta correlacionada para selecionar apenas a linha com maior `Version` por `IncidentId`, simulando uma view de estado atual em uma tabela imutável de eventos.

### Cálculo on-demand

Não há cache ou materialização. Cada request recalcula todos os KPIs. Para dashboards com alta frequência de atualização, considere cache no frontend (stale-while-revalidate) ou um endpoint de polling com ETag.

---

## 8. Dependências — Campos SA01v

Os campos abaixo devem estar preenchidos no modelo `Incident` para que as métricas correspondentes retornem valores não-nulos:

| Campo SA01v        | KPI afetado                |
|--------------------|----------------------------|
| `AcknowledgedAt`   | MTTA (`mtta.value`)        |
| `ResolvedAt`       | MTTR (`mttr.value`)        |
| `AiFirstResultAt`  | `iaPerformance.avgAiTimeMinutes` |
| `TriagedBy`        | `iaPerformance.triageAutoRate` |
| `Escalated`        | `iaPerformance.escalationRate` |
| `FirstSeenAt`      | MTTD (`mttd.value`)        |

Campos ausentes resultam em `null` nos KPIs dependentes — não em erro. O endpoint sempre retorna `200 OK`.

---

## 9. Referências

- Endpoint: `src/SecurityOne.Tickets/src/Web/Endpoints/Analytics.cs`
- DTOs: `src/SecurityOne.Tickets/src/Application/Incidents/Queries/GetSocAnalytics/SocAnalyticsDto.cs`
- Calculadora: `src/SecurityOne.Tickets/src/Application/Incidents/Queries/GetSocAnalytics/SocAnalyticsCalculator.cs`
- Handler: `src/SecurityOne.Tickets/src/Application/Incidents/Queries/GetSocAnalytics/GetSocAnalytics.cs`
- Testes unitários: `src/SecurityOne.Tickets/tests/Application.UnitTests/Incidents/`
