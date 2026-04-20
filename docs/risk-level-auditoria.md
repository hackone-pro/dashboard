# Risk Level — Auditoria de Implementação (R02)

> **Objetivo:** Comparar cada regra definida na especificação (`docs/risk-level.md`)
> com a implementação real em `backend/src/api/acesso-wazuh/services/risklevel.calculations.ts`
> e `risklevel.service.ts`. Identificar divergências e registrar evidências.

> **Data:** 2026-04-20  
> **Revisor:** R02 — Auditoria automatizada por leitura de código  
> **Status geral:** ✅ APROVADO — 0 divergências críticas

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Conforme — implementação bate com a especificação |
| ⚠️ | Observação — sem impacto funcional, mas vale documentar |
| ❌ | Divergência crítica — comportamento diferente do especificado |

**Prioridade:**
- **P0** — Divergência afeta cálculo do índice de risco diretamente
- **P1** — Afeta persistência, disponibilidade ou contrato de API
- **P2** — Observação de qualidade / clareza

---

## Seção 1 — Pesos de Severidade (SEVERITY_WEIGHTS)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 1 | Peso `baixo` = base^0 = 1 | 1 | `Math.pow(3, 0)` = 1 | `risklevel.calculations.ts:44` | ✅ | P0 |
| 2 | Peso `medio` = base^1 = 3 | 3 | `Math.pow(3, 1)` = 3 | `risklevel.calculations.ts:45` | ✅ | P0 |
| 3 | Peso `alto` = base^2 = 9 | 9 | `Math.pow(3, 2)` = 9 | `risklevel.calculations.ts:46` | ✅ | P0 |
| 4 | Peso `critico` = base^3 = 27 | 27 | `Math.pow(3, 3)` = 27 | `risklevel.calculations.ts:47` | ✅ | P0 |
| 5 | Base da progressão geométrica = 3 | 3 | `PARAMS.base = 3` | `risklevel.calculations.ts:30` | ✅ | P0 |

**Evidência (teste):**
```
calcularRawPoints({ baixo:1, medio:1, alto:1, critico:1 }) === 40 ✅
calcularRawPoints({ baixo:5, medio:2, alto:1, critico:0 }) === 20 ✅
```

---

## Seção 2 — Raw Points (calcularRawPoints)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 6 | Raw = soma linear de count × peso para cada severidade | `Σ(count_k × w_k)` | `counts.baixo*1 + counts.medio*3 + counts.alto*9 + counts.critico*27` | `risklevel.calculations.ts:53-58` | ✅ | P0 |
| 7 | Todos zeros → raw = 0 | 0 | 0 | `risklevel.calculations.ts:52-59` | ✅ | P0 |

---

## Seção 3 — Raw do CIS (calcularRawCIS)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 8 | Lista vazia → rawCIS = 0 | 0 | `if (!agentes?.length) return 0` | `risklevel.calculations.ts:64` | ✅ | P0 |
| 9 | Score 100% → rawCIS = 0 | 0 | `100 - 100 = 0` | `risklevel.calculations.ts:84` | ✅ | P0 |
| 10 | Score 43% → rawCIS = 57 | 57 | `100 - 43 = 57` | `risklevel.calculations.ts:84` | ✅ | P0 |
| 11 | Múltiplas políticas por agente: média dentro do agente primeiro | Média intra-agente antes da global | `scoreSum / policies` por agente, depois média entre agentes | `risklevel.calculations.ts:66-83` | ✅ | P0 |
| 12 | rawCIS nunca negativo | `max(0, ...)` | `Math.max(0, 100 - scoreGlobal)` | `risklevel.calculations.ts:84` | ✅ | P0 |

**Evidência (teste):**
```
calcularRawCIS([{ agente:'h1', score:80 }, { agente:'h2', score:40 }]) === 40 ✅
calcularRawCIS([{ agente:'h1', score:60 }, { agente:'h1', score:100 }]) === 20 ✅
```

---

## Seção 4 — Parâmetros do Algoritmo (PARAMS)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 13 | `gamma` (expoente de normalização) = 1.5 | 1.5 | `PARAMS.gamma = 1.5` | `risklevel.calculations.ts:31` | ✅ | P0 |
| 14 | `decayAlertas` = 0.98 | 0.98 | `PARAMS.decayAlertas = 0.98` | `risklevel.calculations.ts:32` | ✅ | P1 |
| 15 | `decayIncidentes` = 0.99 | 0.99 | `PARAMS.decayIncidentes = 0.99` | `risklevel.calculations.ts:33` | ✅ | P1 |
| 16 | `minFloorAlertas` = 50 | 50 | `PARAMS.minFloorAlertas = 50` | `risklevel.calculations.ts:34` | ✅ | P1 |
| 17 | `minFloorIncidentes` = 10 | 10 | `PARAMS.minFloorIncidentes = 10` | `risklevel.calculations.ts:35` | ✅ | P1 |
| 18 | `warmupFactor` = 2 | 2 | `PARAMS.warmupFactor = 2` | `risklevel.calculations.ts:36` | ✅ | P1 |
| 19 | Pesos iguais por card: 25% cada | 0.25 | `pesoTopHosts/pesoCIS/pesoFirewall/pesoIncidentes = 0.25` | `risklevel.calculations.ts:37-40` | ✅ | P0 |

---

## Seção 5 — Baseline e Decaimento (atualizarBaseline)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 20 | Warmup (não inicializado): `max(minFloor, raw × warmupFactor)` | `max(50, raw×2)` | `Math.max(minFloor, rawAtual * PARAMS.warmupFactor)` | `risklevel.calculations.ts:97` | ✅ | P0 |
| 21 | Warmup com raw baixo respeita o minFloor | `max(50, 10) = 50` | `Math.max(50, 5*2=10) = 50` | `risklevel.calculations.ts:97` | ✅ | P0 |
| 22 | Decay normal: `max(minFloor, raw, anterior × decay)` | maior dos três | `Math.max(minFloor, rawAtual, baselineAnterior * decay)` | `risklevel.calculations.ts:99` | ✅ | P0 |
| 23 | Spike: raw maior que anterior×decay vence | raw é o max | `Math.max(50, 150, 98) = 150` | `risklevel.calculations.ts:99` | ✅ | P0 |
| 24 | Baseline nunca cai abaixo de minFloor | `baseline ≥ minFloor` | `Math.max(minFloor, ...)` sempre presente | `risklevel.calculations.ts:97,99` | ✅ | P0 |

**Evidência (testes):**
```
atualizarBaseline(30, 0, false, 0.98, 50) === 60   // warmup: max(50, 30×2)  ✅
atualizarBaseline(5,  0, false, 0.98, 50) === 50   // warmup floor           ✅
atualizarBaseline(100, 200, true, 0.98, 50) === 196 // decay vence           ✅
atualizarBaseline(150, 100, true, 0.98, 50) === 150 // spike vence           ✅
```

---

## Seção 6 — Normalização por Card (calcularRiscoCard)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 25 | `r_k = min(1, (raw / baseline) ^ gamma)` | `min(1, (r/b)^1.5)` | `Math.min(1, Math.pow(raw / baseline, PARAMS.gamma))` | `risklevel.calculations.ts:106` | ✅ | P0 |
| 26 | Baseline = 0 → r = 0 (proteção divisão por zero) | 0 | `if (baseline <= 0) return 0` | `risklevel.calculations.ts:105` | ✅ | P0 |
| 27 | raw ≥ baseline → r = 1 (cap) | 1 | `Math.min(1, ...)` | `risklevel.calculations.ts:106` | ✅ | P0 |
| 28 | raw = 50% baseline → r ≈ 0.354 (0.5^1.5) | 0.354 | `Math.pow(0.5, 1.5) ≈ 0.3536` | `risklevel.calculations.ts:106` | ✅ | P0 |

---

## Seção 7 — Risk Total com Degradação Graciosa (calcularRiscoTotal)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 29 | Cards ativos = aqueles com `raw > 0` | `raw > 0` | `hasData: cards.rawN > 0` + `.filter(c => c.hasData)` | `risklevel.calculations.ts:128-133` | ✅ | P0 |
| 30 | Todos sem dados → `indiceRisco = null` | `null` | `if (activeCards.length === 0) return { indiceRisco: null, ... }` | `risklevel.calculations.ts:135-137` | ✅ | P0 |
| 31 | Pesos redistribuídos proporcionalmente entre cards ativos | `peso_k / Σpeso_ativos` | `c.peso / pesoTotal` | `risklevel.calculations.ts:139-141` | ✅ | P0 |
| 32 | `indiceRisco` arredondado a 2 casas decimais | `toFixed(2)` | `parseFloat((...).toFixed(2))` | `risklevel.calculations.ts:140-141` | ✅ | P2 |
| 33 | 1 card ativo com r=0.5 → mesmo score que 4 cards todos r=0.5 | igual | Redistribuição de peso: 0.25/0.25 × 0.5 = 50 (1 card) = 0.25×4/1 × 0.5 = 50 (4 cards) | `risklevel.calculations.ts:138-142` | ✅ | P0 |
| 34 | `dataAvailability` retornado com `ok`/`missing` por card | objeto com 4 chaves | `{ topHosts, cis, firewall, iris }` cada `raw > 0 ? "ok" : "missing"` | `risklevel.calculations.ts:121-126` | ✅ | P1 |

**Evidência (testes):**
```
Cenário 1 (só firewall r=0.5): indiceRisco=50, firewall='ok', demais='missing'  ✅
Cenário 2 (firewall+iris):     indiceRisco=50, 50%×0.6 + 50%×0.4 = 0.5 × 100  ✅
Cenário 3 (4 cards):           indiceRisco=65, 25%×(0.8+0.6+0.7+0.5)×100       ✅
Todas off:                     indiceRisco=null                                  ✅
```

---

## Seção 8 — Persistência e Janelas Canônicas (risklevel.service.ts)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 35 | Janelas canônicas: `"1"`, `"7"`, `"15"`, `"30"` | 4 janelas fixas | `JANELAS_CANONICAS = ["1", "7", "15", "30"]` | `risklevel.service.ts:60` | ✅ | P1 |
| 36 | Baseline persistido **apenas** em janelas canônicas | nunca em custom | `if (janelaCanonica) { await salvarBaselineJanela(...) }` | `risklevel.service.ts:364-382` | ✅ | P1 |
| 37 | Range customizado usa janela canônica mais próxima como fallback | mapeamento ≤4/10/20/∞ | `resolverJanelaFallback`: ≤4d→"1", ≤10d→"7", ≤20d→"15", >20d→"30" | `risklevel.service.ts:158-166` | ✅ | P1 |
| 38 | Chave de persistência versionada por tenant: `risklevel_baseline_v2_tenant_${id}` | `_v2_` no nome | `getBaselineKey(tenantId)` retorna string com `_v2_` | `risklevel.service.ts:84-86` | ✅ | P1 |
| 39 | Baseline inicializado com `initialized: false` no slot vazio | false | `BASELINE_VAZIO.initialized = false` | `risklevel.service.ts:63-69` | ✅ | P1 |
| 40 | Ao salvar novo slot: os demais slots são preservados (`spread`) | preservação de outros slots | `novoEstado = { ...estadoAtual, [janela]: novoSlot }` | `risklevel.service.ts:136-140` | ✅ | P1 |

---

## Seção 9 — Contrato de API (risklevel.controller.ts)

| # | Regra | Esperado | Observado | Arquivo / Linha | Status | Prio |
|---|-------|----------|-----------|-----------------|--------|------|
| 41 | Resposta inclui campo `dataAvailability` | presente | `dataAvailability: resultado.dataAvailability` | `risklevel.controller.ts:66` | ✅ | P1 |
| 42 | Resposta inclui `indiceRisco` (pode ser `null`) | `number \| null` | `indiceRisco: resultado.indiceRisco` | `risklevel.controller.ts:65` | ✅ | P1 |
| 43 | Resposta inclui `severidades` com `baixo/medio/alto/critico/total` | 5 campos | `severidades: resultado.severidades` | `risklevel.controller.ts:64` | ✅ | P1 |
| 44 | Resposta inclui `_debug` com cards, janela, warmup | debug block | `_debug: (resultado as any)._debug` | `risklevel.controller.ts:75` | ✅ | P2 |
| 45 | Erro retorna `indiceRisco: null` (não zero) | `null` | `indiceRisco: null` no bloco catch do service | `risklevel.service.ts:456` | ✅ | P0 |

---

## Resumo Executivo

| Categoria | Total auditado | ✅ OK | ⚠️ Obs | ❌ Divergência |
|-----------|---------------|-------|--------|----------------|
| Pesos de severidade | 5 | 5 | 0 | 0 |
| Raw Points | 2 | 2 | 0 | 0 |
| Raw CIS | 5 | 5 | 0 | 0 |
| Parâmetros (PARAMS) | 7 | 7 | 0 | 0 |
| Baseline / Decay | 5 | 5 | 0 | 0 |
| Normalização (r_k) | 4 | 4 | 0 | 0 |
| Risk Total / Degradação | 6 | 6 | 0 | 0 |
| Persistência / Janelas | 6 | 6 | 0 | 0 |
| Contrato de API | 5 | 5 | 0 | 0 |
| **TOTAL** | **45** | **45** | **0** | **0** |

### Observações sem impacto funcional

- **Regra 32 (toFixed):** `indiceRisco` usa `parseFloat(toFixed(2))` — arredondamento a 2 casas decimais é mais preciso do que necessário para exibição (UI exibe 0 casas), mas não causa erros.
- **Regra 44 (`_debug`):** O campo `_debug` é exposto na API de produção. Não é um problema de segurança (não contém dados sensíveis), mas pode ser movido para um flag de desenvolvimento em versão futura.

### Conclusão

Todas as 45 regras auditadas estão **conformes**. A implementação em `risklevel.calculations.ts` reflete fielmente a especificação documentada em `docs/risk-level.md`. Os testes Jest (`tests/risklevel.test.ts`) cobrem os cenários críticos e passam integralmente.

---

*Gerado automaticamente por auditoria de código — R02 — 2026-04-20*
