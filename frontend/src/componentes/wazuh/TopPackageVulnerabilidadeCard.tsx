import { useEffect, useState } from "react";
import {
  getTopPackagesVulnerabilidades,
  TopPackageVulnerabilidade,
} from "../../services/wazuh/packagesvulnerabilidades.service";

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

export default function TopPackageVulnerabilidadeCard() {
  const [topPackages, setTopPackages] = useState<TopPackageVulnerabilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await getTopPackagesVulnerabilidades(5, "todos");
      setTopPackages(lista);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar Top Packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Top 5 Pacotes</h3>
        <span className="text-xs text-gray-400">Total</span>
      </div>

      {err && <div className="text-xs text-red-400 mb-2">{err}</div>}

      {loading ? (
        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex justify-between items-center">
              <span className="h-4 w-40 rounded bg-white/10 animate-pulse" />
              <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
            </li>
          ))}
        </ul>
      ) : topPackages.length > 0 ? (
        <ul className="space-y-2 py-3">
          {topPackages.slice(0, 5).map((pkg) => (
            <li
              key={pkg.package}
              className="flex justify-between items-center text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5 pb-1"
            >
              <span className="truncate font-medium text-gray-400">
                {pkg.package}
              </span>
              <span className="font-medium text-gray-400">
                {formatPt(pkg.total)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-center text-gray-400 py-4">
          Sem vulnerabilidades de pacotes
        </div>
      )}
    </div>
  );
}
