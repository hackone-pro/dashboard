# E05 — Incluir tenants do usuario no token JWT

**Data:** 2026-04-11
**Tipo:** Full Stack
**Servicos afetados:** Strapi — `src/api/mfa/`, `src/api/login-attempts/`, `src/index.ts` | Frontend — `context/AuthContext.tsx`, `context/TenantContext.tsx`
**Depende de:** E06 (campo `plan` no tenant)
**Dependentes:** E04 (propagar tenant_id nos microservicos)

---

## Objetivo

Refatorar o fluxo de autenticacao para que o JWT inclua a lista de tenants acessiveis do usuario com seus respectivos planos. O frontend passa a ler os tenants do token na carga inicial, eliminando a chamada API separada no carregamento da pagina.

## Decisoes de design

1. **JWT como cache inicial** — o token carrega a lista de tenants para evitar o GET `/api/acesso/user/tenants` no carregamento. A troca de tenant continua via PATCH API + refetch.
2. **Helper centralizado** — uma funcao `buildJwtPayload(user)` centraliza a montagem do payload. Os 3 pontos de emissao do JWT delegam a esse helper.
3. **Payload enxuto** — apenas `id`, `uid` e `plan` por tenant. Sem `name`, sem `tenant_id` no payload raiz.

## Payload do JWT

```json
{
  "id": 1,
  "tenants": [
    { "id": 5, "uid": "abc-123", "plan": "full" },
    { "id": 8, "uid": "def-456", "plan": "essentials" }
  ]
}
```

- `id` — ID numerico do tenant (PK)
- `uid` — identificador unico string do tenant
- `plan` — plano contratado (`essentials` | `full`), com fallback `"full"` para tenants sem valor (consistente com E06)
- Usuarios sem tenants acessiveis recebem `tenants: []`

## Alteracoes

### 1. Helper `buildJwtPayload`

**Arquivo novo:** `backend/src/api/auth/utils/build-jwt-payload.ts`

Funcao assincrona que:
1. Recebe o objeto `user` (com relacao `tenant` populada)
2. Consulta `user-multi-tenant` filtrando por `users_permissions_user = user.id` e `ativo = true`, populando a relacao `tenant`
3. Monta o array `tenants` com `{ id, uid, plan }` de cada tenant, aplicando fallback `plan ?? "full"`
4. Retorna `{ id: user.id, tenants }`

### 2. Pontos de emissao do JWT

Tres arquivos emitem JWT hoje. Todos passam a usar `buildJwtPayload`:

**`backend/src/api/mfa/services/mfa.ts` (linha ~100)**
- Antes: `jwt.issue({ id: user.id, tenant_id: user?.tenant?.uid ?? null })`
- Depois: `jwt.issue(await buildJwtPayload(user))`

**`backend/src/api/login-attempts/services/login-attempts.ts` (linha ~171)**
- Mesmo padrao — substituir payload inline por `await buildJwtPayload(user)`

**`backend/src/index.ts` (linhas ~33-36)**
- Middleware que intercepta `POST /api/auth/local` e sobrescreve o JWT
- Substituir payload inline por `await buildJwtPayload(user)`
- Garantir que a query do user popula a relacao `tenant`

Em todos os pontos: remover `tenant_id` do payload.

### 3. Frontend — AuthContext

**Arquivo:** `frontend/src/context/AuthContext.tsx`

- Adicionar funcao para decodificar o payload do JWT: `JSON.parse(atob(token.split('.')[1]))`
- Extrair e expor `tenants` no contexto
- Sem dependencia de lib externa

### 4. Frontend — TenantContext

**Arquivo:** `frontend/src/context/TenantContext.tsx`

- Na carga inicial: ler `tenants` do AuthContext (vindos do JWT) em vez de chamar `GET /api/acesso/user/tenants`
- Manter `getTenants()` via API apenas para refresh apos troca de tenant
- Fluxo de troca: `PATCH /api/acesso/user/tenant/:id` → refetch via API → atualiza estado

### 5. Sem alteracao

- **TenantSelector** — ja consome `tenants` do TenantContext, sem impacto
- **Endpoint `GET /api/acesso/user/tenants`** — continua existindo para refetch apos troca
- **Endpoint `PATCH /api/acesso/user/tenant/:id`** — sem alteracao

## Criterios de aceite

- [ ] JWT contem array `tenants` com `id`, `uid` e `plan` de cada tenant acessivel
- [ ] Tenants inativos (`ativo = false`) nao aparecem no JWT
- [ ] Fallback `plan = "full"` aplicado para tenants sem valor de plano
- [ ] Usuario sem tenants recebe `tenants: []` no JWT
- [ ] `buildJwtPayload` e chamado nos 3 pontos de emissao
- [ ] `tenant_id` removido do payload do JWT
- [ ] AuthContext decodifica JWT e expoe `tenants`
- [ ] TenantContext inicializa com tenants do JWT sem chamada API
- [ ] Troca de tenant continua funcional (PATCH + refetch)
- [ ] Login flow (com e sem MFA) nao quebra

## Arquivos impactados

| Arquivo | Alteracao |
|---------|-----------|
| `backend/src/api/auth/utils/build-jwt-payload.ts` | Novo — helper centralizado |
| `backend/src/api/mfa/services/mfa.ts` | Usar `buildJwtPayload` |
| `backend/src/api/login-attempts/services/login-attempts.ts` | Usar `buildJwtPayload` |
| `backend/src/index.ts` | Usar `buildJwtPayload` |
| `frontend/src/context/AuthContext.tsx` | Decodificar JWT, expor `tenants` |
| `frontend/src/context/TenantContext.tsx` | Inicializar com tenants do JWT |

## Fora de escopo

- Remocao do endpoint `GET /api/acesso/user/tenants`
- Alteracoes no TenantSelector
- Propagacao de `tenant_id` nos microservicos (E04)
- Logica de negocio baseada no `plan` (E07)
- Re-emissao de JWT na troca de tenant
