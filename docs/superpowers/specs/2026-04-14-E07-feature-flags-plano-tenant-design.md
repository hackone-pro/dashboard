# E07 — Feature Flags por Plano do Tenant

**Data:** 2026-04-14
**Tipo:** Front-end (com ajuste mínimo no backend)
**Dependência:** E06 (campo `plan` no tenant)

## Objetivo

Controlar visibilidade de páginas e funcionalidades no frontend conforme o campo `plan` do tenant (`"essentials"` ou `"full"`). Tenants `essentials` veem um subconjunto; tenants `full` veem tudo.

## Decisões de Design

- **Rota bloqueada:** redirect silencioso para `/dashboard` (sem página de upgrade)
- **SOC Analytics para essentials:** habilitado sem limitações por enquanto (tratado em task futura)
- **Monitoria NG-SOC para essentials:** mesmo label e rota, sem diferenciação (G11 cuida disso)
- **Fonte do `plan`:** API `/api/acesso/user/tenants` (fonte de verdade via backend, não JWT)
- **Catálogo de Serviços:** visível para todos os planos
- **Abordagem:** Hook centralizado com mapa estático de features

## Mapa de Features por Plano

| Rota / Feature             | Plano Mínimo |
|----------------------------|-------------|
| `/dashboard`               | essentials  |
| `/risk-level`              | essentials  |
| `/incidentes`              | essentials  |
| `/threat-map`              | essentials  |
| `/soc-analytics`           | essentials  |
| `/monitoria-ngsoc`         | essentials  |
| `/relatorios/*`            | essentials  |
| `/vulnerabilities-detections` | full     |
| `/archives-integrity`      | full        |
| `/monitoria-csc`           | full        |

Itens fora do mapa (controlados por mecanismos existentes): `/config`, `/integrations`, `/multitenant-manager`, Catálogo de Serviços.

## Arquitetura

### 1. Backend — Expor `plan` na API

**Arquivo:** `backend/src/api/user-multi-tenant/services/user-multi-tenant.ts`

Adicionar `"plan"` ao array `select` da query de tenants para que a resposta da API `/api/acesso/user/tenants` inclua o campo.

### 2. Interface Tenant — Adicionar campo `plan`

**Arquivo:** `frontend/src/services/tenant/tenant.service.ts`

Adicionar `plan: "essentials" | "full"` à interface `Tenant`.

### 3. Mapa de Features — `featureFlags.ts`

**Arquivo novo:** `frontend/src/config/featureFlags.ts`

Mapa estático `Record<string, "essentials" | "full">` que associa cada feature key ao plano mínimo necessário. Feature keys usam o path da rota como identificador.

### 4. Hook `usePlanFeatures()`

**Arquivo novo:** `frontend/src/hooks/usePlanFeatures.ts`

Interface pública:

```ts
usePlanFeatures() → {
  plan: "essentials" | "full" | undefined
  canAccess(featureKey: string): boolean
  loading: boolean
}
```

Lógica de `canAccess`:
- `plan === "full"` → `true` sempre
- `plan === "essentials"` → consulta o mapa; `true` se plano mínimo é `"essentials"`
- `plan === undefined` (loading) → `false` (seguro por padrão)

### 5. Componente `PlanRoute`

**Arquivo novo:** `frontend/src/router/PlanRoute.tsx`

- Segue o padrão do `AdminRoute` existente
- Recebe `featureKey: string` como prop
- Usa `usePlanFeatures()` internamente
- Se `canAccess(featureKey)` é `false` → `<Navigate to="/dashboard" replace />`
- Durante `loading` → não renderiza (consistente com o comportamento existente)

### 6. Integração no Router — `AppRoutes.tsx`

Apenas as 3 rotas `full` recebem wrap com `PlanRoute`:
- `/vulnerabilities-detections`
- `/archives-integrity`
- `/monitoria-csc`

Rotas `essentials` não precisam de guard.

Composição:
```tsx
<PrivateRoute>
  <PlanRoute featureKey="/vulnerabilities-detections">
    <Vulnerabilities />
  </PlanRoute>
</PrivateRoute>
```

### 7. Integração no SideBar — `SideBar.tsx`

- Importar `usePlanFeatures()`
- Itens de menu `full` ficam condicionados a `canAccess(featureKey)`
- Itens ocultos simplesmente não renderizam (sem placeholder)
- Monitoria CSC: ambos `canAccess` e `useZabbixAtivo` precisam ser `true`
- Troca de tenant atualiza automaticamente (reatividade via `useTenant()`)

Itens afetados (ocultos para `essentials`):
- Vulnerabilidades
- Integridade de Arquivos
- Monitoria CSC (Zabbix)

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `backend/src/api/user-multi-tenant/services/user-multi-tenant.ts` | Adicionar `"plan"` ao select |
| `frontend/src/services/tenant/tenant.service.ts` | Adicionar `plan` à interface |
| `frontend/src/router/AppRoutes.tsx` | Wrap 3 rotas com `PlanRoute` |
| `frontend/src/componentes/SideBar.tsx` | Filtrar 3 itens com `canAccess()` |

## Arquivos Criados

| Arquivo | Propósito |
|---------|-----------|
| `frontend/src/config/featureFlags.ts` | Mapa de features por plano |
| `frontend/src/hooks/usePlanFeatures.ts` | Hook `usePlanFeatures()` |
| `frontend/src/router/PlanRoute.tsx` | Guard de rota por plano |

## Fora de Escopo

- Limitações do SOC Analytics para essentials (task futura)
- Label diferenciado da Monitoria NG-SOC para essentials (G11)
- Página de upgrade / upsell
- Feature flags granulares por componente dentro de uma página

## Critérios de Aceite

- [ ] Hook `usePlanFeatures()` funcional
- [ ] Menu lateral oculta páginas não disponíveis para o plano
- [ ] Rotas desabilitadas redirecionam para `/dashboard` (não só escondem)
- [ ] Tenant `full` vê tudo
- [ ] Tenant `essentials` vê apenas o subconjunto definido
- [ ] Troca de tenant atualiza as features imediatamente
