# E06 — Adicionar campo `plan` ao schema do tenant

**Data:** 2026-04-11
**Tipo:** Back-end
**Servico afetado:** Strapi — `src/api/tenant/`
**Dependentes:** E07 (feature flags frontend), E01 (tela config FortiGATE), E05 (JWT tenants)

---

## Objetivo

Adicionar um campo `plan` ao content-type `tenant` no Strapi para classificar o plano contratado pelo cliente (`essentials` ou `full`). Este campo sera a base para o sistema de feature flags (E07) e controle de funcionalidades.

O campo `plan` e intencionalmente separado do content-type `contract` existente. Futuramente, informacoes de `contract` (firewalls, edr, servers, etc.) podem migrar para uma entidade de plano, mas isso esta fora de escopo.

## Abordagem

Enum direto no schema do tenant — simples, alinhado com o padrao Strapi, sem over-engineering.

## Alteracoes

### 1. Schema do tenant

**Arquivo:** `backend/src/api/tenant/content-types/tenant/schema.json`

Adicionar ao objeto `attributes`:

```json
"plan": {
  "type": "enumeration",
  "enum": ["essentials", "full"],
  "default": "full",
  "required": true
}
```

- `required: true` — todo tenant deve ter um plano definido
- `default: "full"` — novos tenants sem valor explicito recebem `full`

### 2. Fallback no lifecycle para tenants existentes

**Arquivo:** `backend/src/api/tenant/content-types/tenant/lifecycles.ts`

Tenants ja cadastrados no banco terao `plan: null` ate serem editados. Para garantir consistencia (E07 depende desse valor), adicionar fallback nos hooks `afterFindOne` e `afterFindMany`:

- Se `result.plan` for `null` ou `undefined`, atribuir `"full"`
- Isso garante que a API sempre retorne um valor valido para `plan`, mesmo para registros antigos

A logica deve ser adicionada aos hooks existentes (`afterFindOne` e `afterFindMany`), que ja fazem populacao de `owner_name`.

### 3. Exposicao na API REST

Nenhuma alteracao necessaria. O Strapi expoe campos `enumeration` automaticamente nas rotas REST padrao (GET `/api/tenants`, GET `/api/tenants/:id`). Controllers, services e routes usam factories padrao sem customizacao.

### 4. Admin Panel

Nenhuma alteracao necessaria. Campos `enumeration` aparecem como dropdown no painel admin automaticamente.

### 5. Tipos TypeScript

Apos adicionar o campo, regenerar os tipos com o comando do Strapi para atualizar `backend/types/generated/contentTypes.d.ts`.

## Criterios de aceite

- [ ] Campo `plan` existe no schema do tenant com valores `essentials` e `full`
- [ ] Campo tem `required: true` e `default: "full"`
- [ ] Tenants existentes retornam `"full"` via API (fallback no lifecycle)
- [ ] Campo retornado nas APIs GET de tenant (`/api/tenants`, `/api/tenants/:id`)
- [ ] Campo editavel no painel admin como dropdown
- [ ] Valor invalido (ex: `"premium"`) e rejeitado pelo Strapi
- [ ] Tipos TypeScript regenerados e atualizados

## Arquivos impactados

| Arquivo | Alteracao |
|---------|-----------|
| `backend/src/api/tenant/content-types/tenant/schema.json` | Adicionar atributo `plan` |
| `backend/src/api/tenant/content-types/tenant/lifecycles.ts` | Fallback `plan = "full"` em afterFindOne/afterFindMany |
| `backend/types/generated/contentTypes.d.ts` | Regenerar tipos |

## Fora de escopo

- Migracao de dados de `contract` para entidade de plano
- Feature flags no frontend (E07)
- Inclusao de `plan` no JWT (E05)
- Qualquer logica de negocio baseada no plano
