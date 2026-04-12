# C01 — Configuracao de LLM por finalidade (Chat vs Motor de Analises)

## Resumo

Separar a configuracao de LLM na tela Integracoes > NG-SOC > Inteligencia Artificial por finalidade: **Chat** e **Analitico**. Escopo 100% frontend — assume que a Customers API sera evoluida para aceitar `purpose`.

## Contexto

Hoje a secao Inteligencia Artificial exibe 4 cards de provedores (OpenAI, DeepSeek, Gemini, Azure Foundry). Ao clicar, abre o `LLMConfigPanel` para configurar API key e modelo. Existe uma unica configuracao por tenant sem distincao de finalidade.

O sistema tem dois consumidores de LLM:
- **Chat com IA** — microservico `chat`, responde mensagens do usuario
- **Motor de Analises** — microservico `alert`, processa alertas automaticamente

## Design aprovado

### Tabs por finalidade

Ao lado do titulo "Inteligencia Artificial", adicionar tabs **Chat** | **Analitico** (estilo pill toggle). Cada tab mostra os mesmos 4 cards de provedores com status independente por finalidade.

### Cards de provedores

Manter a estrutura visual existente (imagens em `/assets/img/`, layout grid 4 colunas). Adicionar ao card:
- **Status por finalidade**: "Configurado" com nome do modelo, ou "Nao configurado"
- **Destaque visual do ativo**: borda roxa (`border-2 border-purple-600`) + badge "ATIVO" no canto superior direito
- **1 provedor por purpose**: apenas 1 card pode estar ativo por tab

### Confirmacao ao trocar provedor

Quando o usuario clica em um card diferente do ativo na mesma tab, exibir dialog de confirmacao:
- Titulo: "Substituir provedor?"
- Texto: "Voce ja tem [Provedor Atual] configurado para [Finalidade]. Deseja substituir por [Novo Provedor]?"
- Botoes: "Cancelar" | "Continuar"
- Se confirmar: abre LLMConfigPanel normalmente
- Se cancelar: nada acontece

Se nenhum provedor estiver ativo na tab, abre o LLMConfigPanel direto sem confirmacao.

### LLMConfigPanel — adaptacoes

- Receber nova prop `purpose: "chat" | "analysis"` 
- Titulo do painel indica finalidade: "Configurar LLM — Chat com IA" ou "Configurar LLM — Motor de Analises"
- Adicionar checkbox: "Usar mesma configuracao para [outra finalidade]"
  - Ao marcar, preenche visualmente o card correspondente na outra tab com os mesmos dados
  - O usuario ainda precisa abrir a outra tab e salvar manualmente (nao faz dois POSTs)
- Ao salvar, incluir `purpose` no payload do POST

## Contrato de API assumido

### GET /api/customers/llm (Customers API)

Retorno esperado:
```json
{
  "chat": {
    "providerType": 0,
    "model": "gpt-4o",
    "apiKey": "sk-...",
    "endpoint": null
  },
  "analysis": null
}
```

Se nenhuma configuracao existir, ambos os campos serao `null`. Se a API ainda nao retornar nesse formato, os cards mostram "Nao configurado" para ambas as finalidades.

### POST /api/customers/llm (Customers API)

Payload:
```json
{
  "purpose": "chat",
  "providerType": 0,
  "model": "gpt-4o",
  "apiKey": "sk-...",
  "endpoint": null,
  "systemPrompt": null
}
```

Campo `purpose` e novo — enum `"chat" | "analysis"`.

### GET /api/llm/models (Chat API)

Sem mudancas — continua agnostico de finalidade.

### POST /api/llm/validate-key (Chat API)

Sem mudancas — continua agnostico de finalidade.

## Arquivos afetados

| Arquivo | Mudanca |
|---|---|
| `pages/Integrations.tsx` | Adicionar estado de tab (`chat`/`analysis`), substituir grid de cards de IA para respeitar tab ativa, dialog de confirmacao, carregar config via GET |
| `componentes/chat/LLMConfigPanel.tsx` | Nova prop `purpose`, titulo dinamico, checkbox "usar para ambos", incluir `purpose` no POST |
| `services/azure-api/llm.service.ts` | Adicionar `getLLMConfig()` (GET), atualizar `saveLLMConfig()` para incluir `purpose` no payload |

## Tipos novos/alterados

```typescript
// llm.service.ts
export type LLMPurpose = "chat" | "analysis";

export type LLMConfigResponse = {
  chat: LLMConfigEntry | null;
  analysis: LLMConfigEntry | null;
};

export type LLMConfigEntry = {
  providerType: ProviderType;
  model: string;
  apiKey: string;
  endpoint: string | null;
};

// LLMCustomerPayload — adicionar campo
export type LLMCustomerPayload = {
  purpose: LLMPurpose;        // novo
  providerType: ProviderType;
  model: string;
  apiKey: string;
  endpoint: string | null;
  systemPrompt: string | null;
};
```

## Fluxo de dados

1. Pagina Integrations carrega → chama `getLLMConfig()` → popula estado com config de cada finalidade
2. Usuario seleciona tab (Chat ou Analitico) → grid mostra status dos cards para aquela finalidade
3. Card ativo tem destaque visual (borda roxa + badge ATIVO + nome do modelo)
4. Usuario clica em card:
   - Se nao tem ativo na tab → abre LLMConfigPanel com `purpose` da tab
   - Se tem ativo e clicou no mesmo → abre LLMConfigPanel para editar
   - Se tem ativo e clicou em outro → dialog de confirmacao → se confirmar, abre LLMConfigPanel
5. LLMConfigPanel: usuario configura API key, valida, seleciona modelo, salva
6. POST inclui `purpose` → backend salva → retorna clientId
7. Pagina atualiza estado local com nova config para aquela finalidade
8. Se checkbox "usar para ambos" estava marcado, preenche estado da outra finalidade visualmente

## Criterios de aceite

- [ ] Tabs "Chat" e "Analitico" visiveis ao lado do titulo "Inteligencia Artificial"
- [ ] Cada tab mostra os 4 cards de provedores com status independente
- [ ] Card ativo tem borda roxa + badge "ATIVO" + nome do modelo
- [ ] Apenas 1 provedor ativo por finalidade
- [ ] Confirmacao ao trocar provedor quando ja tem um ativo
- [ ] LLMConfigPanel indica finalidade no titulo
- [ ] Checkbox "Usar mesma configuracao para [outra finalidade]" funciona visualmente
- [ ] GET carrega configuracoes existentes ao abrir a pagina
- [ ] POST inclui campo `purpose` no payload
- [ ] Cards exibem "Nao configurado" quando GET retorna null ou falha
