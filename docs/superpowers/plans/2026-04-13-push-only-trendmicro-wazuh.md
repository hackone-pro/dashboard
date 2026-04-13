# Push-only Source Config — Trend Micro e Wazuh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `allowedFetchTypes` prop to SourceConfigModal and enable Push-only configuration for Trend Micro (EDR/XDR) and Wazuh (NG-SOC) cards.

**Architecture:** Modify existing SourceConfigModal to accept optional `allowedFetchTypes` prop, then integrate into NgSocContent and EndpointsContent following the same pattern as FirewallContent.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing SourceConfigModal + source.service.

**Note:** No test framework configured. Validation via `npm run dev` and browser testing.

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Modify | `frontend/src/componentes/integrations/SourceConfigModal.tsx` | Add allowedFetchTypes prop |
| Modify | `frontend/src/pages/Integrations.tsx` | Wire Wazuh and Trend Micro cards |

---

### Task 1: Add allowedFetchTypes prop to SourceConfigModal

**Files:**
- Modify: `frontend/src/componentes/integrations/SourceConfigModal.tsx`

- [ ] **Step 1: Update the props interface (line 17-22)**

Replace:
```typescript
interface SourceConfigModalProps {
  open: boolean;
  onClose: () => void;
  product: string;
  vendor: string;
}
```

With:
```typescript
interface SourceConfigModalProps {
  open: boolean;
  onClose: () => void;
  product: string;
  vendor: string;
  allowedFetchTypes?: FetchType[];
}
```

- [ ] **Step 2: Destructure the new prop and derive helpers (line 82-87)**

Replace:
```typescript
export default function SourceConfigModal({
  open,
  onClose,
  product,
  vendor,
}: SourceConfigModalProps) {
```

With:
```typescript
export default function SourceConfigModal({
  open,
  onClose,
  product,
  vendor,
  allowedFetchTypes = ["Pull", "Push"],
}: SourceConfigModalProps) {
  const showFetchTypeToggle = allowedFetchTypes.length > 1;
  const defaultFetchType = allowedFetchTypes[0];
```

- [ ] **Step 3: Update EMPTY_FORM to use defaultFetchType**

The constant EMPTY_FORM at line 72-79 uses a hardcoded "Pull". It needs to use `defaultFetchType` instead. Since `defaultFetchType` is inside the component, move the form initialization into the component.

Replace the `EMPTY_FORM` constant (line 72-79) with just a comment:
```typescript
/* ====== Empty form is built inside the component (depends on allowedFetchTypes) ====== */
```

Then, inside the component function, right after `const defaultFetchType = allowedFetchTypes[0];`, add:
```typescript
  const emptyForm = {
    fetchType: defaultFetchType,
    description: "",
    apiUrl: "",
    apiToken: "",
    active: true,
  };
```

And replace ALL references to `EMPTY_FORM` with `emptyForm` (there are 3 occurrences):
- Line 93: `const [form, setForm] = useState(EMPTY_FORM);` → `useState(emptyForm)`
- Line 116: `setForm(EMPTY_FORM);` → `setForm(emptyForm)`
- Line 135: `setForm(EMPTY_FORM);` → `setForm(emptyForm)`

- [ ] **Step 4: Conditionally show the fetchType toggle in the form (line 246-267)**

Replace:
```tsx
              {/* fetchType toggle — only on create */}
              {!editingId && (
                <div className="col-span-full">
                  <label className="text-gray-400 text-xs mb-1 block">
                    Tipo de coleta
                  </label>
                  <div className="flex gap-2">
                    {(["Pull", "Push"] as FetchType[]).map((ft) => (
```

With:
```tsx
              {/* fetchType toggle — only on create, only if multiple types allowed */}
              {!editingId && showFetchTypeToggle && (
                <div className="col-span-full">
                  <label className="text-gray-400 text-xs mb-1 block">
                    Tipo de coleta
                  </label>
                  <div className="flex gap-2">
                    {allowedFetchTypes.map((ft) => (
```

- [ ] **Step 5: Conditionally render grids based on allowedFetchTypes (lines 214-216)**

Replace:
```typescript
  const pullInstances = instances.filter((i) => i.fetchType === "Pull");
  const pushInstances = instances.filter((i) => i.fetchType === "Push");
```

With:
```typescript
  const pullInstances = allowedFetchTypes.includes("Pull")
    ? instances.filter((i) => i.fetchType === "Pull")
    : [];
  const pushInstances = allowedFetchTypes.includes("Push")
    ? instances.filter((i) => i.fetchType === "Push")
    : [];
```

- [ ] **Step 6: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/componentes/integrations/SourceConfigModal.tsx
git commit -m "feat(E01): add allowedFetchTypes prop to SourceConfigModal"
```

---

### Task 2: Wire Wazuh card in NgSocContent

**Files:**
- Modify: `frontend/src/pages/Integrations.tsx` (NgSocContent function, starts at line 243)

- [ ] **Step 1: Add state and effects to NgSocContent**

The NgSocContent function currently starts at line 243 with:
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
    return (
```

Replace the function signature through the `return (` with:
```tsx
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
    const { user } = useAuth();
    const isAdmin = user?.user_role?.slug === "admin";
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProduct, setModalProduct] = useState({ product: "", vendor: "" });
    const [activeCountMap, setActiveCountMap] = useState<Record<string, number>>({});

    useEffect(() => {
        async function loadCounts() {
            try {
                const wazuhInstances = await getSourceInstances("Wazuh");
                setActiveCountMap((prev) => ({
                    ...prev,
                    Wazuh: wazuhInstances.filter((i) => i.active).length,
                }));
            } catch {
                // silent
            }
        }
        loadCounts();
    }, []);

    function openModal(product: string, vendor: string) {
        if (!isAdmin) return;
        setModalProduct({ product, vendor });
        setModalOpen(true);
    }

    async function handleModalClose() {
        setModalOpen(false);
        try {
            const wazuhInstances = await getSourceInstances("Wazuh");
            setActiveCountMap((prev) => ({
                ...prev,
                Wazuh: wazuhInstances.filter((i) => i.active).length,
            }));
        } catch {
            // silent
        }
    }

    return (
```

- [ ] **Step 2: Make Wazuh card clickable with dot+badge**

In the SIEM section, the Wazuh card is currently (around line 262):
```tsx
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/wazuh.png" />
                    </div>
```

Replace with:
```tsx
                    <div
                        onClick={isAdmin ? () => openModal("Wazuh", "Wazuh") : undefined}
                        className={`bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736] relative ${isAdmin ? "cursor-pointer hover:border-purple-600/50 transition-colors" : ""}`}
                    >
                        <img src="/assets/img/wazuh.png" />
                        {(activeCountMap["Wazuh"] ?? 0) > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-gray-400">{activeCountMap["Wazuh"]} ativa{activeCountMap["Wazuh"] !== 1 ? "s" : ""}</span>
                            </div>
                        )}
                    </div>
```

- [ ] **Step 3: Add SourceConfigModal at the end of NgSocContent return**

Just before the closing `</section>` of NgSocContent's return, add:

```tsx
            <SourceConfigModal
                open={modalOpen}
                onClose={handleModalClose}
                product={modalProduct.product}
                vendor={modalProduct.vendor}
                allowedFetchTypes={["Push"]}
            />
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Integrations.tsx
git commit -m "feat(E01): wire Wazuh card with Push-only SourceConfigModal"
```

---

### Task 3: Wire Trend Micro card in EndpointsContent

**Files:**
- Modify: `frontend/src/pages/Integrations.tsx` (EndpointsContent function, starts at line 511)

- [ ] **Step 1: Add state and effects to EndpointsContent**

The EndpointsContent function currently starts at line 511:
```typescript
function EndpointsContent() {
    return (
```

Replace with:
```tsx
function EndpointsContent() {
    const { user } = useAuth();
    const isAdmin = user?.user_role?.slug === "admin";
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProduct, setModalProduct] = useState({ product: "", vendor: "" });
    const [activeCountMap, setActiveCountMap] = useState<Record<string, number>>({});

    useEffect(() => {
        async function loadCounts() {
            try {
                const trendInstances = await getSourceInstances("Trend Micro");
                setActiveCountMap((prev) => ({
                    ...prev,
                    "Trend Micro": trendInstances.filter((i) => i.active).length,
                }));
            } catch {
                // silent
            }
        }
        loadCounts();
    }, []);

    function openModal(product: string, vendor: string) {
        if (!isAdmin) return;
        setModalProduct({ product, vendor });
        setModalOpen(true);
    }

    async function handleModalClose() {
        setModalOpen(false);
        try {
            const trendInstances = await getSourceInstances("Trend Micro");
            setActiveCountMap((prev) => ({
                ...prev,
                "Trend Micro": trendInstances.filter((i) => i.active).length,
            }));
        } catch {
            // silent
        }
    }

    return (
```

- [ ] **Step 2: Make Trend Micro card clickable with dot+badge**

The Trend Micro card is currently (around line 529-531):
```tsx
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/trend.png" />
                    </div>
```

Replace with:
```tsx
                    <div
                        onClick={isAdmin ? () => openModal("Trend Micro", "Trend Micro") : undefined}
                        className={`bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736] relative ${isAdmin ? "cursor-pointer hover:border-purple-600/50 transition-colors" : ""}`}
                    >
                        <img src="/assets/img/trend.png" />
                        {(activeCountMap["Trend Micro"] ?? 0) > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-gray-400">{activeCountMap["Trend Micro"]} ativa{activeCountMap["Trend Micro"] !== 1 ? "s" : ""}</span>
                            </div>
                        )}
                    </div>
```

- [ ] **Step 3: Add SourceConfigModal at the end of EndpointsContent return**

Just before the closing `</section>` of EndpointsContent's return, add:

```tsx
            <SourceConfigModal
                open={modalOpen}
                onClose={handleModalClose}
                product={modalProduct.product}
                vendor={modalProduct.vendor}
                allowedFetchTypes={["Push"]}
            />
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Integrations.tsx
git commit -m "feat(E01): wire Trend Micro card with Push-only SourceConfigModal"
```

---

### Task 4: Final verification

- [ ] **Step 1: Clean build check**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: Build succeeds with no new errors

- [ ] **Step 2: Manual regression**

Run: `cd frontend && npm run dev`

Test checklist:
- [ ] **FortiGATE (regressao):** Card clicavel, modal abre com Pull+Push toggle, ambos grids funcionam
- [ ] **Wazuh:** Card clicavel (admin), modal abre sem toggle (Push fixo), apenas grid Push aparece
- [ ] **Wazuh:** Criar instancia Push → endpoint+token gerados, copiaveis, regeneraveis
- [ ] **Wazuh:** Dot+badge aparece no card quando ha instancias ativas
- [ ] **Trend Micro:** Card clicavel (admin), modal abre sem toggle (Push fixo), apenas grid Push
- [ ] **Trend Micro:** Criar instancia Push → endpoint+token gerados, copiaveis, regeneraveis
- [ ] **Trend Micro:** Dot+badge aparece no card quando ha instancias ativas
- [ ] **Non-admin:** Cards nao sao clicaveis
