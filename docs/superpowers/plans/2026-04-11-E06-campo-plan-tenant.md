# E06 — Campo `plan` no Tenant — Plano de Implementacao

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar campo `plan` (enum: `essentials` | `full`) ao content-type tenant no Strapi, com fallback no lifecycle para tenants existentes.

**Architecture:** Campo `enumeration` direto no schema JSON do tenant. Fallback nos lifecycle hooks `afterFindOne`/`afterFindMany` para garantir que tenants existentes (com `plan: null`) retornem `"full"`. Tipos TypeScript regenerados apos a alteracao.

**Tech Stack:** Strapi 5 (TypeScript), SQLite (dev)

**Spec:** `docs/superpowers/specs/2026-04-11-E06-campo-plan-tenant-design.md`

---

## File Structure

| Arquivo | Acao | Responsabilidade |
|---------|------|-----------------|
| `backend/src/api/tenant/content-types/tenant/schema.json` | Modificar | Adicionar atributo `plan` |
| `backend/src/api/tenant/content-types/tenant/lifecycles.ts` | Modificar | Fallback `plan = "full"` para tenants existentes |
| `backend/types/generated/contentTypes.d.ts` | Regenerar | Tipos atualizados com campo `plan` |

---

## Task 1: Adicionar campo `plan` ao schema do tenant

**Files:**
- Modify: `backend/src/api/tenant/content-types/tenant/schema.json:13-78`

- [ ] **Step 1: Adicionar o atributo `plan` ao schema**

Abrir `backend/src/api/tenant/content-types/tenant/schema.json` e adicionar o campo `plan` dentro do objeto `attributes`, logo antes do campo `ativa` (linha 36). O JSON completo do atributo:

```json
"plan": {
  "type": "enumeration",
  "enum": ["essentials", "full"],
  "default": "full",
  "required": true
},
```

O resultado final do bloco `attributes` deve ficar assim (mostrando apenas os campos ao redor da insercao):

```json
"attributes": {
    "uid": {
      "type": "string"
    },
    "cliente_name": {
      "type": "string"
    },
    "plan": {
      "type": "enumeration",
      "enum": ["essentials", "full"],
      "default": "full",
      "required": true
    },
    "wazuh_url": {
      "type": "string"
    },
```

> Nota: a posicao exata dentro de `attributes` nao importa para o Strapi, mas colocar `plan` proximo ao topo (apos `cliente_name`) facilita a leitura.

- [ ] **Step 2: Validar o JSON**

Run: `cd backend && node -e "JSON.parse(require('fs').readFileSync('src/api/tenant/content-types/tenant/schema.json','utf8')); console.log('JSON valido')"`

Expected: `JSON valido`

- [ ] **Step 3: Commit**

```bash
git add backend/src/api/tenant/content-types/tenant/schema.json
git commit -m "feat(E06): adicionar campo plan ao schema do tenant"
```

---

## Task 2: Adicionar fallback no lifecycle

**Files:**
- Modify: `backend/src/api/tenant/content-types/tenant/lifecycles.ts:1-62`

- [ ] **Step 1: Adicionar fallback no `afterFindOne`**

No arquivo `backend/src/api/tenant/content-types/tenant/lifecycles.ts`, dentro do hook `afterFindOne`, adicionar a seguinte linha logo apos o check `if (!result) return;` (depois da linha 6):

```typescript
async afterFindOne(event) {
    const { result } = event;
    if (!result) return;

    // Fallback: tenants existentes sem plan retornam "full"
    if (!result.plan) {
      result.plan = "full";
    }

    if (result.users_permissions_users && result.users_permissions_users.length > 0) {
      const user = result.users_permissions_users[0];
      if (user?.owner_name_iris) {
        result.owner_name = user.owner_name_iris;
      }
    }
  },
```

- [ ] **Step 2: Adicionar fallback no `afterFindMany`**

No mesmo arquivo, dentro do hook `afterFindMany`, adicionar a logica de fallback dentro do loop `for`, logo no inicio do corpo do loop (apos a linha 21):

```typescript
async afterFindMany(event) {
    const { result } = event;
    if (!Array.isArray(result)) return;

    for (const tenant of result) {
      // Fallback: tenants existentes sem plan retornam "full"
      if (!tenant.plan) {
        tenant.plan = "full";
      }

      if (tenant.users_permissions_users && tenant.users_permissions_users.length > 0) {
        const user = tenant.users_permissions_users[0];
        if (user?.owner_name_iris) {
          tenant.owner_name = user.owner_name_iris;
        }
      }
    }
  },
```

- [ ] **Step 3: Validar sintaxe do TypeScript**

Run: `cd backend && npx tsc --noEmit src/api/tenant/content-types/tenant/lifecycles.ts 2>&1 || echo "Se tsc falhar por imports do Strapi, verificar manualmente que a sintaxe esta correta"`

> Nota: o projeto pode nao ter `tsconfig` configurado para compilacao isolada. Nesse caso, validar visualmente que o arquivo esta sintaticamente correto.

- [ ] **Step 4: Commit**

```bash
git add backend/src/api/tenant/content-types/tenant/lifecycles.ts
git commit -m "feat(E06): fallback plan=full no lifecycle do tenant"
```

---

## Task 3: Regenerar tipos TypeScript

**Files:**
- Regenerate: `backend/types/generated/contentTypes.d.ts`

- [ ] **Step 1: Regenerar tipos com Strapi CLI**

Run: `cd backend && npx strapi ts:generate-types`

> Se o comando falhar (ex: dependencias nao instaladas), executar `npm install` primeiro e tentar novamente.

- [ ] **Step 2: Verificar que o campo `plan` aparece nos tipos gerados**

Run: `grep -A2 "plan" backend/types/generated/contentTypes.d.ts | head -10`

Expected: linha contendo `plan: Schema.Attribute.Enumeration<['essentials', 'full']>` (ou similar) dentro do bloco `ApiTenantTenant`.

- [ ] **Step 3: Commit**

```bash
git add backend/types/generated/contentTypes.d.ts backend/types/generated/components.d.ts
git commit -m "chore(E06): regenerar tipos TypeScript com campo plan"
```

---

## Task 4: Validacao manual (smoke test)

- [ ] **Step 1: Iniciar o Strapi em modo dev**

Run: `cd backend && npm run dev`

Aguardar o servidor iniciar na porta 1337.

- [ ] **Step 2: Verificar campo no admin**

Abrir `http://localhost:1337/admin` no browser. Navegar para Content Manager > tenant. Verificar que:
- O campo `plan` aparece como dropdown
- As opcoes sao `essentials` e `full`
- Ao editar um tenant existente, o campo mostra `full` (via fallback ou default)

- [ ] **Step 3: Testar via API — GET tenant existente**

Run: `curl -s http://localhost:1337/api/tenants?populate=* -H "Authorization: Bearer <TOKEN>" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.data?.[0]?.plan ?? 'campo plan nao encontrado')"`

Expected: `full` (fallback do lifecycle para tenants existentes)

- [ ] **Step 4: Testar via API — valor invalido**

Run: `curl -s -X POST http://localhost:1337/api/tenants -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"data":{"cliente_name":"test","plan":"premium"}}' | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.error ? 'REJEITADO (correto)' : 'ACEITO (incorreto)')"`

Expected: `REJEITADO (correto)`

- [ ] **Step 5: Parar o servidor dev**

Encerrar o processo do Strapi (`Ctrl+C`).

---

## Criterios de Aceite (checklist final)

- [ ] Campo `plan` existe no schema do tenant com valores `essentials` e `full`
- [ ] Campo tem `required: true` e `default: "full"`
- [ ] Tenants existentes retornam `"full"` via API (fallback no lifecycle)
- [ ] Campo retornado nas APIs GET de tenant (`/api/tenants`, `/api/tenants/:id`)
- [ ] Campo editavel no painel admin como dropdown
- [ ] Valor invalido (ex: `"premium"`) e rejeitado pelo Strapi
- [ ] Tipos TypeScript regenerados e atualizados
