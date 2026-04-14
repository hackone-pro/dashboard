# E07 — Feature Flags por Plano do Tenant — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Control page/feature visibility in the frontend based on the tenant's `plan` field (`"essentials"` or `"full"`).

**Architecture:** A static feature map defines which plan each route requires. A `usePlanFeatures()` hook reads the active tenant's plan and exposes a `canAccess()` function. A `PlanRoute` guard component redirects blocked routes to `/dashboard`. The SideBar hides menu items for inaccessible features.

**Tech Stack:** React 19, TypeScript, React Router 7, Strapi 5 (backend)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/src/api/user-multi-tenant/services/user-multi-tenant.ts` | Modify | Add `"plan"` to tenant select queries |
| `frontend/src/services/tenant/tenant.service.ts` | Modify | Add `plan` to `Tenant` interface |
| `frontend/src/config/featureFlags.ts` | Create | Static map of feature keys to minimum plan |
| `frontend/src/hooks/usePlanFeatures.ts` | Create | Hook exposing `plan`, `canAccess()`, `loading` |
| `frontend/src/router/PlanRoute.tsx` | Create | Route guard redirecting plan-blocked routes |
| `frontend/src/router/AppRoutes.tsx` | Modify | Wrap 3 `full`-only routes with `PlanRoute` |
| `frontend/src/componentes/SideBar.tsx` | Modify | Hide 3 menu items based on `canAccess()` |

---

### Task 1: Backend — Add `plan` to tenant API response

**Files:**
- Modify: `backend/src/api/user-multi-tenant/services/user-multi-tenant.ts`

- [ ] **Step 1: Add `"plan"` to the first select array (line 15)**

In `backend/src/api/user-multi-tenant/services/user-multi-tenant.ts`, find the first `select` inside the `populate.tenant` block (around line 15):

```ts
// BEFORE:
select: ["id", "cliente_name", "organizacao"],
```

Change to:

```ts
// AFTER:
select: ["id", "cliente_name", "organizacao", "plan"],
```

- [ ] **Step 2: Add `"plan"` to the second select array (line 41)**

In the same file, find the second `select` inside the `acessos` query `populate.tenant` block (around line 41):

```ts
// BEFORE:
select: ["id", "cliente_name", "organizacao"],
```

Change to:

```ts
// AFTER:
select: ["id", "cliente_name", "organizacao", "plan"],
```

- [ ] **Step 3: Add `plan` to the tenantAtivo mapping (line 63)**

Find the block that maps `fullUser.tenant` into `tenantsAcessiveis` (around line 62-67):

```ts
// BEFORE:
tenantsAcessiveis.push({
  id: fullUser.tenant.id,
  cliente_name: fullUser.tenant.cliente_name,
  organizacao: fullUser.tenant.organizacao,
  contract: fullUser.tenant.contract ?? null,
});
```

Change to:

```ts
// AFTER:
tenantsAcessiveis.push({
  id: fullUser.tenant.id,
  cliente_name: fullUser.tenant.cliente_name,
  organizacao: fullUser.tenant.organizacao,
  plan: fullUser.tenant.plan ?? "full",
  contract: fullUser.tenant.contract ?? null,
});
```

- [ ] **Step 4: Add `plan` to the acessos mapping (line 72)**

Find the `acessos.forEach` block that maps each tenant (around line 70-79):

```ts
// BEFORE:
tenantsAcessiveis.push({
  id: a.tenant.id,
  cliente_name: a.tenant.cliente_name,
  organizacao: a.tenant.organizacao,
  contract: a.tenant.contract ?? null,
});
```

Change to:

```ts
// AFTER:
tenantsAcessiveis.push({
  id: a.tenant.id,
  cliente_name: a.tenant.cliente_name,
  organizacao: a.tenant.organizacao,
  plan: a.tenant.plan ?? "full",
  contract: a.tenant.contract ?? null,
});
```

- [ ] **Step 5: Add `plan` to the return tenantAtivo mapping (line 96)**

Find the return block `tenantAtivo` mapping (around line 95-101):

```ts
// BEFORE:
tenantAtivo: fullUser.tenant
  ? {
      id: fullUser.tenant.id,
      cliente_name: fullUser.tenant.cliente_name,
      organizacao: fullUser.tenant.organizacao,
      contract: fullUser.tenant.contract ?? null,
    }
  : null,
```

Change to:

```ts
// AFTER:
tenantAtivo: fullUser.tenant
  ? {
      id: fullUser.tenant.id,
      cliente_name: fullUser.tenant.cliente_name,
      organizacao: fullUser.tenant.organizacao,
      plan: fullUser.tenant.plan ?? "full",
      contract: fullUser.tenant.contract ?? null,
    }
  : null,
```

- [ ] **Step 6: Verify backend builds**

Run:
```bash
cd backend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/api/user-multi-tenant/services/user-multi-tenant.ts
git commit -m "feat(E07): expose plan field in tenant API response"
```

---

### Task 2: Frontend — Add `plan` to Tenant interface

**Files:**
- Modify: `frontend/src/services/tenant/tenant.service.ts`

- [ ] **Step 1: Add `plan` field to the `Tenant` interface**

In `frontend/src/services/tenant/tenant.service.ts`, find the `Tenant` interface (lines 5-10):

```ts
// BEFORE:
export interface Tenant {
  id: number;
  cliente_name: string;
  organizacao?: string;
  contract?: Contract | null;
}
```

Change to:

```ts
// AFTER:
export interface Tenant {
  id: number;
  cliente_name: string;
  organizacao?: string;
  plan?: "essentials" | "full";
  contract?: Contract | null;
}
```

Note: `plan` is optional (`?`) because the JWT seed in `TenantContext` doesn't have it — it only arrives after the API response loads.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/tenant/tenant.service.ts
git commit -m "feat(E07): add plan field to Tenant interface"
```

---

### Task 3: Frontend — Create feature flags config

**Files:**
- Create: `frontend/src/config/featureFlags.ts`

- [ ] **Step 1: Create the config directory and feature flags file**

Create `frontend/src/config/featureFlags.ts` with this content:

```ts
export type PlanType = "essentials" | "full";

/**
 * Maps each feature key (route path) to the minimum plan required.
 * Features not listed here are not gated by plan.
 */
export const FEATURE_PLAN_MAP: Record<string, PlanType> = {
  "/dashboard": "essentials",
  "/risk-level": "essentials",
  "/incidentes": "essentials",
  "/threat-map": "essentials",
  "/soc-analytics": "essentials",
  "/monitoria-ngsoc": "essentials",
  "/relatorios": "essentials",
  "/vulnerabilities-detections": "full",
  "/archives-integrity": "full",
  "/monitoria-csc": "full",
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/config/featureFlags.ts
git commit -m "feat(E07): create feature flags config map"
```

---

### Task 4: Frontend — Create `usePlanFeatures` hook

**Files:**
- Create: `frontend/src/hooks/usePlanFeatures.ts`

- [ ] **Step 1: Create the hook file**

Create `frontend/src/hooks/usePlanFeatures.ts` with this content:

```ts
import { useTenant } from "../context/TenantContext";
import { FEATURE_PLAN_MAP, PlanType } from "../config/featureFlags";

export function usePlanFeatures() {
  const { tenantAtivo, loading } = useTenant();

  const plan: PlanType | undefined = tenantAtivo?.plan;

  const canAccess = (featureKey: string): boolean => {
    if (!plan) return false;
    if (plan === "full") return true;

    const requiredPlan = FEATURE_PLAN_MAP[featureKey];
    if (!requiredPlan) return true; // features not in the map are unrestricted
    return requiredPlan === "essentials";
  };

  return { plan, canAccess, loading };
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run:
```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors related to `usePlanFeatures`, `FEATURE_PLAN_MAP`, or `PlanType`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/usePlanFeatures.ts
git commit -m "feat(E07): create usePlanFeatures hook"
```

---

### Task 5: Frontend — Create `PlanRoute` guard component

**Files:**
- Create: `frontend/src/router/PlanRoute.tsx`

- [ ] **Step 1: Create the PlanRoute component**

Create `frontend/src/router/PlanRoute.tsx` with this content:

```tsx
import { Navigate } from "react-router-dom";
import { usePlanFeatures } from "../hooks/usePlanFeatures";

interface Props {
  featureKey: string;
  children: React.ReactNode;
}

export default function PlanRoute({ featureKey, children }: Props) {
  const { canAccess, loading } = usePlanFeatures();

  if (loading) return null;

  if (!canAccess(featureKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/router/PlanRoute.tsx
git commit -m "feat(E07): create PlanRoute guard component"
```

---

### Task 6: Frontend — Integrate PlanRoute into AppRoutes

**Files:**
- Modify: `frontend/src/router/AppRoutes.tsx`

- [ ] **Step 1: Add PlanRoute import**

In `frontend/src/router/AppRoutes.tsx`, add the import after the existing `AdminRoute` import (line 24):

```ts
// BEFORE:
import AdminRoute from './AdminRoute';

// AFTER:
import AdminRoute from './AdminRoute';
import PlanRoute from './PlanRoute';
```

- [ ] **Step 2: Wrap `/vulnerabilities-detections` route**

Find (line 49):

```tsx
<Route path="/vulnerabilities-detections" element={<PrivateRoute><VulnerabilitiesDetection /></PrivateRoute>} />
```

Change to:

```tsx
<Route path="/vulnerabilities-detections" element={<PrivateRoute><PlanRoute featureKey="/vulnerabilities-detections"><VulnerabilitiesDetection /></PlanRoute></PrivateRoute>} />
```

- [ ] **Step 3: Wrap `/archives-integrity` route**

Find (line 50):

```tsx
<Route path="/archives-integrity" element={<PrivateRoute><ArchivesIntegrity /></PrivateRoute>} />
```

Change to:

```tsx
<Route path="/archives-integrity" element={<PrivateRoute><PlanRoute featureKey="/archives-integrity"><ArchivesIntegrity /></PlanRoute></PrivateRoute>} />
```

- [ ] **Step 4: Wrap `/monitoria-csc` route**

Find (line 51):

```tsx
<Route path="/monitoria-csc" element={<PrivateRoute><MonitoriaCSC /></PrivateRoute>} />
```

Change to:

```tsx
<Route path="/monitoria-csc" element={<PrivateRoute><PlanRoute featureKey="/monitoria-csc"><MonitoriaCSC /></PlanRoute></PrivateRoute>} />
```

- [ ] **Step 5: Verify no TypeScript errors**

Run:
```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/router/AppRoutes.tsx
git commit -m "feat(E07): wrap full-only routes with PlanRoute guard"
```

---

### Task 7: Frontend — Filter SideBar menu items by plan

**Files:**
- Modify: `frontend/src/componentes/SideBar.tsx`

- [ ] **Step 1: Add `usePlanFeatures` import**

In `frontend/src/componentes/SideBar.tsx`, add the import after the existing `useZabbixAtivo` import (line 15):

```ts
// BEFORE:
import { useZabbixAtivo } from "../hooks/useZabbixAtivo";

// AFTER:
import { useZabbixAtivo } from "../hooks/useZabbixAtivo";
import { usePlanFeatures } from "../hooks/usePlanFeatures";
```

- [ ] **Step 2: Add `usePlanFeatures` hook call inside the component**

Inside the `Sidebar` function, after the `useZabbixAtivo` call (line 25), add:

```ts
// BEFORE:
const { ativo, loading } = useZabbixAtivo();

// AFTER:
const { ativo, loading } = useZabbixAtivo();
const { canAccess } = usePlanFeatures();
```

- [ ] **Step 3: Filter the expanded NG-SOC menu items array**

Find the array of NG-SOC menu items in the expanded view (around line 143-159). The array currently has 8 items. Add a `.filter()` call before `.map()`:

```tsx
// BEFORE:
].map((item, idx) => (

// AFTER:
].filter((item) => canAccess(item.to)).map((item, idx) => (
```

This filters out items whose route the current plan cannot access. For `essentials`, this removes: `/vulnerabilities-detections`, `/archives-integrity`. For `full`, nothing is removed.

- [ ] **Step 4: Filter the collapsed/hover NG-SOC menu items**

In the hover menu (the `!isOpen` block, around lines 194-269), the items are individual `<li>` elements. Wrap the three `full`-only items with `canAccess()` checks:

Find the Vulnerabilidades link block (around line 234-243):

```tsx
// BEFORE:
                                <li>
                                    <Link
                                        to="/vulnerabilities-detections"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <VscSearchFuzzy className="text-[16px]" /> Detecção de Vulnerabilidades
                                    </Link>
                                </li>

// AFTER:
                                {canAccess("/vulnerabilities-detections") && (
                                <li>
                                    <Link
                                        to="/vulnerabilities-detections"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <VscSearchFuzzy className="text-[16px]" /> Detecção de Vulnerabilidades
                                    </Link>
                                </li>
                                )}
```

Find the Integridade de Arquivos link block (around line 244-253):

```tsx
// BEFORE:
                                <li>
                                    <Link
                                        to="/archives-integrity"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <VscFileSymlinkDirectory className="text-[16px]" /> Integridade de Arquivos
                                    </Link>
                                </li>

// AFTER:
                                {canAccess("/archives-integrity") && (
                                <li>
                                    <Link
                                        to="/archives-integrity"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <VscFileSymlinkDirectory className="text-[16px]" /> Integridade de Arquivos
                                    </Link>
                                </li>
                                )}
```

- [ ] **Step 5: Add plan check to Monitoria CSC (Zabbix) item**

Find the Monitoria CSC block (around line 278):

```tsx
// BEFORE:
{!loading && ativo && (

// AFTER:
{!loading && ativo && canAccess("/monitoria-csc") && (
```

- [ ] **Step 6: Verify no TypeScript errors**

Run:
```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/componentes/SideBar.tsx
git commit -m "feat(E07): filter SideBar menu items by tenant plan"
```

---

### Task 8: Manual Verification

- [ ] **Step 1: Start backend dev server**

```bash
cd backend && npm run dev
```

- [ ] **Step 2: Start frontend dev server**

```bash
cd frontend && npm run dev
```

- [ ] **Step 3: Test with a `full` plan tenant**

1. Log in with a user whose tenant has `plan: "full"`
2. Verify all menu items visible in SideBar (Vulnerabilidades, Integridade de Arquivos, Monitoria CSC)
3. Navigate directly to `/vulnerabilities-detections` — should load normally
4. Navigate directly to `/archives-integrity` — should load normally

- [ ] **Step 4: Test with an `essentials` plan tenant**

1. Switch to (or log in with) a tenant that has `plan: "essentials"`
2. Verify SideBar hides: Vulnerabilidades, Integridade de Arquivos, Monitoria CSC
3. Verify SideBar shows: Analytics, Risk Level, Incidentes, Threat Map, Monitoria NG-SOC, Relatórios
4. Navigate directly to `/vulnerabilities-detections` — should redirect to `/dashboard`
5. Navigate directly to `/archives-integrity` — should redirect to `/dashboard`
6. Navigate directly to `/monitoria-csc` — should redirect to `/dashboard`

- [ ] **Step 5: Test tenant switching**

1. While logged in, switch from `essentials` to `full` tenant
2. Verify menu items update immediately (Vulnerabilidades, Integridade de Arquivos appear)
3. Switch back to `essentials`
4. Verify those items disappear again

- [ ] **Step 6: Verify Catálogo de Serviços unaffected**

1. With `essentials` tenant, verify all Catálogo items are visible
2. Verify Dashboard, Home link are visible and functional
