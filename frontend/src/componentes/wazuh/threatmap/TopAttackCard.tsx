import React, { useEffect, useMemo, useState } from "react";
import { LiaUserNinjaSolid } from "react-icons/lia";
import { useTenant } from "../../../context/TenantContext";
import { getMitreTechniquesAndTactics } from "../../../services/wazuh/mitre-techniques.service";


type MitreItem = {
  tecnica: string;
  total: number;
};

type Props = {
  titulo?: string;
  dias?: string;
  onDadosCarregados?: (items: MitreItem[]) => void;
};

export default function TopAttackCard({
  titulo = "Top Ataques",
  dias = "1",
  onDadosCarregados,
}: Props) {
  const { tenantAtivo } = useTenant();
  const LIMIT = 5;
  const MIN_BAR_PCT = 6;

  const [items, setItems] = useState<MitreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;

    async function fetchData() {
      try {
        setLoading(true);
        setErro(null);

        const data = await getMitreTechniquesAndTactics(dias);

        if (!ativo) return;
        setItems(data.techniques);
        onDadosCarregados?.(data.techniques);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar técnicas MITRE");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    fetchData();

    return () => {
      ativo = false;
    };
  }, [tenantAtivo, dias]);

  const itemsToShow = useMemo(() => items.slice(0, LIMIT), [items]);
  const max = useMemo(
    () => Math.max(...itemsToShow.map((i) => i.total), 1),
    [itemsToShow]
  );

  const fmt = useMemo(() => new Intl.NumberFormat("pt-BR"), []);

  return (
    <div className="cards rounded-xl p-4 pb-8 shadow-md w-full">
      <div className="flex items-center gap-2 pb-3">
        {/* @ts-ignore */}
        <LiaUserNinjaSolid className="text-purple-400" size={22} />
        <h3 className="text-white text-sm">{titulo}</h3>
      </div>

      {loading ? (
        <div className="text-xs text-gray-400">Carregando…</div>
      ) : erro ? (
        <div className="text-xs text-red-400">{erro}</div>
      ) : (
        <div className="space-y-3">
          {itemsToShow.map((it, i) => {
            const rawPct = (it.total / max) * 100;
            const pct = Math.max(MIN_BAR_PCT, rawPct);

            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 truncate">
                      {it.tecnica}
                    </span>
                    <span className="text-[11px] text-gray-400">
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
