# Push-only Source Config — Trend Micro e Wazuh

**Data:** 2026-04-13
**Tipo:** Front-end
**Status:** Aprovado

---

## Objetivo

Reutilizar o SourceConfigModal existente (E01) para habilitar configuracao de fontes Push-only nos cards Trend Micro (aba EDR/XDR) e Wazuh (aba NG-SOC) em Integrations. Adicionar prop `allowedFetchTypes` ao modal para restringir modos disponiveis.

---

## Alteracao no SourceConfigModal

Nova prop opcional:

```typescript
interface SourceConfigModalProps {
  open: boolean;
  onClose: () => void;
  product: string;
  vendor: string;
  allowedFetchTypes?: FetchType[];  // default: ["Pull", "Push"]
}
```

Efeitos quando `allowedFetchTypes = ["Push"]`:
- Toggle Pull/Push nao aparece no formulario (fetchType fixado no unico valor)
- EMPTY_FORM usa o primeiro valor de allowedFetchTypes como default
- Grid Pull nunca renderizado (so grids dos tipos permitidos)
- Formulario de criacao mostra apenas: Descricao + Ativo

Quando `allowedFetchTypes` nao informado ou `["Pull", "Push"]`: comportamento atual inalterado.

---

## Alteracoes em Integrations.tsx

### NgSocContent (card Wazuh)

- Adicionar useState para modal + contagem, useEffect para carregar contagem
- Card Wazuh (linha 263, wazuh.png): onClick abre SourceConfigModal, cursor-pointer, dot+badge
- Props do modal: `product="Wazuh"`, `vendor="Wazuh"`, `allowedFetchTypes={["Push"]}`
- Admin-only

### EndpointsContent (card Trend Micro)

- Adicionar useState para modal + contagem, useEffect para carregar contagem
- Card Trend Micro (linha 530, trend.png): onClick abre SourceConfigModal, cursor-pointer, dot+badge
- Props do modal: `product="Trend Micro"`, `vendor="Trend Micro"`, `allowedFetchTypes={["Push"]}`
- Admin-only

---

## Arquivos

| Acao | Arquivo | Alteracao |
|---|---|---|
| Modificar | `src/componentes/integrations/SourceConfigModal.tsx` | Prop allowedFetchTypes, condicionar toggle e grids |
| Modificar | `src/pages/Integrations.tsx` | Cards Wazuh e Trend Micro clicaveis com modal Push-only |

---

## Criterios de aceite

- [ ] Modal Push-only: sem toggle Pull/Push, formulario mostra apenas Descricao + Ativo
- [ ] Grid Pull nunca aparece para fontes Push-only
- [ ] Grid Push funciona normalmente (endpoint+token gerados, copiaveis, regeneraveis)
- [ ] Dot+badge nos cards Wazuh e Trend Micro
- [ ] Somente admin
- [ ] FortiGATE continua funcionando com Pull+Push (regressao)
