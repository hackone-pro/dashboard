// src/components/wazuh/TopPackageVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getTopPackagesVulnerabilidades,
  TopPackageVulnerabilidade,
} from "../../../services/wazuh/packagesvulnerabilidades.service";
import { useTenant } from "../../../context/TenantContext"; // 👈 tenant global

export type TopPackageVulnerabilidadeCardRef = {
  carregar: () => void;
};

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

const TopPackageVulnerabilidadeCard = forwardRef<TopPackageVulnerabilidadeCardRef>((props, ref) => {
  const { tenantAtivo } = useTenant(); // 👈 obtém tenant ativo
  const [topPackages, setTopPackages] = useState<TopPackageVulnerabilidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    if (!tenantAtivo) return; // 🔹 evita chamada antes do tenant carregar
    setCarregando(true);
    try {
      // 🔹 tenant tratado internamente no service
      const lista = await getTopPackagesVulnerabilidades(5, "todos");
      setTopPackages(lista);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar Top Packages");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [tenantAtivo]); // 👈 recarrega automaticamente ao trocar tenant

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  // 🔹 Skeleton (carregando)
  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-white">Top 5 Pacotes</h3>
          <span className="text-xs text-gray-400">Total</span>
        </div>

        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex justify-between items-center">
              <span className="h-4 w-40 rounded bg-white/10 animate-pulse" />
              <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 🔹 Erro
  if (erro) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-red-400">
        {erro}
      </div>
    );
  }

  // 🔹 Sem dados
  if (!topPackages.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem vulnerabilidades de pacotes
      </div>
    );
  }

  // 🔹 Dados carregados
  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Top 5 Pacotes</h3>
        <span className="text-xs text-gray-400">Total</span>
      </div>

      <ul className="space-y-2 py-3">
        {topPackages.slice(0, 5).map((pkg) => (
          <li
            key={pkg.package}
            className="flex justify-between items-center text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5 pb-1"
          >
            <span className="truncate font-medium text-gray-400">{pkg.package}</span>
            <span className="font-medium text-gray-400">{formatPt(pkg.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default TopPackageVulnerabilidadeCard;