# E01 — Tela de configuracao de fontes FortiGATE

**Data:** 2026-04-13
**Tipo:** Front-end
**Status:** Aprovado

---

## Objetivo

Implementar a interacao no card FortiGATE da secao Firewall em Integrations: destaque visual quando ha instancias configuradas, modal com formulario de cadastro e dois grids (Pull/Push) para gerenciar instancias de coleta.

O backend (microservice customers) ainda nao esta pronto — toda persistencia sera mockada com localStorage para substituicao futura.

---

## Modelo de dados

```typescript
type FetchType = "Pull" | "Push";
type SourceStatus = "connected" | "pending" | "disconnected";

interface SourceInstance {
  id: string;
  product: string;       // "FortiGATE", "Checkpoint", etc.
  vendor: string;        // "Fortinet", "Checkpoint", etc.
  fetchType: FetchType;
  description: string;
  active: boolean;
  // Pull only
  apiUrl?: string;
  apiToken?: string;
  // Push only (gerados pelo sistema)
  pushEndpoint?: string;
  pushToken?: string;
  // Status
  status: SourceStatus;
  createdAt: string;
  updatedAt: string;
}
```

- `product` e `vendor` sao genericos para reutilizacao com outras fontes (Checkpoint, Sophos, etc.)
- `status` mapeia ao farol: connected=verde, pending=amarelo, disconnected=vermelho
- Campos Push sao readonly no formulario, gerados pelo mock/backend

---

## Service mock

**Arquivo:** `src/services/integrations/source.service.ts`

Funcoes async com localStorage e delay simulado (300ms):

| Funcao | Descricao |
|---|---|
| `getSourceInstances(product)` | Busca instancias filtradas por produto |
| `createSourceInstance(data)` | Cria instancia, gera id/timestamps. Se Push, gera pushEndpoint e pushToken |
| `updateSourceInstance(id, data)` | Atualiza campos de uma instancia existente |
| `deleteSourceInstance(id)` | Remove instancia |
| `toggleSourceInstance(id, active)` | Ativa/desativa instancia |
| `regeneratePushToken(id)` | Gera novo pushToken para instancias Push |

Todas retornam Promise para facilitar troca pelo backend real.

---

## Componente modal

**Arquivo:** `src/componentes/integrations/SourceConfigModal.tsx`

### Props

```typescript
interface SourceConfigModalProps {
  open: boolean;
  onClose: () => void;
  product: string;    // "FortiGATE"
  vendor: string;     // "Fortinet"
}
```

### Estrutura

1. **Header** — Titulo dinamico (ex: "FortiGATE") + botao "Nova instancia"
2. **Formulario** — Aparece ao clicar "Nova instancia" ou "Editar". Campos condicionais por fetchType. Botoes Salvar/Cancelar.
3. **Grid Pull** — Tabela: Descricao, URL da API, Token mascarado (copiavel), Ativo (toggle), Status (farol), Acoes (editar, excluir). So aparece se houver instancias Pull.
4. **Grid Push** — Tabela: Descricao, Endpoint (copiavel), Token (copiavel, regeneravel), Ativo (toggle), Status (farol), Acoes (editar, excluir). So aparece se houver instancias Push.

### Fluxo de interacao

- Modal abre -> carrega instancias via `getSourceInstances(product)`
- Formulario comeca oculto
- "Nova instancia" -> exibe formulario vazio
- "Editar" no grid -> preenche formulario com dados da instancia
- "Salvar" -> cria ou atualiza, recarrega lista, oculta formulario
- "Cancelar" -> oculta formulario sem salvar
- Toggle "Ativo" no grid -> chama `toggleSourceInstance` direto
- "Excluir" no grid -> confirmacao inline, depois `deleteSourceInstance`
- "Regenerar token" (Push) -> chama `regeneratePushToken`, atualiza grid

### Campos do formulario

| Campo | Tipo | Visibilidade |
|---|---|---|
| Tipo de coleta (fetchType) | Toggle Pull/Push | Sempre |
| URL da API (apiUrl) | Input texto | Somente Pull |
| API Token (apiToken) | Input password | Somente Pull |
| Descricao | Input texto | Sempre |
| Ativo | Toggle on/off | Sempre |

Campos Push (pushEndpoint, pushToken) sao exibidos como readonly apos salvar, nao no formulario de criacao.

Reutiliza o `Modal.tsx` existente com `maxWidth="max-w-5xl"`.

---

## Integracao com card em Integrations.tsx

### Alteracoes

1. **Estado** — `useState` para abertura do modal e contagem de instancias ativas
2. **Card FortiGATE** — `onClick` abre `SourceConfigModal`, `cursor-pointer`
3. **Dot + badge** — Indicador visual no card:
   - Sem instancias: card neutro
   - Com instancias ativas: dot verde (`bg-green-500`) + texto "X ativas"
4. **Contagem** — `useEffect` na montagem chama `getSourceInstances("FortiGATE")`. Atualiza quando modal fecha.
5. **Acesso admin** — Verificar via `useAuth()` antes de permitir interacao

---

## Arquivos

### Criar

| Arquivo | Proposito |
|---|---|
| `src/types/source.types.ts` | Tipos SourceInstance, FetchType, SourceStatus |
| `src/services/integrations/source.service.ts` | CRUD mock com localStorage |
| `src/componentes/integrations/SourceConfigModal.tsx` | Modal generico de configuracao de fontes |

### Modificar

| Arquivo | Alteracao |
|---|---|
| `src/pages/Integrations.tsx` | onClick no card FortiGATE, dot+badge, estado do modal |

---

## Criterios de aceite

- [ ] Card sem instancias: estado neutro, sem destaque
- [ ] Card com ao menos uma instancia: dot verde + "X ativas"
- [ ] Clique no card abre modal com formulario + grids
- [ ] Formulario oculta/exibe campos conforme fetchType
- [ ] No modo Push: token gerado ao salvar; modal exibe endpoint + token com botao de copiar
- [ ] Multiplas instancias podem ser cadastradas
- [ ] Dois grids separados (Pull/Push), cada um so aparece se houver instancias do tipo
- [ ] Farol de status: verde (connected), amarelo (pending), vermelho (disconnected)
- [ ] Edicao via grid preenche formulario
- [ ] Toggle ativo e excluir funcionais no grid
- [ ] Mock com localStorage (substituivel pelo backend customers)
- [ ] Somente acessivel por admin

---

## Fora de escopo

- Integracao real com backend customers
- Job de polling (E02)
- Validacao real de conexao com FortiGATE
