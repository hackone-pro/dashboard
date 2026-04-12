# C01 — Configuracao LLM por finalidade (Chat vs Analitico)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar a configuracao de LLM na tela Integracoes por finalidade (Chat vs Analitico) com tabs, status por card, e dialog de confirmacao ao trocar provedor.

**Architecture:** Adicionar tipos e GET ao service layer (`llm.service.ts`), adaptar `LLMConfigPanel` para receber `purpose`, e redesenhar a secao IA em `Integrations.tsx` com tabs e estado de config por finalidade. Fluxo: pagina carrega config via GET → tabs controlam qual purpose esta visivel → cards mostram status → panel salva com `purpose`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Axios.

---

## File Structure

| Arquivo | Acao | Responsabilidade |
|---|---|---|
| `frontend/src/services/azure-api/llm.service.ts` | Modificar | Adicionar tipos (`LLMPurpose`, `LLMConfigEntry`, `LLMConfigResponse`), adicionar `getLLMConfig()`, atualizar `LLMCustomerPayload` com campo `purpose` |
| `frontend/src/componentes/chat/LLMConfigPanel.tsx` | Modificar | Receber prop `purpose`, titulo dinamico, checkbox "usar para ambos", incluir `purpose` no POST, callback `onSaved` |
| `frontend/src/pages/Integrations.tsx` | Modificar | Tabs Chat/Analitico, carregar config via GET, status por card, dialog de confirmacao, destaque visual do ativo |

---

### Task 1: Adicionar tipos e GET ao llm.service.ts

**Files:**
- Modify: `frontend/src/services/azure-api/llm.service.ts`

- [ ] **Step 1: Adicionar tipos novos**

Inserir apos o type `LLMCustomerPayload` existente (linha 28):

```typescript
export type LLMPurpose = "chat" | "analysis";

export type LLMConfigEntry = {
  providerType: ProviderType;
  model: string;
  apiKey: string;
  endpoint: string | null;
};

export type LLMConfigResponse = {
  chat: LLMConfigEntry | null;
  analysis: LLMConfigEntry | null;
};
```

- [ ] **Step 2: Adicionar campo `purpose` ao LLMCustomerPayload**

Alterar o type existente para incluir `purpose`:

```typescript
export type LLMCustomerPayload = {
  purpose: LLMPurpose;
  providerType: ProviderType;
  model: string;
  apiKey: string;
  endpoint: string | null;
  systemPrompt: string | null;
};
```

- [ ] **Step 3: Adicionar funcao getLLMConfig**

Inserir antes de `validateApiKey`:

```typescript
// ─── Busca configuracao LLM do tenant ────────────────────────────────────────

export async function getLLMConfig(): Promise<LLMConfigResponse> {
  const { data } = await axios.get<LLMConfigResponse>(
    `${CUSTOMERS_API_URL}/api/customers/llm`,
    { headers: serviceHeaders() }
  );
  return data;
}
```

- [ ] **Step 4: Verificar compilacao**

Run: `npx tsc --noEmit 2>&1 | grep llm.service`

Esperado: erro em `LLMConfigPanel.tsx` porque `saveLLMConfig` agora exige `purpose` — sera corrigido na Task 2.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/azure-api/llm.service.ts
git commit -m "feat(C01): adicionar tipos LLMPurpose/LLMConfigEntry e getLLMConfig ao service"
```

---

### Task 2: Adaptar LLMConfigPanel para receber purpose

**Files:**
- Modify: `frontend/src/componentes/chat/LLMConfigPanel.tsx`

- [ ] **Step 1: Atualizar Props e imports**

Atualizar o type `Props` para incluir `purpose` e callback `onSaved`. Adicionar import de `LLMPurpose`:

```typescript
import {
    PROVIDERS,
    ProviderType,
    LLMPurpose,
    validateApiKey,
    getAvailableModels,
    saveLLMConfig,
} from "../../services/azure-api/llm.service";

type Props = {
    providerInicial: ProviderType;
    purpose: LLMPurpose;
    onClose: () => void;
    onSaved?: (purpose: LLMPurpose, providerType: ProviderType, model: string) => void;
};
```

- [ ] **Step 2: Atualizar assinatura do componente e titulo**

Desestruturar `purpose` e `onSaved` nas props. Criar mapa de labels para finalidade. Atualizar o cabecalho:

```typescript
export default function LLMConfigPanel({
    providerInicial,
    purpose,
    onClose,
    onSaved,
}: Props) {
```

Adicionar constante de label logo apos as declaracoes de estado:

```typescript
const purposeLabel = purpose === "chat" ? "Chat com IA" : "Motor de Analises";
```

No cabecalho (dentro do `<div>` que contem "Configurar IA"), trocar:

De:
```tsx
<p className="text-white font-medium">Configurar IA</p>
<p className="text-gray-500 text-xs mt-0.5">
    Provedor: <span className="text-purple-400">{providerLabel}</span>
</p>
```

Para:
```tsx
<p className="text-white font-medium">Configurar LLM — {purposeLabel}</p>
<p className="text-gray-500 text-xs mt-0.5">
    Provedor: <span className="text-purple-400">{providerLabel}</span>
</p>
```

- [ ] **Step 3: Adicionar estado e checkbox "usar para ambos"**

Adicionar estado para o checkbox, logo apos `const [clientId, setClientId] = useState("")`:

```typescript
const [usarParaAmbos, setUsarParaAmbos] = useState(false);
```

Adicionar o checkbox no formulario, logo antes do bloco de erro (`{status === "error" && errorMsg && (`):

```tsx
{/* Usar para ambos */}
<label className="flex items-center gap-2 cursor-pointer">
    <input
        type="checkbox"
        checked={usarParaAmbos}
        onChange={(e) => setUsarParaAmbos(e.target.checked)}
        disabled={isBusy}
        className="w-4 h-4 rounded border-[#2a2040] bg-[#1a1330] text-purple-600 focus:ring-purple-500"
    />
    <span className="text-xs text-gray-400">
        Usar mesma configuracao para{" "}
        {purpose === "chat" ? "Motor de Analises" : "Chat com IA"}
    </span>
</label>
```

- [ ] **Step 4: Atualizar handleSave para incluir purpose e chamar onSaved**

Alterar a funcao `handleSave`. Trocar o bloco try inteiro:

De:
```typescript
try {
    const id = await saveLLMConfig({
        providerType: provider,
        model: modelo,
        apiKey: apiKey.trim(),
        endpoint: null,
        systemPrompt: null,
    });
    setClientId(id);
    setStatus("success");
} catch {
```

Para:
```typescript
try {
    const id = await saveLLMConfig({
        purpose,
        providerType: provider,
        model: modelo,
        apiKey: apiKey.trim(),
        endpoint: null,
        systemPrompt: null,
    });
    setClientId(id);
    setStatus("success");
    onSaved?.(purpose, provider, modelo);
    if (usarParaAmbos) {
        const outroPurpose: LLMPurpose = purpose === "chat" ? "analysis" : "chat";
        onSaved?.(outroPurpose, provider, modelo);
    }
} catch {
```

- [ ] **Step 5: Verificar compilacao**

Run: `npx tsc --noEmit 2>&1 | grep -E "LLMConfigPanel|Integrations"`

Esperado: erro em `Integrations.tsx` porque `LLMConfigPanel` agora exige `purpose` — sera corrigido na Task 3.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/componentes/chat/LLMConfigPanel.tsx
git commit -m "feat(C01): adaptar LLMConfigPanel com purpose, titulo dinamico e checkbox"
```

---

### Task 3: Redesenhar secao IA em Integrations.tsx com tabs e estado

**Files:**
- Modify: `frontend/src/pages/Integrations.tsx`

- [ ] **Step 1: Adicionar imports**

Adicionar imports no topo do arquivo, junto aos existentes:

```typescript
import { useEffect, useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { IoIosLock } from "react-icons/io";

import LLMConfigPanel from "../componentes/chat/LLMConfigPanel";
import {
    ProviderType,
    LLMPurpose,
    LLMConfigEntry,
    LLMConfigResponse,
    getLLMConfig,
    PROVIDERS,
} from "../services/azure-api/llm.service";
```

Remover o import antigo duplicado de `ProviderType` se existir.

- [ ] **Step 2: Adicionar estado de config LLM e tab no componente Integrations**

Dentro de `export default function Integrations()`, apos o estado `painelIA`, adicionar:

```typescript
// ── Estado da config LLM por finalidade ───────────────────────────────────
const [llmConfig, setLlmConfig] = useState<LLMConfigResponse>({
    chat: null,
    analysis: null,
});
const [iaTab, setIaTab] = useState<LLMPurpose>("chat");

// ── Dialog de confirmacao ─────────────────────────────────────────────────
const [confirmDialog, setConfirmDialog] = useState<{
    aberto: boolean;
    providerNovo: ProviderType;
    providerAtualLabel: string;
    providerNovoLabel: string;
} | null>(null);

// ── Carregar config LLM ao montar ─────────────────────────────────────────
useEffect(() => {
    getLLMConfig()
        .then(setLlmConfig)
        .catch(() => setLlmConfig({ chat: null, analysis: null }));
}, []);
```

- [ ] **Step 3: Atualizar abrirPainelIA para verificar provedor ativo**

Substituir a funcao `abrirPainelIA` existente por:

```typescript
function abrirPainelIA(provider: ProviderType) {
    const configAtual = llmConfig[iaTab];
    // Sem config ativa ou clicou no mesmo provedor → abre direto
    if (!configAtual || configAtual.providerType === provider) {
        setPainelIA({ aberto: true, provider });
        return;
    }
    // Tem config ativa e clicou em outro → dialog de confirmacao
    const atualLabel = PROVIDERS.find((p) => p.value === configAtual.providerType)?.label ?? "";
    const novoLabel = PROVIDERS.find((p) => p.value === provider)?.label ?? "";
    setConfirmDialog({
        aberto: true,
        providerNovo: provider,
        providerAtualLabel: atualLabel,
        providerNovoLabel: novoLabel,
    });
}
```

- [ ] **Step 4: Adicionar callback onSaved**

Adicionar funcao apos `fecharPainelIA`:

```typescript
function handleLLMSaved(purpose: LLMPurpose, providerType: ProviderType, model: string) {
    setLlmConfig((prev) => ({
        ...prev,
        [purpose]: { providerType, model, apiKey: "", endpoint: null },
    }));
}
```

- [ ] **Step 5: Atualizar o JSX do LLMConfigPanel**

Trocar a renderizacao do LLMConfigPanel existente:

De:
```tsx
{painelIA.aberto && (
    <LLMConfigPanel
        providerInicial={painelIA.provider}
        onClose={fecharPainelIA}
    />
)}
```

Para:
```tsx
{painelIA.aberto && (
    <LLMConfigPanel
        providerInicial={painelIA.provider}
        purpose={iaTab}
        onClose={fecharPainelIA}
        onSaved={handleLLMSaved}
    />
)}
```

- [ ] **Step 6: Adicionar dialog de confirmacao no JSX**

Adicionar logo apos o bloco do LLMConfigPanel:

```tsx
{/* ================= DIALOG CONFIRMACAO ================= */}
{confirmDialog?.aberto && (
    <>
        <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setConfirmDialog(null)}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-6 max-w-sm text-center shadow-2xl">
                <p className="text-2xl mb-3">⚠️</p>
                <h3 className="text-white text-sm font-medium mb-2">
                    Substituir provedor?
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-5">
                    Voce ja tem{" "}
                    <span className="text-white font-medium">
                        {confirmDialog.providerAtualLabel}
                    </span>{" "}
                    configurado para{" "}
                    <span className="text-purple-400 font-medium">
                        {iaTab === "chat" ? "Chat" : "Analitico"}
                    </span>
                    . Deseja substituir por{" "}
                    <span className="text-white font-medium">
                        {confirmDialog.providerNovoLabel}
                    </span>
                    ?
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => setConfirmDialog(null)}
                        className="px-5 py-2 rounded-lg border border-[#2d2d44] text-gray-400 text-xs hover:bg-white/5 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            setPainelIA({ aberto: true, provider: confirmDialog.providerNovo });
                            setConfirmDialog(null);
                        }}
                        className="px-5 py-2 rounded-lg bg-[#7c3aed] text-white text-xs font-medium hover:bg-[#6d28d9] transition"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    </>
)}
```

- [ ] **Step 7: Atualizar NgSocContent — props e secao IA**

Atualizar a assinatura e props do `NgSocContent`:

```typescript
function NgSocContent({
    onConfigIA,
    iaTab,
    setIaTab,
    llmConfig,
}: {
    onConfigIA: (provider: ProviderType) => void;
    iaTab: LLMPurpose;
    setIaTab: (tab: LLMPurpose) => void;
    llmConfig: LLMConfigResponse;
}) {
```

Atualizar a chamada em `Integrations`:

De:
```tsx
<NgSocContent onConfigIA={abrirPainelIA} />
```

Para:
```tsx
<NgSocContent
    onConfigIA={abrirPainelIA}
    iaTab={iaTab}
    setIaTab={setIaTab}
    llmConfig={llmConfig}
/>
```

- [ ] **Step 8: Redesenhar secao IA com tabs e status nos cards**

Dentro de `NgSocContent`, substituir todo o bloco `{/* IA — cards clicáveis ↓ */}` (da linha `<div>` com `<h3 className="text-white text-xl mb-3">Inteligência Artificial</h3>` ate o `</div>` de fechamento) por:

```tsx
{/* IA — tabs + cards clicáveis */}
<div>
    <div className="flex items-center gap-4 mb-3">
        <h3 className="text-white text-xl">Inteligencia Artificial</h3>
        <div className="flex gap-1 bg-[#1a1a2e] rounded-lg p-1">
            <button
                onClick={() => setIaTab("chat")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                    iaTab === "chat"
                        ? "bg-[#7c3aed] text-white"
                        : "text-gray-500 hover:text-gray-300"
                }`}
            >
                Chat
            </button>
            <button
                onClick={() => setIaTab("analysis")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                    iaTab === "analysis"
                        ? "bg-[#7c3aed] text-white"
                        : "text-gray-500 hover:text-gray-300"
                }`}
            >
                Analitico
            </button>
        </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
        {IA_PROVIDERS.map((ia, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === IA_PROVIDERS.length - 1;
            const configAtual = llmConfig[iaTab];
            const isAtivo = configAtual?.providerType === ia.value;

            return (
                <button
                    key={ia.value}
                    onClick={() => onConfigIA(ia.value)}
                    className={`
                        group bg-[#0F0B1C] h-[140px] flex flex-col items-center justify-center
                        transition-all duration-200
                        hover:bg-[#4B06DD]/10 hover:border-[#4B06DD]/50
                        relative overflow-hidden
                        ${isFirst ? "rounded-l-lg" : ""}
                        ${isLast ? "rounded-r-lg" : ""}
                        ${isAtivo
                            ? "border-2 border-[#7c3aed]"
                            : "border border-[#2B2736]"
                        }
                    `}
                >
                    {/* Badge ATIVO */}
                    {isAtivo && (
                        <span className="absolute top-2 right-2 bg-[#7c3aed] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                            ATIVO
                        </span>
                    )}

                    <img
                        src={ia.img}
                        className="transition-transform duration-200 group-hover:scale-105"
                    />

                    {/* Status */}
                    {isAtivo && configAtual ? (
                        <span className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-emerald-400">
                            ✓ {configAtual.model}
                        </span>
                    ) : (
                        <span className="
                            absolute bottom-3 left-0 right-0 text-center
                            text-[11px] text-purple-400 opacity-0
                            group-hover:opacity-100 transition-opacity duration-200
                        ">
                            Configurar {ia.label}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
</div>
```

- [ ] **Step 9: Verificar compilacao**

Run: `npx tsc --noEmit 2>&1 | grep -E "Integrations|LLMConfigPanel|llm.service"`

Esperado: nenhum erro nos arquivos modificados.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pages/Integrations.tsx
git commit -m "feat(C01): tabs Chat/Analitico, status por card, dialog de confirmacao na secao IA"
```

---

### Task 4: Teste manual e ajustes

**Files:**
- Todos os 3 arquivos modificados

- [ ] **Step 1: Iniciar dev server**

Run: `cd frontend && npm run dev`

- [ ] **Step 2: Testar cenario — pagina carrega sem config**

Abrir http://localhost:5173/integrations. Verificar:
- Tabs "Chat" e "Analitico" visiveis ao lado de "Inteligencia Artificial"
- Todos os 4 cards mostram hover "Configurar [Provedor]"
- Nenhum card tem badge "ATIVO"

Se o GET falhar (API nao esta pronta), os cards devem mostrar "Nao configurado" — comportamento correto.

- [ ] **Step 3: Testar cenario — clicar em card sem provedor ativo**

Clicar em qualquer card (ex: OpenAI). Verificar:
- LLMConfigPanel abre com titulo "Configurar LLM — Chat com IA"
- Checkbox "Usar mesma configuracao para Motor de Analises" presente
- Provedor correto pre-selecionado

- [ ] **Step 4: Testar cenario — trocar de tab**

Clicar em "Analitico". Verificar:
- Cards resetam status (nenhum ativo se nao tem config para analysis)
- Clicar em card abre LLMConfigPanel com titulo "Configurar LLM — Motor de Analises"

- [ ] **Step 5: Testar cenario — dialog de confirmacao**

Se conseguir salvar uma config (API disponivel):
1. Salvar OpenAI para Chat
2. Verificar que card OpenAI tem borda roxa + badge "ATIVO" + nome do modelo
3. Clicar em DeepSeek na mesma tab
4. Verificar que dialog "Substituir provedor?" aparece
5. Clicar "Cancelar" — nada acontece
6. Clicar DeepSeek novamente → "Continuar" — LLMConfigPanel abre

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "feat(C01): ajustes finais apos teste manual"
```

Apenas se houver ajustes. Se tudo OK, pular este step.
