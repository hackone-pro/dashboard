// src/componentes/threatmap/TopCountriesTable.tsx
import { useEffect, useMemo, useState } from "react";
import { getTopPaises, PaisItem } from "../../../services/wazuh/toppaises.service";
import { guessCountryCode } from "../../../utils/countryUtils";

type Props = {
  dias?: string;               // "todos" | "1" | "7" | "15" | "30"
  limit?: number;              // default 10
  onTotalChange?: (n: number) => void; // devolve a soma p/ você exibir no header
};

export default function TopCountriesTable({ dias = "7", limit = 10, onTotalChange }: Props) {
  const [items, setItems] = useState<PaisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const fmt = useMemo(() => new Intl.NumberFormat("pt-BR"), []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setErro(null);
        const data = await getTopPaises(dias);
        const top = data.slice(0, limit);
        if (!ativo) return;
        setItems(top);
        const total = top.reduce((acc, cur) => acc + (cur.total || 0), 0);
        onTotalChange?.(total);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar países");
        onTotalChange?.(0);
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, [dias, limit, onTotalChange]);

  return (
    <table className="w-full text-sm text-left text-gray-400">
      <tbody>
        {loading ? (
          Array.from({ length: limit }).map((_, i) => (
            <tr key={`sk-${i}`}>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded bg-[#ffffff12] animate-pulse" />
                  <div className="h-3 w-40 bg-[#ffffff12] rounded animate-pulse" />
                </div>
              </td>
              <td className="py-2 text-right">
                <div className="h-3 w-12 bg-[#ffffff12] rounded animate-pulse ml-auto" />
              </td>
            </tr>
          ))
        ) : erro ? (
          <tr>
            <td colSpan={2} className="py-3 text-xs text-red-400">
              {erro}
            </td>
          </tr>
        ) : items.length === 0 ? (
          <tr>
            <td colSpan={2} className="py-3 text-xs text-gray-400">
              Nenhum país encontrado.
            </td>
          </tr>
        ) : (
          items.map((it, i) => {
            const code = guessCountryCode(it.pais);
            return (
              <tr key={i}>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 overflow-hidden rounded-sm bg-[#ffffff12] flex items-center justify-center">
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
                        <span className="text-xs">🌐</span>
                      )}
                    </div>
                    <span className="text-gray-300 truncate">{it.pais}</span>
                  </div>
                </td>
                <td className="py-2 text-right text-gray-300">{fmt.format(it.total)}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}