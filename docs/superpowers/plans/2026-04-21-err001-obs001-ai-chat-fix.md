# ERR-001 + OBS-001 — Correção do Assistente de IA (Chat SOC)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o Assistente de IA que identifica qualquer tela como "Dashboard" (ERR-001) e exibe metadados técnicos brutos nas respostas (OBS-001).

**Architecture:** Correção em duas camadas: (1) Frontend — adicionar campo `nomePagina` ao metadata de cada página; (2) System Prompt — atualizar as regras via API para usar `nomePagina` e remover a instrução de listar campos disponíveis.

**Tech Stack:** React 19 + TypeScript (frontend), Customers API (`PUT /api/customers/llm/{id}` para atualizar o system prompt)

---

## Causa Raiz

### ERR-001 — IA sempre diz "Dashboard"
O campo `entity` enviado pelo frontend (ex: `"incidentes"`, `"risk-level"`) é um identificador técnico. O system prompt não mapeia esse valor a um nome de tela legível em português. Sem orientação explícita, o modelo generaliza qualquer tela com dados como "Dashboard". Adicionando `nomePagina` ao metadata e instruindo o system prompt a usá-lo, a IA passa a nomear corretamente cada tela.

### OBS-001 — Metadados técnicos expostos na resposta
O system prompt (regra 4) instrui a IA a listar brevemente os dados disponíveis quando um campo não existe. Isso faz a IA despejar chaves JSON internas (`paginaAtual`, `filtroSeveridade`, `incidentesPagina`) na resposta. Adicionalmente, o modelo usa nomes técnicos como se fossem termos de usuário. A correção é reescrever a regra 4 e adicionar instrução de linguagem natural.

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `frontend/src/pages/Dashboard.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/Incidentes.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/RiskLevel.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/SOCAnalytics.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/ThreatMap.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/MonitoriaSOC.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/MonitoriaCSC.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/VulnerabilitiesDetection.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/ArchivesIntegrity.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/ReportDash.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/ReportView.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/Reports.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/Config.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/Integrations.tsx` | Modificar | Adicionar `nomePagina` em 4 chamadas setScreenData |
| `frontend/src/pages/ServicesCatalog.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/ServicesModel.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| `frontend/src/pages/MultiTenantManager.tsx` | Modificar | Adicionar `nomePagina` ao setScreenData |
| System Prompt (Customers API DB) | Atualizar via API | Reescrever regras do assistente |

---

## Tarefa 1 — ERR-001: Adicionar `nomePagina` nas páginas principais

**Arquivos:** `Dashboard.tsx`, `Incidentes.tsx`, `RiskLevel.tsx`, `SOCAnalytics.tsx`, `ThreatMap.tsx`

- [ ] **Passo 1.1 — Dashboard.tsx**

Localizar o `setScreenData("dashboard", { ... })` em `frontend/src/pages/Dashboard.tsx:118` e adicionar `nomePagina` como **primeiro campo**:

```typescript
setScreenData("dashboard", {
  nomePagina: "Dashboard Principal",
  periodo: "24h",
  indiceRisco,
  // ... demais campos sem alteração
});
```

- [ ] **Passo 1.2 — Incidentes.tsx**

Localizar o `setScreenData("incidentes", { ... })` em `frontend/src/pages/Incidentes.tsx:37`:

```typescript
setScreenData("incidentes", {
  nomePagina: "Tela de Incidentes",
  periodo: periodo ? `${periodo.from} a ${periodo.to}` : "todos",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 1.3 — RiskLevel.tsx**

Localizar o `setScreenData("risk-level", { ... })` em `frontend/src/pages/RiskLevel.tsx:71`:

```typescript
setScreenData("risk-level", {
  nomePagina: "Nível de Risco",
  periodo: periodo ? `${periodo.from} a ${periodo.to}` : `${dias}d`,
  // ... demais campos sem alteração
});
```

- [ ] **Passo 1.4 — SOCAnalytics.tsx**

Localizar o `setScreenData("soc-analytics", { ... })` em `frontend/src/pages/SOCAnalytics.tsx:230`:

```typescript
setScreenData("soc-analytics", {
  nomePagina: "SOC Analytics",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 1.5 — ThreatMap.tsx**

Localizar o `setScreenData("threat-map", { ... })` em `frontend/src/pages/ThreatMap.tsx:37`:

```typescript
setScreenData("threat-map", {
  nomePagina: "Mapa de Ameaças",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 1.6 — Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/pages/Incidentes.tsx frontend/src/pages/RiskLevel.tsx frontend/src/pages/SOCAnalytics.tsx frontend/src/pages/ThreatMap.tsx
git commit -m "feat(chat): adiciona nomePagina ao metadata das páginas principais"
```

---

## Tarefa 2 — ERR-001: Adicionar `nomePagina` nas páginas secundárias

**Arquivos:** `MonitoriaSOC.tsx`, `MonitoriaCSC.tsx`, `VulnerabilitiesDetection.tsx`, `ArchivesIntegrity.tsx`, `ReportDash.tsx`, `ReportView.tsx`, `Reports.tsx`, `Config.tsx`, `Integrations.tsx`, `ServicesCatalog.tsx`, `ServicesModel.tsx`, `MultiTenantManager.tsx`

- [ ] **Passo 2.1 — MonitoriaSOC.tsx** (`frontend/src/pages/MonitoriaSOC.tsx:80`)

```typescript
setScreenData("monitoria-soc", {
  nomePagina: "Monitoria SOC",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 2.2 — MonitoriaCSC.tsx** (`frontend/src/pages/MonitoriaCSC.tsx:32`)

```typescript
setScreenData("monitoria-csc", {
  nomePagina: "Monitoria CSC",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 2.3 — VulnerabilitiesDetection.tsx** (`frontend/src/pages/VulnerabilitiesDetection.tsx:42`)

```typescript
setScreenData("vulnerabilidades", {
  nomePagina: "Detecção de Vulnerabilidades",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 2.4 — ArchivesIntegrity.tsx** (`frontend/src/pages/ArchivesIntegrity.tsx:45`)

```typescript
setScreenData("integridade-arquivos", {
  nomePagina: "Integridade de Arquivos",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 2.5 — ReportDash.tsx** (`frontend/src/pages/ReportDash.tsx:42`)

```typescript
setScreenData("relatorios", {
  nomePagina: "Relatórios",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 2.6 — ReportView.tsx** (`frontend/src/pages/ReportView.tsx:73`)

```typescript
setScreenData("report-view", {
  nomePagina: "Visualização de Relatório",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 2.7 — Reports.tsx** (`frontend/src/pages/Reports.tsx:37`)

```typescript
setScreenData("reports-legacy", {
  nomePagina: "Relatórios",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 2.8 — Config.tsx** (`frontend/src/pages/Config.tsx:34`)

```typescript
setScreenData("configuracoes", {
  nomePagina: "Configurações",
  // ... demais campos sem alteração
});
```

- [ ] **Passo 2.9 — Integrations.tsx** (4 chamadas em `frontend/src/pages/Integrations.tsx`)

```typescript
// linha ~279
setScreenData("integrations-ngsoc", {
  nomePagina: "Integrações NGSOC",
  // ...
});

// linha ~496
setScreenData("integrations-firewall", {
  nomePagina: "Integrações Firewall",
  // ...
});

// linha ~577
setScreenData("integrations-monitoria", {
  nomePagina: "Integrações Monitoria",
  // ...
});

// linha ~631
setScreenData("integrations-edr", {
  nomePagina: "Integrações EDR",
  // ...
});
```

- [ ] **Passo 2.10 — ServicesCatalog.tsx** (`frontend/src/pages/ServicesCatalog.tsx:22`)

```typescript
setScreenData("services-catalog", {
  nomePagina: "Catálogo de Serviços",
  // ...
});
```

- [ ] **Passo 2.11 — ServicesModel.tsx** (`frontend/src/pages/ServicesModel.tsx:38`)

```typescript
setScreenData("services-model", {
  nomePagina: "Modelo de Serviços",
  // ...
});
```

- [ ] **Passo 2.12 — MultiTenantManager.tsx** (`frontend/src/pages/MultiTenantManager.tsx:23`)

```typescript
setScreenData("multi-tenant-manager", {
  nomePagina: "Gerenciador Multi-Tenant",
  // ...
});
```

- [ ] **Passo 2.13 — Commit**

```bash
git add frontend/src/pages/MonitoriaSOC.tsx frontend/src/pages/MonitoriaCSC.tsx frontend/src/pages/VulnerabilitiesDetection.tsx frontend/src/pages/ArchivesIntegrity.tsx frontend/src/pages/ReportDash.tsx frontend/src/pages/ReportView.tsx frontend/src/pages/Reports.tsx frontend/src/pages/Config.tsx frontend/src/pages/Integrations.tsx frontend/src/pages/ServicesCatalog.tsx frontend/src/pages/ServicesModel.tsx frontend/src/pages/MultiTenantManager.tsx
git commit -m "feat(chat): adiciona nomePagina ao metadata das páginas secundárias"
```

---

## Tarefa 3 — ERR-001 + OBS-001: Atualizar o System Prompt

**O que muda:** Reescrever o system prompt armazenado na Customers API para:
- Usar `nomePagina` na identificação de tela (ERR-001)
- Remover a instrução de listar campos disponíveis (OBS-001)
- Proibir nomes técnicos de campos nas respostas (OBS-001)

### Novo system prompt

```
Você é um assistente integrado a uma plataforma web de SOC (Security Operations Center). O usuário navega por diferentes telas e, a cada mensagem, metadados da tela atual são enviados junto com a pergunta.

## REGRA CRÍTICA DE CONTEXTO
Sua ÚNICA fonte de verdade são os metadados mais recentes — ou seja, o último bloco de metadados recebido na conversa. Trate-os como uma "foto" da tela que o usuário está vendo AGORA.

Siga rigorosamente:
1. ANTES de responder qualquer pergunta, identifique qual é o bloco de metadados mais recente na conversa.
2. RESPONDA exclusivamente com base nesses metadados. Se um dado apareceu em metadados anteriores mas NÃO aparece nos metadados mais recentes, ele NÃO EXISTE para você neste momento.
3. NUNCA misture informações de blocos de metadados diferentes. Cada bloco é uma tela independente.
4. Se o usuário perguntar sobre algo que não consta nos metadados atuais, diga apenas: "Essa informação não está disponível na tela atual." Não liste nem descreva os demais campos disponíveis.
5. Se o usuário corrigir uma resposta sua, assuma que você usou dados desatualizados, peça desculpas brevemente e reanalise SOMENTE os metadados mais recentes.

## IDENTIFICAÇÃO DA TELA ATUAL
- Use o campo `nomePagina` dos metadados para identificar e nomear a tela nas respostas.
- Se `nomePagina` não estiver presente, use o campo `entity` como fallback.
- Nunca use o termo "Dashboard" para telas cujo `nomePagina` seja diferente de "Dashboard Principal".
- Exemplos corretos: "Conforme os dados da Tela de Incidentes...", "Na tela de Nível de Risco..."

## COMO INTERPRETAR OS METADADOS
- Chegam em formato estruturado (JSON) junto à mensagem do usuário.
- Representam o estado exato da tela no momento da pergunta.
- Campos ausentes = dado não se aplica à tela atual — não preencher com dados anteriores.

## FORMATO DE RESPOSTA
- Direto e objetivo.
- Use sempre linguagem natural em português. Nunca exponha nomes técnicos de campos internos (ex: `paginaAtual`, `filtroSeveridade`, `incidentesPagina`, `nomePagina`, `entity`). Se precisar mencionar um filtro ou campo, use o equivalente em linguagem natural (ex: "filtro de severidade", "página atual", "lista de incidentes").
- Cite valores EXATAMENTE como constam nos metadados atuais.
- Referencie a tela pelo `nomePagina`: "Conforme os dados da [nomePagina]..."

## MUDANÇA DE TELA
Quando os metadados mudarem (campo `entity` ou `nomePagina` diferentes), trate como RESET de contexto. Use o histórico apenas para entender o que o usuário já perguntou — nunca para extrair dados de telas passadas.
```

- [ ] **Passo 3.1 — Descobrir o ID da configuração LLM de chat (purpose=0)**

Execute o comando abaixo para obter o ID da configuração de chat armazenada na Customers API:

```bash
curl -s https://localhost:7083/api/customers/llm \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  | jq '.[] | select(.purpose == 0) | {id, llmProvider, purpose}'
```

Anotar o `id` retornado (ex: `3`). Se não houver token JWT disponível, usar as ferramentas de administração da Customers API (ex: Swagger UI em `https://localhost:7083/swagger`).

- [ ] **Passo 3.2 — Aplicar o novo system prompt via API**

Substituir `<ID>` pelo valor obtido no passo anterior e `<TOKEN_JWT>` pelo token válido:

```bash
curl -X PUT https://localhost:7083/api/customers/llm/<ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -d '{
    "systemPrompt": "Você é um assistente integrado a uma plataforma web de SOC (Security Operations Center). O usuário navega por diferentes telas e, a cada mensagem, metadados da tela atual são enviados junto com a pergunta.\n\n## REGRA CRÍTICA DE CONTEXTO\nSua ÚNICA fonte de verdade são os metadados mais recentes — ou seja, o último bloco de metadados recebido na conversa. Trate-os como uma \"foto\" da tela que o usuário está vendo AGORA.\n\nSiga rigorosamente:\n1. ANTES de responder qualquer pergunta, identifique qual é o bloco de metadados mais recente na conversa.\n2. RESPONDA exclusivamente com base nesses metadados. Se um dado apareceu em metadados anteriores mas NÃO aparece nos metadados mais recentes, ele NÃO EXISTE para você neste momento.\n3. NUNCA misture informações de blocos de metadados diferentes. Cada bloco é uma tela independente.\n4. Se o usuário perguntar sobre algo que não consta nos metadados atuais, diga apenas: \"Essa informação não está disponível na tela atual.\" Não liste nem descreva os demais campos disponíveis.\n5. Se o usuário corrigir uma resposta sua, assuma que você usou dados desatualizados, peça desculpas brevemente e reanalise SOMENTE os metadados mais recentes.\n\n## IDENTIFICAÇÃO DA TELA ATUAL\n- Use o campo `nomePagina` dos metadados para identificar e nomear a tela nas respostas.\n- Se `nomePagina` não estiver presente, use o campo `entity` como fallback.\n- Nunca use o termo \"Dashboard\" para telas cujo `nomePagina` seja diferente de \"Dashboard Principal\".\n- Exemplos corretos: \"Conforme os dados da Tela de Incidentes...\", \"Na tela de Nível de Risco...\"\n\n## COMO INTERPRETAR OS METADADOS\n- Chegam em formato estruturado (JSON) junto à mensagem do usuário.\n- Representam o estado exato da tela no momento da pergunta.\n- Campos ausentes = dado não se aplica à tela atual — não preencher com dados anteriores.\n\n## FORMATO DE RESPOSTA\n- Direto e objetivo.\n- Use sempre linguagem natural em português. Nunca exponha nomes técnicos de campos internos (ex: `paginaAtual`, `filtroSeveridade`, `incidentesPagina`, `nomePagina`, `entity`). Se precisar mencionar um filtro ou campo, use o equivalente em linguagem natural.\n- Cite valores EXATAMENTE como constam nos metadados atuais.\n- Referencie a tela pelo `nomePagina`: \"Conforme os dados da [nomePagina]...\"\n\n## MUDANÇA DE TELA\nQuando os metadados mudarem (campo `entity` ou `nomePagina` diferentes), trate como RESET de contexto. Use o histórico apenas para entender o que o usuário já perguntou — nunca para extrair dados de telas passadas."
  }'
```

Verificar que o status HTTP retornado é `200 OK`.

- [ ] **Passo 3.3 — Confirmar aplicação**

Buscar o registro atualizado e verificar o campo `systemPrompt`:

```bash
curl -s https://localhost:7083/api/customers/llm/<ID> \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  | jq '.systemPrompt' | head -c 200
```

A saída deve começar com: `"Você é um assistente integrado a uma plataforma web de SOC..."`

---

## Tarefa 4 — Validação Manual

> Sem framework de testes. Validação é feita via uso real na UI.

- [ ] **Passo 4.1 — Subir o frontend com as alterações**

```bash
cd frontend
npm run dev
```

- [ ] **Passo 4.2 — Testar ERR-001: identificação de tela**

1. Navegar até o **Dashboard Principal** → abrir o chat → perguntar: `"Que tela é essa?"`
   - Esperado: "Conforme os dados do **Dashboard Principal**..." (nunca "tela de Incidentes")

2. Navegar até **Tela de Incidentes** → abrir o chat → perguntar: `"Que tela é essa?"`
   - Esperado: "Conforme os dados da **Tela de Incidentes**..." (nunca "Dashboard")

3. Navegar até **Nível de Risco** → perguntar: `"Onde estou?"`
   - Esperado: referência a "**Nível de Risco**"

- [ ] **Passo 4.3 — Testar OBS-001: resposta para campo ausente**

Na tela de Incidentes, perguntar: `"Qual o MITRE do incidente #12832?"`

- Esperado: `"Essa informação não está disponível na tela atual."` — sem listar outros campos, sem expor nomes técnicos como `paginaAtual` ou `incidentesPagina`
- Não esperado: listar Nome, Severidade, Data como resposta alternativa

- [ ] **Passo 4.4 — Testar estabilidade de sessão**

1. Iniciar sessão no Dashboard → enviar uma mensagem
2. Navegar para Incidentes → enviar outra mensagem sobre incidentes
3. Verificar que a IA não "lembra" o contexto do Dashboard na segunda resposta

- [ ] **Passo 4.5 — Commit final de validação**

```bash
git add -A
git commit -m "fix(chat): ERR-001 nomePagina em todas as páginas + OBS-001 system prompt atualizado"
```

---

## Ordem de Implementação

```
Tarefa 1 (5 páginas principais) → Tarefa 2 (12 páginas secundárias) → Tarefa 3 (system prompt) → Tarefa 4 (validação)
```

Tarefas 1 e 2 são independentes entre si e podem ser executadas em paralelo. Tarefa 3 (system prompt) pode ser aplicada em qualquer momento, inclusive antes das tarefas de frontend — os dois fixes são ortogonais.

---

## Notas

- **ERR-002 desconsiderado** conforme instrução: será resolvido pela melhoria de metadata nas telas.
- A Tarefa 3 atualiza o system prompt **de todos os tenants** (se a Customers API não isolar por tenant individualmente, verificar o escopo antes de aplicar em produção).
- Sessões de chat abertas continuarão usando o system prompt antigo até que sejam encerradas/reiniciadas (o system prompt é injetado no início da sessão pelo backend da Customers API).
