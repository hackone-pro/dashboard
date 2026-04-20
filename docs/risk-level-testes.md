# Risk Level — Testes Automatizados

## Como executar

```bash
cd backend
npm run test:risk
```

## Resultado esperado

```
Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
```

## Arquivo de testes

`backend/tests/risklevel.test.ts`

---

## Cenários R04

### Cenário 1 — Essentials (só firewall)

**Configuração:** apenas card Firewall com dados (raw > 0). TopHosts, CIS e IRIS ausentes.

**Validações:**
- `indiceRisco = 50` (peso redistribuído 100% para o card ativo, r=0.5)
- `dataAvailability.firewall = "ok"`
- `dataAvailability.topHosts = "missing"`, `.cis = "missing"`, `.iris = "missing"`
- Score **não é penalizado** pela ausência dos demais cards

**Resultado:** passa

---

### Cenário 2 — Firewall + Incidentes variados

**Configuração:** Firewall (r=0.6) e IRIS/Incidentes (r=0.4) com dados. TopHosts e CIS ausentes.

**Validações:**
- Pesos redistribuídos 50/50 entre os dois cards ativos
- `indiceRisco = 50` (100 × (0.5×0.6 + 0.5×0.4))
- `dataAvailability.firewall = "ok"`, `.iris = "ok"`
- `dataAvailability.topHosts = "missing"`, `.cis = "missing"`

**Resultado:** passa

---

### Cenário 3 — Full (todos os 4 cards)

**Configuração:** TopHosts (r=0.8), CIS (r=0.6), Firewall (r=0.7), IRIS (r=0.5). Pesos originais 25% cada.

**Validações:**
- `indiceRisco = 65` (100 × (0.25×0.8 + 0.25×0.6 + 0.25×0.7 + 0.25×0.5))
- Todos os cards `dataAvailability = "ok"`
- Sem regressão em relação ao comportamento anterior

**Resultado:** passa

---

## Edge cases cobertos

| Teste | Validação | Resultado |
|-------|-----------|-----------|
| Todas fontes off | `indiceRisco = null`, todos `"missing"` | passa |
| Sem penalização por cards ausentes | score 1 card ativo == score 4 cards com mesmo r | passa |
| `calcularRawPoints` — pesos 1/3/9/27 | 1+3+9+27 = 40 | passa |
| `calcularRawCIS` — lista vazia | raw = 0 | passa |
| `calcularRawCIS` — agent 100% → raw = 0 | sem risco quando totalmente conforme | passa |
| `atualizarBaseline` — warmup | `max(minFloor, raw×2)` | passa |
| `atualizarBaseline` — decay | `max(floor, raw, anterior×0.98)` | passa |
| `calcularRiscoCard` — baseline zero | r = 0 | passa |
| `calcularRiscoCard` — raw >= baseline | r = 1 (cap) | passa |
