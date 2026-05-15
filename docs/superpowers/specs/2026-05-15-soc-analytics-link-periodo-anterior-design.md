# Design: Link "Período Anterior" no SOC Analytics

**Data:** 2026-05-15
**Escopo:** `frontend/src/pages/SOCAnalytics.tsx`

---

## Problema

Os MetricCards do SOC Analytics exibem comparativos com o período anterior ("vs período anterior"), mas não há forma de navegar para visualizar aquele período. O dado `previousStart`/`previousEnd` já existe no DTO retornado pela API, mas não é aproveitado na navegação.

---

## Solução

Adicionar um pequeno ícone clicável (`↗`) ao lado do texto "vs período anterior" em cada MetricCard. Ao clicar, navega para `/soc-analytics?start=<previousStart>&end=<previousEnd>`, carregando a tela com o filtro do período anterior aplicado.

É uma ferramenta de debug — o estilo deve ser discreto.

---

## Arquitetura

### 1. `MetricCard` — nova prop opcional

```ts
interface MetricCardProps {
    // ... props existentes ...
    previousPeriodHref?: string;
}
```

Quando `previousPeriodHref` está presente, renderiza um ícone `<FiExternalLink>` como `<Link>` do React Router imediatamente após o `{trendLabel}`:

```tsx
<span className="text-xs font-light" style={{ color: trendColor }}>
    {trendValue} {trendLabel}
    {previousPeriodHref && (
        <Link
            to={previousPeriodHref}
            title="Ver período anterior"
            className="ml-1.5 text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center"
            onClick={(e) => e.stopPropagation()}
        >
            <FiExternalLink size={11} />
        </Link>
    )}
</span>
```

O `stopPropagation` evita que o clique no ícone acione o `onClick` do card pai (que navega para `/incidentes`).

### 2. `SOCAnalytics.tsx` — leitura de query params no init

Substituir o `useState` fixo de `periodoFiltro` por inicialização via `useSearchParams`:

```ts
const [searchParams] = useSearchParams();
const initialFrom = searchParams.get("start");
const initialTo   = searchParams.get("end");

const [periodoFiltro, setPeriodoFiltro] = useState<{ from: string; to: string } | null>(
    initialFrom && initialTo ? { from: initialFrom, to: initialTo } : null
);
```

O `activeLabel` do DateRangePicker e o `fetchData` já consomem `periodoFiltro` — nenhuma outra mudança necessária para que a tela carregue corretamente.

### 3. `SOCAnalytics.tsx` — href derivado dos dados

Após receber `data`:

```ts
const previousPeriodHref = data?.period?.previousStart && data?.period?.previousEnd
    ? `/soc-analytics?start=${encodeURIComponent(data.period.previousStart)}&end=${encodeURIComponent(data.period.previousEnd)}`
    : undefined;
```

Passado para os 4 MetricCards (MTTD, MTTA, MTTR, Incidentes Abertos).

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `frontend/src/pages/SOCAnalytics.tsx` | +`useSearchParams` no init, +`previousPeriodHref` derivado, +prop nos 4 cards, +`FiExternalLink` no `MetricCard` |

Nenhum arquivo novo. Nenhum serviço, DTO ou backend alterado.

---

## Restrições respeitadas

- Apenas o ícone vira link (não o card, não os números)
- Estilo discreto (`text-gray-500`, tamanho 11px)
- Navegação real via React Router `<Link>` — o botão "voltar" do navegador funciona
- URL compartilhável (`?start=&end=`)
- `previousStart`/`previousEnd` já existem no `Period` do DTO — sem alteração de backend

---

## Fora do escopo

- Sincronização visual do DateRangePicker ao carregar via URL (o `activeLabel` já reflete corretamente; o estado interno do picker não é inicializado — aceitável para ferramenta de debug)
