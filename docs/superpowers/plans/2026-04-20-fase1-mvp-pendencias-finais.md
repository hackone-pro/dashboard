# Fase 1 MVP — Pendências Finais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar as 3 lacunas reais da Fase 1 MVP: derivar AcknowledgedAt no IrisIncidentParser (SA01v), adicionar drill-down de origem nos KPIs de incidentes (SA03), e criar documentação do SOC Analytics API (SA02).

**Architecture:** Duas bases de código independentes — `Hackone/src/SecurityOne.Tickets` (.NET 9, NUnit + Shouldly) e `Security one/frontend` (React 19 + Vite, sem framework de teste). Cada task é isolada; commits em repos separados.

**Tech Stack:** C# 13 / .NET 9 (NUnit, Shouldly), TypeScript / React Router 7 (useSearchParams).

---

## Mapa de arquivos

| Arquivo | Operação | Tarefa |
|---------|----------|--------|
| `Hackone/src/SecurityOne.Tickets/src/Application/Incidents/Parsers/IrisIncidentParser.cs` | Modify | SA01v |
| `Hackone/src/SecurityOne.Tickets/tests/Application.UnitTests/Incidents/IrisIncidentParserTests.cs` | Modify | SA01v |
| `Security one/frontend/src/hooks/useIncidentes.ts` | Modify | SA03 |
| `Security one/frontend/src/pages/SOCAnalytics.tsx` | Modify | SA03 |
| `Security one/docs/soc-analytics-api.md` | Create | SA02 doc |

---

## Task 1: SA01v — Derivar AcknowledgedAt no IrisIncidentParser (TDD)

**Files:**
- Modify: `Hackone/src/SecurityOne.Tickets/tests/Application.UnitTests/Incidents/IrisIncidentParserTests.cs`
- Modify: `Hackone/src/SecurityOne.Tickets/src/Application/Incidents/Parsers/IrisIncidentParser.cs`

### Por que este gap existe

O método `Parse` só lê `acknowledged_at` diretamente do payload JSON. Quando o IRIS muda o status para `triage` ou `in_progress` sem enviar o campo `acknowledged_at`, o campo fica `null` e o MTTA do SOC Analytics não é calculado.

---

- [ ] **Step 1: Escrever os testes falhando**

Adicionar ao final de `IrisIncidentParserTests.cs` (antes do último `}`):

```csharp
// ── SA01v: AcknowledgedAt derivado do status ─────────────────────────────────

[Test]
public void Parse_StatusTriageWithoutAcknowledgedAt_DerivesAcknowledgedAt()
{
    var json = """
    {
      "incident_id": "inc-001",
      "tenant_id": "tenant-a",
      "status": "triage",
      "detected_at": "2026-04-17T10:05:00Z",
      "created_at": "2026-04-17T10:00:00Z"
    }
    """;

    var incident = _parser.Parse(json, "tenant-a", "iris");

    incident.AcknowledgedAt.ShouldNotBeNull();
    incident.AcknowledgedAt!.Value.ToUniversalTime()
        .ShouldBe(new DateTimeOffset(2026, 4, 17, 10, 5, 0, TimeSpan.Zero));
}

[Test]
public void Parse_StatusInProgressWithoutAcknowledgedAt_DerivesAcknowledgedAt()
{
    var json = """
    {
      "incident_id": "inc-001",
      "tenant_id": "tenant-a",
      "status": "in_progress",
      "detected_at": "2026-04-17T10:05:00Z",
      "created_at": "2026-04-17T10:00:00Z"
    }
    """;

    var incident = _parser.Parse(json, "tenant-a", "iris");

    incident.AcknowledgedAt.ShouldNotBeNull();
}

[Test]
public void Parse_StatusOpenWithoutAcknowledgedAt_LeavesAcknowledgedAtNull()
{
    var json = """
    {
      "incident_id": "inc-001",
      "tenant_id": "tenant-a",
      "status": "open",
      "detected_at": "2026-04-17T10:05:00Z",
      "created_at": "2026-04-17T10:00:00Z"
    }
    """;

    var incident = _parser.Parse(json, "tenant-a", "iris");

    incident.AcknowledgedAt.ShouldBeNull();
}

[Test]
public void Parse_ExplicitAcknowledgedAtTakesPrecedenceOverStatus()
{
    var json = """
    {
      "incident_id": "inc-001",
      "tenant_id": "tenant-a",
      "status": "triage",
      "detected_at": "2026-04-17T10:05:00Z",
      "created_at": "2026-04-17T10:00:00Z",
      "acknowledged_at": "2026-04-17T10:03:00Z"
    }
    """;

    var incident = _parser.Parse(json, "tenant-a", "iris");

    incident.AcknowledgedAt!.Value.ToUniversalTime()
        .ShouldBe(new DateTimeOffset(2026, 4, 17, 10, 3, 0, TimeSpan.Zero));
}
```

- [ ] **Step 2: Rodar os testes para confirmar FAIL**

```bash
cd "C:/Users/Guilherme/source/repos/Hackone/src/SecurityOne.Tickets"
dotnet test tests/Application.UnitTests \
  --filter "FullyQualifiedName~IrisIncidentParserTests" \
  --no-build -v minimal
```

Esperado: 3 testes novos FAIL (`Parse_StatusTriageWithoutAcknowledgedAt_DerivesAcknowledgedAt`, `Parse_StatusInProgressWithoutAcknowledgedAt_DerivesAcknowledgedAt`, `Parse_ExplicitAcknowledgedAtTakesPrecedenceOverStatus`).

- [ ] **Step 3: Implementar a derivação em IrisIncidentParser.cs**

Substituir o método `Parse` existente. A mudança é: extrair `status`, `createdAt` e `detectedAt` como variáveis locais **antes** do inicializador de objeto, para que `AcknowledgedAt` possa referenciar `status`.

Localizar a linha que começa com `var incident = new Incident` e substituir o bloco inteiro de inicialização:

**Antes** (trecho relevante, linha ~33):
```csharp
        var incident = new Incident
        {
            IncidentId = GetJsonString(json, "incident_id") ?? throw new ArgumentException("incident_id is required"),
            TenantId = tenantId ?? GetJsonString(json, "tenant_id") ?? GetJsonString(json, "org_id") ?? throw new ArgumentException("tenant_id is required"),
            Severity = MapSeverityFromJson(json, caseRaw),
            Status = MapStatusFromJson(json, caseRaw),
            Version = DateTimeOffset.UtcNow,
            CreatedAt = GetJsonDateTime(json, "created_at") ?? GetDateTimeFromCaseRaw(caseRaw, "initial_date") ?? DateTimeOffset.UtcNow,
            FirstSeenAt = GetJsonDateTime(json, "first_seen_at") ?? GetDateTimeFromCaseRaw(caseRaw, "initial_date") ?? DateTimeOffset.UtcNow,
            DetectedAt = GetJsonDateTime(json, "detected_at") ?? GetDateTimeFromCaseRaw(caseRaw, "initial_date") ?? DateTimeOffset.UtcNow,
            AcknowledgedAt = GetJsonDateTime(json, "acknowledged_at"),
```

**Depois** — extrair variáveis locais antes do `new Incident { ... }`:

```csharp
        var status     = MapStatusFromJson(json, caseRaw);
        var createdAt  = GetJsonDateTime(json, "created_at")  ?? GetDateTimeFromCaseRaw(caseRaw, "initial_date") ?? DateTimeOffset.UtcNow;
        var detectedAt = GetJsonDateTime(json, "detected_at") ?? GetDateTimeFromCaseRaw(caseRaw, "initial_date") ?? DateTimeOffset.UtcNow;

        var incident = new Incident
        {
            IncidentId = GetJsonString(json, "incident_id") ?? throw new ArgumentException("incident_id is required"),
            TenantId = tenantId ?? GetJsonString(json, "tenant_id") ?? GetJsonString(json, "org_id") ?? throw new ArgumentException("tenant_id is required"),
            Severity = MapSeverityFromJson(json, caseRaw),
            Status = status,
            Version = DateTimeOffset.UtcNow,
            CreatedAt = createdAt,
            FirstSeenAt = GetJsonDateTime(json, "first_seen_at") ?? GetDateTimeFromCaseRaw(caseRaw, "initial_date") ?? DateTimeOffset.UtcNow,
            DetectedAt = detectedAt,
            AcknowledgedAt = GetJsonDateTime(json, "acknowledged_at")
                ?? DeriveAcknowledgedAt(status, detectedAt),
```

Depois, adicionar o método privado estático ao final da classe (antes do último `}`):

```csharp
    private static DateTimeOffset? DeriveAcknowledgedAt(
        IncidentStatus status, DateTimeOffset detectedAt)
    {
        return status is IncidentStatus.TRIAGE
            or IncidentStatus.IN_PROGRESS
            or IncidentStatus.RESOLVED
            or IncidentStatus.CLOSED
            ? detectedAt
            : null;
    }
```

- [ ] **Step 4: Rodar todos os testes do IrisIncidentParser para confirmar PASS**

```bash
dotnet test tests/Application.UnitTests \
  --filter "FullyQualifiedName~IrisIncidentParserTests" \
  --no-build -v minimal
```

Esperado: todos os testes PASS (incluindo o antigo `Parse_WithoutSA01vFields_LeavesNullable`, que usa `MinimalJson` sem campo `status` — o parser faz fallback para `OPEN`, então `AcknowledgedAt` deve permanecer null ✅).

- [ ] **Step 5: Rodar a suíte completa para checar regressões**

```bash
dotnet test tests/Application.UnitTests --no-build -v minimal
```

Esperado: todos os testes PASS.

- [ ] **Step 6: Commit no repositório Hackone**

```bash
cd "C:/Users/Guilherme/source/repos/Hackone"
git add src/SecurityOne.Tickets/src/Application/Incidents/Parsers/IrisIncidentParser.cs
git add src/SecurityOne.Tickets/tests/Application.UnitTests/Incidents/IrisIncidentParserTests.cs
git commit -m "$(cat <<'EOF'
feat(SA01v): deriva AcknowledgedAt do status quando campo ausente no payload IRIS

Garante que MTTA seja calculado corretamente em incidentes triados via IRIS
mesmo quando o campo acknowledged_at não é enviado explicitamente.
Status TRIAGE/IN_PROGRESS/RESOLVED/CLOSED usam detectedAt como fallback.
Cobre 4 novos casos de teste.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: SA03 — Drill-down de "Incidentes Abertos" com filtro de origem

**Files:**
- Modify: `Security one/frontend/src/hooks/useIncidentes.ts`
- Modify: `Security one/frontend/src/pages/SOCAnalytics.tsx`

### Contexto

`useIncidentes` já lê `severity` de `useSearchParams` (linha 166). Basta adicionar leitura para `origem` e mapear para `filtroOrigem`. No SOCAnalytics, o card "Incidentes Abertos" navegará para `/incidentes?origem=abertos`.

Os outros 3 KPIs (MTTD/MTTA/MTTR) já navegam para `/incidentes` sem filtro — isso é aceitável: o usuário vê todos os incidentes do período atual ao clicar neles.

---

- [ ] **Step 1: Adicionar leitura de `origem` em useIncidentes.ts**

Localizar (linha ~165):
```typescript
  const openFromQS = searchParams.get("open");
  const severityFromQS = searchParams.get("severity");
```

Adicionar após:
```typescript
  const origemFromQS = searchParams.get("origem");
```

Localizar o useEffect que aplica `severityFromQS` (linha ~303):
```typescript
    if (severityFromQS) setFiltroSeveridade(severityFromQS);
  }, [severityFromQS]);
```

Adicionar um segundo useEffect logo após:
```typescript
  useEffect(() => {
    if (origemFromQS === "abertos") setFiltroOrigem("abertos");
  }, [origemFromQS]);
```

- [ ] **Step 2: Atualizar navigate no SOCAnalytics.tsx para o card de Incidentes Abertos**

Localizar (linha ~418):
```tsx
                alert={openIncidents?.badge && openIncidents.badge !== "Normal" ? openIncidents.badge : undefined}
                onClick={() => navigate("/incidentes")}
```

Substituir o `onClick` do último MetricCard (Incidentes Abertos):
```tsx
                alert={openIncidents?.badge && openIncidents.badge !== "Normal" ? openIncidents.badge : undefined}
                onClick={() => navigate("/incidentes?origem=abertos")}
```

- [ ] **Step 3: Verificar no browser**

1. Iniciar o dev server: `cd "frontend" && npm run dev`
2. Abrir SOC Analytics
3. Clicar no card "Incidentes Abertos"
4. Confirmar que a página de Incidentes abre com o filtro "abertos" pré-selecionado (donut/contador mostra apenas incidentes em aberto)
5. Clicar nos outros 3 KPIs (MTTD/MTTA/MTTR) — confirmar que abrem `/incidentes` sem filtro aplicado
6. Clicar em fatia do donut — confirmar que abre `/incidentes?severity=<label>` com filtro de severidade

- [ ] **Step 4: Commit no repositório Security one**

```bash
cd "C:/Users/Guilherme/source/repos/Security one"
git add frontend/src/hooks/useIncidentes.ts
git add frontend/src/pages/SOCAnalytics.tsx
git commit -m "$(cat <<'EOF'
feat(SA03): drill-down de Incidentes Abertos com filtro de origem via URL

Card 'Incidentes Abertos' no SOC Analytics navega para /incidentes?origem=abertos,
que é lido pelo useIncidentes para pré-selecionar o filtro de abertos.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: SA02 — Criar docs/soc-analytics-api.md

**Files:**
- Create: `Security one/docs/soc-analytics-api.md`

---

- [ ] **Step 1: Criar o arquivo de documentação**

Criar `docs/soc-analytics-api.md` com o conteúdo abaixo:

````markdown
# SOC Analytics API

Endpoint: `GET /api/analytics/soc`

Retorna KPIs operacionais do SOC para o tenant autenticado. Autenticação via Bearer JWT. Tenant isolado via `IUser.TenantId` extraído do token.

---

## Query Parameters

| Parâmetro   | Tipo     | Obrigatório | Padrão | Descrição |
|-------------|----------|-------------|--------|-----------|
| `periodType`  | string | não | `Day` | `Day` \| `Week` \| `Month` \| `Quarter` \| `Year` \| `Custom` (case-insensitive) |
| `startDate` | ISO 8601 | condicional | — | Obrigatório quando `periodType=Custom` |
| `endDate`   | ISO 8601 | condicional | — | Obrigatório quando `periodType=Custom` |

**Período anterior:** calculado automaticamente como a janela de mesmo tamanho imediatamente anterior ao período atual (usado para calcular deltas %).

---

## Response Schema

```json
{
  "mttd": { "$ref": "#/KpiMetric" },
  "mtta": { "$ref": "#/KpiMetric" },
  "mttr": { "$ref": "#/KpiMetric" },
  "openIncidents": { "$ref": "#/OpenIncidentsKpi" },
  "severityDistribution": { "$ref": "#/SeverityDistribution" },
  "riskLevel": { "$ref": "#/RiskLevel" },
  "iaPerformance": { "$ref": "#/IaPerformance" },
  "period": { "$ref": "#/PeriodInfo" }
}
```

---

### KpiMetric

Usado por `mttd`, `mtta`, `mttr`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `value` | `number \| null` | Valor médio no período atual. `null` se não houver dados. |
| `previousValue` | `number \| null` | Valor médio no período anterior. |
| `deltaPercent` | `number \| null` | `(current - previous) / previous * 100`. `null` se período anterior vazio. |
| `unit` | `string` | `"minutes"` ou `"hours"` (automaticamente convertido quando ≥ 60 min). |
| `trend` | `"improving" \| "worsening" \| "stable" \| null` | Para métricas de tempo, `"improving"` = valor caiu = positivo. |

**MTTD** = média de `(DetectedAt - FirstSeenAt)` nos incidentes criados no período.  
**MTTA** = média de `(AcknowledgedAt - CreatedAt)` nos incidentes com `AcknowledgedAt` preenchido.  
**MTTR** = média de `(ResolvedAt - CreatedAt)` nos incidentes com status `RESOLVED` ou `CLOSED`.

---

### OpenIncidentsKpi

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `count` | `number` | Total de incidentes não resolvidos no momento. |
| `previousCount` | `number` | Total de incidentes abertos no início do período anterior. |
| `deltaPercent` | `number \| null` | Variação percentual em relação ao período anterior. |
| `badge` | `"Normal" \| "Attention" \| "High Alert"` | `High Alert` se há crítico aberto ou count > 1.5× anterior; `Attention` se count > anterior; `Normal` caso contrário. |
| `hasCritical` | `boolean` | `true` se há ao menos um incidente CRITICAL aberto. |

---

### SeverityDistribution

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `buckets` | `SeverityBucket[]` | Um bucket por severidade (LOW, MEDIUM, HIGH, CRITICAL). |
| `total` | `number` | Total de incidentes no período. |

**SeverityBucket:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `severity` | `string` | `"LOW"` \| `"MEDIUM"` \| `"HIGH"` \| `"CRITICAL"` |
| `count` | `number` | Quantidade no período atual. |
| `percent` | `number` | `count / total * 100`, arredondado a 1 casa. |
| `previousCount` | `number \| null` | Quantidade no período anterior. |
| `deltaPercent` | `number \| null` | Variação %. |

---

### RiskLevel

Score simplificado baseado em incidentes **abertos** (não no período histórico).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `score` | `number` | 0–100. Fórmula: `(critical×40 + high×25 + medium×10 + low×2) / total × 10`, capped em 100. |
| `level` | `"Low" \| "Medium" \| "High" \| "Critical"` | Derivado do score: ≥75 Critical, ≥50 High, ≥25 Medium, <25 Low. |
| `alertsBySeverity` | `{ severity, count }[]` | Contagem de incidentes abertos por severidade. |

---

### IaPerformance

Métricas de eficiência da IA/automação N1. Depende dos campos de instrumentação SA01v (`TriagedBy`, `AiFirstResultAt`, `Escalated`).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `triageAutoRate` | `number \| null` | % de incidentes triados pela IA no período. `null` se sem dados. |
| `prevTriageAutoRate` | `number \| null` | Idem para período anterior. |
| `triageAutoRateDeltaPct` | `number \| null` | Delta %. |
| `avgAiTimeMinutes` | `number \| null` | Média de `(AiFirstResultAt - CreatedAt)` em minutos. `null` se sem dados. |
| `prevAvgAiTimeMinutes` | `number \| null` | Idem para período anterior. |
| `avgAiTimeMinutesDeltaPct` | `number \| null` | Delta %. |
| `escalationRate` | `number \| null` | % de incidentes escalados (N1 → N2). |
| `prevEscalationRate` | `number \| null` | Idem para período anterior. |
| `escalationRateDeltaPct` | `number \| null` | Delta %. |

> **Nota:** Se os campos SA01v não estiverem preenchidos (incidentes históricos sem `TriagedBy` / `AiFirstResultAt`), todas as métricas de IA retornam `null`. Isso é esperado até que SA01v seja validado em runtime.

---

### PeriodInfo

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `currentStart` | ISO 8601 | Início do período atual. |
| `currentEnd` | ISO 8601 | Fim do período atual. |
| `previousStart` | ISO 8601 | Início do período anterior. |
| `previousEnd` | ISO 8601 | Fim do período anterior. |
| `periodType` | `string` | Período solicitado (ex: `"Week"`). |

---

## Exemplos

### Request — Semana atual

```http
GET /api/analytics/soc?periodType=Week
Authorization: Bearer <token>
```

### Request — Período customizado

```http
GET /api/analytics/soc?periodType=Custom&startDate=2026-04-01T00:00:00Z&endDate=2026-04-14T23:59:59Z
Authorization: Bearer <token>
```

### Response (trecho)

```json
{
  "mttd": { "value": 12.5, "unit": "minutes", "trend": "improving", "deltaPercent": -8.3 },
  "mtta": { "value": 3.2, "unit": "hours", "trend": "worsening", "deltaPercent": 15.0 },
  "openIncidents": { "count": 7, "badge": "Attention", "hasCritical": false, "deltaPercent": 16.7 },
  "iaPerformance": {
    "triageAutoRate": 72.5,
    "avgAiTimeMinutes": 4.2,
    "escalationRate": 8.0
  }
}
```

---

## Performance

- Índice composto `IX_Incidents_TenantId_CreatedAt` criado em `20260420140753_AddSA02CompositeIndex`.
- Cálculo on-demand (sem cron de pré-agregação). Aceitável para MVP. Monitorar p95 quando tenant ultrapassar 50k incidentes/mês.

## Dependências

- SA01v: campos `AcknowledgedAt`, `ResolvedAt`, `TriagedBy`, `AiFirstResultAt`, `Escalated` devem estar preenchidos para MTTA/MTTR/IaPerformance retornarem valores não-nulos.
````

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/Guilherme/source/repos/Security one"
git add docs/soc-analytics-api.md
git commit -m "$(cat <<'EOF'
docs(SA02): cria docs/soc-analytics-api.md com contrato completo do endpoint

Documenta schema, parâmetros, exemplos, performance e dependências do
GET /api/analytics/soc. Referência para frontend e integrações futuras.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Checklist de conclusão

- [ ] SA01v: `AcknowledgedAt` preenchido para incidentes triados pelo IRIS com status TRIAGE/IN_PROGRESS
- [ ] SA01v: 4 novos testes passando em `IrisIncidentParserTests`
- [ ] SA03: Card "Incidentes Abertos" navega para `/incidentes?origem=abertos` com filtro pré-aplicado
- [ ] SA03: Donut drill-down por severidade continua funcionando (`?severity=<label>`)
- [ ] SA02: `docs/soc-analytics-api.md` criado e coerente com o código

---

## Self-Review

**Spec coverage:**
- SA01v derivação AcknowledgedAt → Task 1 ✅
- SA01v testes de runtime → Task 1 (TDD) ✅
- SA03 drill-down Incidentes Abertos → Task 2 ✅
- SA03 donut drill-down → já funciona (useIncidentes lê `severity` da URL) ✅
- SA02 doc → Task 3 ✅
- T01v → já verificado: NormalizedEventExtractorTests (15+ testes) + IrisIncidentParserTests (T01 fields) ✅

**Não escopo deste plano:**
- SA03 layout Figma — requer revisão manual de design, fora do escopo de código
- SA03 responsividade — requer teste em device/emulador
- Cron de pré-agregação SA02 — documentado como on-demand para MVP
