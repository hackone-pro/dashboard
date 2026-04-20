# Risk Level — Especificação do Algoritmo

> Documento de referência para o cálculo do índice de risco operacional.
> Fonte canônica: `backend/src/api/acesso-wazuh/services/risklevel.service.ts`
> e `backend/src/api/acesso-wazuh/services/risklevel.calculations.ts` (após R03).

---

## 1. Pipeline

```
Fontes externas          Cálculo                Persistência         Endpoint
─────────────────────────────────────────────────────────────────────────────────
Wazuh (Top Hosts)  ──┐
Wazuh (CIS)        ──┤  calcularRiskOperacionalTenant()  ──→  strapi.store    ──→  GET /api/acesso/wazuh/riskLevel
Wazuh (Firewall)   ──┤       ↓                              (por tenant, por       Query: dias|firewall|agentes|iris
IRIS (Incidentes)  ──┘  raw → baseline → r_k → RiskTotal     janela canônica)      from|to
                                ↑
                         cron snapshotRiskDebug (0 */5 * * *)
```

---

## 2. Cards e Fontes de Dados

| Card | Fonte | Métrica | Tipo de Dado |
|------|-------|---------|-------------|
| Top Hosts | Wazuh `buscarTopAgentes` | Alertas por severidade (Wazuh rule level) | `SeveridadeCounts` |
| CIS | Wazuh `buscarTopAgentesCis` | Score de conformidade CIS (0–100%) | `number` (não-conformidade) |
| Firewall | Wazuh `buscarTopGeradoresFirewall` | Eventos por severidade | `SeveridadeCounts` |
| Incidentes | IRIS `buscarIncidentesIris` | Incidentes abertos por severidade | `SeveridadeCounts` |

### Mapeamento de Severidade (Top Hosts / Firewall)

| Wazuh level | Bucket |
|-------------|--------|
| 1–6         | `baixo` |
| 7–11        | `medio` |
| 12–14       | `alto` |
| 15+         | `critico` |

---

## 3. Pesos por Severidade

Os Raw Points de cada card são calculados como:

```
raw = baixo×1 + medio×3 + alto×9 + critico×27
```

Base exponencial: **3**. Pesos: `[1, 3, 9, 27]` (base^0 … base^3).

**Exemplo:** card com 5 alertas baixo, 2 médio, 1 alto, 0 crítico:
```
raw = 5×1 + 2×3 + 1×9 + 0×27 = 5 + 6 + 9 + 0 = 20
```

### Raw do CIS (especial)

O CIS usa score de conformidade (%), não contagem de eventos. Converte para "não-conformidade":
```
raw_cis = 100 - scoreGlobal
```
Onde `scoreGlobal` é a média do score por agente. Ex: 43% de conformidade → raw = 57.

---

## 4. Baseline e Decaimento

O baseline adapta-se ao volume histórico do tenant, evitando alarmes falsos em tenants com poucos dados.

### Fórmula

```
baseline(t) = max(minFloor, raw(t), baseline(t-1) × decay)
```

### Warmup (primeiro acesso de uma janela)

```
baseline(0) = max(minFloor, raw(0) × warmupFactor)
```

### Parâmetros por tipo de card

| Parâmetro | Alertas (Top Hosts, CIS, Firewall) | Incidentes (IRIS) |
|-----------|-----------------------------------|-------------------|
| `decay`   | 0.98 | 0.99 |
| `minFloor` | 50 | 10 |
| `warmupFactor` | 2 | 2 |

### Janelas Canônicas e Persistência

O baseline é persistido **por tenant × por janela canônica** (`"1"`, `"7"`, `"15"`, `"30"` dias).

- Janelas canônicas: todos os cards no mesmo período fixo → baseline persistido.
- Range customizado (`periodo`): usa a janela canônica mais próxima como fallback; **nunca persiste**.

### Fallback para ranges customizados

| Duração do range | Janela fallback |
|-----------------|----------------|
| ≤ 4d | "1" |
| ≤ 10d | "7" |
| ≤ 20d | "15" |
| > 20d | "30" |

---

## 5. Normalização do Card (r_k)

```
r_k = min(1, (raw / baseline) ^ γ)
```

Onde `γ = 1.5` (agressividade da curva). Range: [0, 1].

**Exemplo:** raw = 100, baseline = 200 → `r = min(1, (100/200)^1.5) = min(1, 0.354) = 0.354`

---

## 6. Risk Total (0–100)

```
RiskTotal = 100 × (w1×r1 + w2×r2 + w3×r3 + w4×r4)
```

**Pesos padrão (Essentials + Full):** cada card = 0.25 (soma = 1).

**Degradação graciosa (após R03):** se um card não tem dados, seu peso é redistribuído entre os cards ativos:
```
pesoCard_i_efetivo = peso_i / Σ(pesos dos cards com dados)
```

Se **todos** os cards estão sem dados: `indiceRisco = null`.

---

## 7. Contrato do Endpoint

```
GET /api/acesso/wazuh/riskLevel
```

### Query params

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `dias` | string | `"1"` | Janela global (1/7/15/30) |
| `firewall` | string | `dias` | Override por card |
| `agentes` | string | `dias` | Override por card |
| `iris` | string | `dias` | Override por card |
| `from` | ISO string | — | Início do range customizado |
| `to` | ISO string | — | Fim do range customizado |

### Response (após R03)

```json
{
  "severidades": {
    "baixo": 12,
    "medio": 5,
    "alto": 2,
    "critico": 0,
    "total": 19
  },
  "indiceRisco": 34.5,
  "dataAvailability": {
    "topHosts": "ok",
    "cis": "missing",
    "firewall": "ok",
    "iris": "ok"
  },
  "filtrosUsados": { "..." : "..." },
  "_debug": { "..." : "..." }
}
```

`indiceRisco` é `null` quando todas as fontes estão indisponíveis.

---

## 8. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Wazuh off (wazuh_url nulo) | Cards Top Hosts, CIS, Firewall retornam `[]` → raw = 0 → peso redistribuído (R03) |
| IRIS off (iris_url nulo) | Card Incidentes retorna `null` → raw = 0 → peso redistribuído (R03) |
| Todas fontes off | `indiceRisco = null`, `dataAvailability` indica cada fonte como "missing" |
| Primeira execução (warmup) | `baseline = max(minFloor, raw × 2)` — baseline duplo do primeiro raw |
| Tenant sem incidentes no IRIS | `countsIncidents = {0,0,0,0}` → raw = 0, mesma lógica de source missing |
| Range customizado | Não persiste baseline; usa fallback da janela canônica mais próxima |

---

## 9. Constantes Parametrizáveis

Todas em `PARAMS` em `risklevel.calculations.ts` (após R03):

| Constante | Valor atual | Efeito de aumentar |
|-----------|------------|-------------------|
| `base` | 3 | Severidades críticas pesam mais |
| `gamma` | 1.5 | Curva de normalização mais agressiva |
| `decayAlertas` | 0.98 | Baseline decresce mais rápido |
| `decayIncidentes` | 0.99 | Baseline de incidentes mais estável |
| `minFloorAlertas` | 50 | Score não cai abaixo desse raw mínimo |
| `minFloorIncidentes` | 10 | Idem para incidentes |
| `warmupFactor` | 2 | Baseline inicial mais alto (menos sensível) |

---

## 10. Referências

- Algoritmo: `backend/src/api/acesso-wazuh/services/risklevel.calculations.ts`
- Service (orquestração + I/O Strapi): `backend/src/api/acesso-wazuh/services/risklevel.service.ts`
- Controller: `backend/src/api/acesso-wazuh/controllers/risklevel.controller.ts`
- Cron: `backend/config/cron-tasks.ts` → `snapshotRiskDebug` (a cada 5 min)
- Frontend: `frontend/src/pages/RiskLevel.tsx`
- Testes: `backend/tests/risklevel.test.ts`
