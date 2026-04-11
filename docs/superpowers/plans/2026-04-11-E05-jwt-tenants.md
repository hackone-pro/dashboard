# E05 — Incluir tenants no JWT — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Include the list of accessible tenants (with plan info) in the JWT token and have the frontend read tenants from the token on initial load instead of making a separate API call.

**Architecture:** A centralized `buildJwtPayload(user)` helper queries `user-multi-tenant` records, builds a `tenants` array with `{ id, uid, plan }`, and returns the JWT payload. All 3 JWT issuance points delegate to this helper. The frontend decodes the JWT to seed the tenant list on page load; tenant switching still uses the existing PATCH API + refetch.

**Tech Stack:** Strapi 5 (TypeScript, CommonJS), React 19, Vite, JWT (via `@strapi/plugin-users-permissions`)

---

### Task 1: Create `buildJwtPayload` helper

**Files:**
- Create: `backend/src/api/auth/utils/build-jwt-payload.ts`

- [ ] **Step 1: Create the helper file**

Create `backend/src/api/auth/utils/build-jwt-payload.ts`:

```ts
// backend/src/api/auth/utils/build-jwt-payload.ts

interface JwtTenant {
  id: number;
  uid: string;
  plan: "essentials" | "full";
}

interface JwtPayload {
  id: number;
  tenants: JwtTenant[];
}

export async function buildJwtPayload(user: { id: number }): Promise<JwtPayload> {
  // 1. Buscar o tenant direto do usuario (relacao user.tenant)
  const fullUser = await strapi.db
    .query("plugin::users-permissions.user")
    .findOne({
      where: { id: user.id },
      populate: {
        tenant: {
          select: ["id", "uid", "plan"],
        },
      },
    });

  // 2. Buscar todos os registros user-multi-tenant ativos
  const acessos = await strapi.db
    .query("api::user-multi-tenant.user-multi-tenant")
    .findMany({
      where: { users_permissions_user: user.id, ativo: true },
      populate: {
        tenant: {
          select: ["id", "uid", "plan"],
        },
      },
    });

  // 3. Montar lista de tenants (direto + multi-tenant), sem duplicatas
  const seen = new Set<number>();
  const tenants: JwtTenant[] = [];

  const addTenant = (t: any) => {
    if (!t || seen.has(t.id)) return;
    seen.add(t.id);
    tenants.push({
      id: t.id,
      uid: t.uid,
      plan: t.plan ?? "full",
    });
  };

  // Tenant direto do usuario primeiro
  if (fullUser?.tenant) {
    addTenant(fullUser.tenant);
  }

  // Tenants via multi-tenant
  for (const acesso of acessos) {
    addTenant(acesso.tenant);
  }

  return { id: user.id, tenants };
}
```

- [ ] **Step 2: Verify the file compiles with the Strapi build**

Run:
```bash
cd backend && npx tsc --noEmit src/api/auth/utils/build-jwt-payload.ts
```

Note: Strapi uses global `strapi` variable. If `tsc --noEmit` on this file alone fails due to missing global types, that's expected — the file will compile as part of the full Strapi build. Instead verify with:
```bash
cd backend && npm run build
```

Expected: Build succeeds without errors related to `build-jwt-payload`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/api/auth/utils/build-jwt-payload.ts
git commit -m "feat(E05): add buildJwtPayload helper for tenant-enriched JWT"
```

---

### Task 2: Update MFA service to use `buildJwtPayload`

**Files:**
- Modify: `backend/src/api/mfa/services/mfa.ts:96-100`

- [ ] **Step 1: Update the MFA service**

In `backend/src/api/mfa/services/mfa.ts`, add the import at the top (after line 2):

```ts
import { buildJwtPayload } from "../../auth/utils/build-jwt-payload";
```

Then replace lines 96-100 (the JWT issuance block):

```ts
    // gera JWT oficial
    const jwt = strapi
      .plugin("users-permissions")
      .service("jwt")
      .issue({ id: user.id, tenant_id: user?.tenant?.uid ?? null });
```

With:

```ts
    // gera JWT oficial com tenants
    const payload = await buildJwtPayload(user);
    const jwt = strapi
      .plugin("users-permissions")
      .service("jwt")
      .issue(payload);
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd backend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add backend/src/api/mfa/services/mfa.ts
git commit -m "feat(E05): use buildJwtPayload in MFA verify flow"
```

---

### Task 3: Update login-attempts service to use `buildJwtPayload`

**Files:**
- Modify: `backend/src/api/login-attempts/services/login-attempts.ts:160-171`

- [ ] **Step 1: Update the login-attempts service**

In `backend/src/api/login-attempts/services/login-attempts.ts`, add the import at the top (after line 2):

```ts
import { buildJwtPayload } from "../../auth/utils/build-jwt-payload";
```

Then replace lines 160-171 (the direct login JWT block):

```ts
    const { password: _, reset_token, reset_expire, ...safeUser } = user;

    const userWithTenant = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      user.id,
      { populate: { tenant: true } }
    ) as any;

    const jwt = strapi
      .plugin("users-permissions")
      .service("jwt")
      .issue({ id: user.id, tenant_id: userWithTenant?.tenant?.uid ?? null });
```

With:

```ts
    const { password: _, reset_token, reset_expire, ...safeUser } = user;

    const payload = await buildJwtPayload(user);
    const jwt = strapi
      .plugin("users-permissions")
      .service("jwt")
      .issue(payload);
```

This removes the separate `entityService.findOne` call since `buildJwtPayload` already queries the user's tenant internally.

- [ ] **Step 2: Verify build**

Run:
```bash
cd backend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add backend/src/api/login-attempts/services/login-attempts.ts
git commit -m "feat(E05): use buildJwtPayload in direct login flow"
```

---

### Task 4: Update bootstrap middleware to use `buildJwtPayload`

**Files:**
- Modify: `backend/src/index.ts:22-36`

- [ ] **Step 1: Update the bootstrap middleware**

In `backend/src/index.ts`, add the import at the top (after line 1):

```ts
import { buildJwtPayload } from "./api/auth/utils/build-jwt-payload";
```

Then replace lines 22-36 (the middleware JWT override):

```ts
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId,
        { populate: { tenant: true } }
      ) as any;

      // console.log("✅ Tenant encontrado:", user?.tenant?.id);

      ctx.body.jwt = await strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({
          id: userId,
          tenant_id: user?.tenant?.uid ?? null,
        });
```

With:

```ts
      const payload = await buildJwtPayload({ id: userId });
      ctx.body.jwt = await strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue(payload);
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd backend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat(E05): use buildJwtPayload in bootstrap login middleware"
```

---

### Task 5: Update AuthContext to decode JWT and expose tenants

**Files:**
- Modify: `frontend/src/context/AuthContext.tsx`

- [ ] **Step 1: Add JWT tenant type and decode logic to AuthContext**

Replace the full contents of `frontend/src/context/AuthContext.tsx` with:

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, setToken, clearToken } from "../utils/auth";

export interface JwtTenant {
  id: number;
  uid: string;
  plan: "essentials" | "full";
}

interface AuthContextType {
  token: string | null;
  user: any | null;
  jwtTenants: JwtTenant[];
  login: (novoToken: string, userData: any) => void;
  logout: () => void;
}

function decodeJwtTenants(token: string | null): JwtTenant[] {
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Array.isArray(payload.tenants) ? payload.tenants : [];
  } catch {
    return [];
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<any | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [jwtTenants, setJwtTenants] = useState<JwtTenant[]>(() => decodeJwtTenants(getToken()));

  const login = (novoToken: string, userData: any) => {
    setToken(novoToken);
    setTokenState(novoToken);
    setJwtTenants(decodeJwtTenants(novoToken));

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setJwtTenants([]);

    localStorage.removeItem("user");
    localStorage.removeItem("remember_email");

    sessionStorage.removeItem("mfa_token");
    sessionStorage.removeItem("mfa_email");
  };

  // Caso o token mude em outra aba
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "token") {
        setTokenState(event.newValue);
        setJwtTenants(decodeJwtTenants(event.newValue));
      }
      if (event.key === "user") {
        const newUser = event.newValue;
        setUser(newUser ? JSON.parse(newUser) : null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, jwtTenants, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};
```

- [ ] **Step 2: Verify frontend build**

Run:
```bash
cd frontend && npm run build
```

Expected: Build succeeds. There may be TypeScript warnings from TenantContext (which we'll update next), but no errors that break the build since `jwtTenants` is a new addition, not a removal.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/AuthContext.tsx
git commit -m "feat(E05): decode JWT tenants in AuthContext"
```

---

### Task 6: Update TenantContext to use JWT tenants on initial load

**Files:**
- Modify: `frontend/src/context/TenantContext.tsx`

- [ ] **Step 1: Update TenantContext to seed from JWT**

Replace the full contents of `frontend/src/context/TenantContext.tsx` with:

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getTenants, changeTenant, Tenant } from "../services/tenant/tenant.service";
import { useAuth } from "./AuthContext";

interface TenantContextType {
  tenantAtivo: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  trocarTenant: (id: number) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantAtivo, setTenantAtivo] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const { token, jwtTenants } = useAuth();

  useEffect(() => {
    if (!token) {
      setTenants([]);
      setTenantAtivo(null);
      setLoading(false);
      return;
    }

    // Seed from JWT tenants (avoids API call on page load)
    if (jwtTenants.length > 0) {
      const seedTenants: Tenant[] = jwtTenants.map((jt) => ({
        id: jt.id,
        cliente_name: "",
        organizacao: undefined,
        contract: null,
      }));
      setTenants(seedTenants);
      setTenantAtivo(seedTenants[0]);
    }

    // Fetch full tenant data from API (has cliente_name, organizacao, contract)
    const carregarTenants = async () => {
      try {
        const data = await getTenants();
        const lista = data.tenantsAcessiveis || [];
        const ativo = data.tenantAtivo || lista[0] || null;

        setTenants(lista);
        setTenantAtivo(ativo);
      } catch (err) {
        console.error("Erro ao carregar tenants:", err);
        // Keep JWT seed if API fails
        if (jwtTenants.length === 0) {
          setTenants([]);
          setTenantAtivo(null);
        }
      } finally {
        setLoading(false);
      }
    };

    carregarTenants();
  }, [token]); // reexecuta quando o token muda (login/logout)

  const trocarTenant = async (id: number) => {
    setSwitching(true);
    const inicio = Date.now();

    try {
      await changeTenant(id);
      const data = await getTenants();
      setTenants(data.tenantsAcessiveis || []);
      setTenantAtivo(data.tenantAtivo);
    } catch (err) {
      console.error("Erro ao trocar tenant:", err);
    } finally {
      const elapsed = Date.now() - inicio;
      const restante = Math.max(800 - elapsed, 0);
      setTimeout(() => setSwitching(false), restante);
    }
  };

  return (
    <TenantContext.Provider value={{ tenantAtivo, tenants, loading, trocarTenant }}>
      {children}

      {switching && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="flex flex-col items-center text-gray-200">
            <svg
              className="animate-spin text-purple-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              width="50"
              height="50"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-sm text-gray-300">Trocando tenant...</p>
          </div>
        </div>
      )}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant deve ser usado dentro de <TenantProvider>");
  return ctx;
};
```

Key changes:
- Reads `jwtTenants` from `useAuth()`
- On token change, immediately seeds state with JWT tenants (partial data: `id` only, no `cliente_name`/`organizacao`)
- Still calls `getTenants()` API to get full tenant data (display names, contract info)
- If API fails, keeps JWT seed as fallback
- TenantSelector will show the correct selected option by `id` immediately, then update display names when API responds

- [ ] **Step 2: Verify frontend build**

Run:
```bash
cd frontend && npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/TenantContext.tsx
git commit -m "feat(E05): seed TenantContext from JWT tenants on initial load"
```

---

### Task 7: Manual end-to-end verification

No files changed — this is a verification task.

- [ ] **Step 1: Start the backend**

Run:
```bash
cd backend && npm run dev
```

Expected: Strapi starts on port 1337 without errors.

- [ ] **Step 2: Start the frontend**

Run (in a separate terminal):
```bash
cd frontend && npm run dev
```

Expected: Vite dev server starts on port 5173.

- [ ] **Step 3: Test login flow (without MFA)**

1. Open `http://localhost:5173` in browser
2. Log in with valid credentials
3. Open browser DevTools > Application > Local Storage > token
4. Copy the JWT and decode it at `jwt.io` or in the console: `JSON.parse(atob(localStorage.token.split('.')[1]))`
5. Verify the payload contains:
   - `id` (user ID)
   - `tenants` array with `{ id, uid, plan }` objects
   - No `tenant_id` field

Expected: JWT contains `tenants` array matching the user's accessible tenants.

- [ ] **Step 4: Test TenantSelector loads correctly**

1. After login, verify the TenantSelector in the header shows the correct organization name
2. Check browser DevTools > Network tab — the `/api/acesso/user/tenants` call should still happen (for full data), but the UI should render quickly with the JWT seed

Expected: TenantSelector displays correctly.

- [ ] **Step 5: Test tenant switching**

1. If the user has multiple tenants, switch to a different tenant via the dropdown
2. Verify the UI updates correctly
3. Verify no errors in console

Expected: Tenant switching works as before.

- [ ] **Step 6: Test MFA flow (if ENABLE_MFA=true)**

1. If MFA is enabled in `.env`, test the full login → MFA code → verify flow
2. After MFA verification, check the JWT payload contains `tenants` array

Expected: MFA flow produces JWT with tenants.

- [ ] **Step 7: Test user with no tenants**

1. If possible, log in as a user with no tenant associations
2. Verify JWT contains `tenants: []`
3. Verify the UI handles this gracefully

Expected: Empty tenants array, no crash.
