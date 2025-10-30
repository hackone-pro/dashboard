import React, { useEffect, useMemo, useState } from "react";
import { getTopPaises, PaisItem } from "../../../services/wazuh/toppaises.service";
import { guessCountryCode } from "../../../utils/countryUtils";
import { useTenant } from "../../../context/TenantContext"; // 👈 novo

type Props = { titulo?: string };

export default function TopCountriesCard({
  titulo = "Top países que mais originam ataques",
}: Props) {
  const { tenantAtivo } = useTenant(); // 👈 reage à troca de tenant
  const LIMIT = 5;
  const MIN_BAR_PCT = 6;

  const [dias, setDias] = useState<string>("todos");
  const [items, setItems] = useState<PaisItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false);

  // 🔹 Busca automática com delay suave
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    async function fetchData() {
      try {
        setLoading(true);
        setErro(null);
        setAnimReady(false);

        const inicio = Date.now();
        const data = await getTopPaises(dias);
        if (!ativo) return;

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setItems(data);
            setAnimReady(true);
          }
        }, delay);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar países");
      } finally {
        if (ativo) setLoading(false);
      }
    }
    fetchData();
    return () => {
      ativo = false;
    };
  }, [dias, tenantAtivo]); // 👈 refaz ao trocar tenant

  const itemsToShow = useMemo(() => items.slice(0, LIMIT), [items]);
  const max = useMemo(() => Math.max(...itemsToShow.map((i) => i.total), 1), [itemsToShow]);
  const fmt = useMemo(() => new Intl.NumberFormat("pt-BR"), []);

  return (
    <div className="relative cards rounded-xl p-4 pb-8 shadow-md w-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-sm pb-3">{titulo}</h3>
        {/* Caso queira reativar o filtro de dias */}
        {/* 
        <select
          className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-md border border-[#3B2A70]"
          value={dias}
          onChange={(e) => setDias(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="1">24 horas</option>
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
          <option value="30">30 dias</option>
        </select> 
        */}
      </div>

      {/* Overlay de atualização */}
      {loading && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center text-gray-300 text-xs z-20 rounded-xl">
        </div>
      )}

      {/* Estado de erro */}
      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded p-2">
          {erro}
        </div>
      )}

      {/* Skeleton */}
      {loading && !erro && (
        <div className="space-y-3 opacity-60">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-4 rounded bg-[#ffffff12] animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-[#ffffff12] rounded animate-pulse mb-2" />
                <div className="h-2 w-full bg-[#ffffff12] rounded animate-pulse" />
              </div>
              <div className="h-3 w-10 bg-[#ffffff12] rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Dados */}
      {!loading && !erro && itemsToShow.length === 0 && (
        <div className="text-xs text-gray-400">Nenhum país encontrado.</div>
      )}

      {!loading && !erro && itemsToShow.length > 0 && (
        <div
          className={`space-y-3 transition-opacity duration-500 ${
            animReady ? "opacity-100" : "opacity-0"
          }`}
        >
          {itemsToShow.map((it, i) => {
            const code = guessCountryCode(it.pais);
            const rawPct = (it.total / max) * 100;
            const pct = it.total > 0 ? Math.max(MIN_BAR_PCT, rawPct) : 0;

            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-4 overflow-hidden rounded-sm flex items-center justify-center bg-[#ffffff12]">
                  {code ? (
                    <img
                      src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
                      alt={it.pais}
                      title={it.pais}
                      loading="lazy"
                      width={24}
                      height={18}
                      className="block"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">🌐</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300 truncate">{it.pais}</span>
                    <span className="text-[11px] text-gray-400 ml-2">
                      {fmt.format(it.total)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded bg-[#ffffff12] overflow-hidden">
                    <div
                      className="h-full rounded-r transition-[width] duration-500"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg, #6A55DC 0%, #8B5CF6 45%, #EC4899 100%)",
                      }}
                      title={`${it.pais}: ${fmt.format(it.total)} (${rawPct.toFixed(2)}%)`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
