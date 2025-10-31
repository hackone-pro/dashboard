import { useEffect, useMemo, useState } from "react";
import { getTopCountriesWithSeverity } from "../../../services/wazuh/topcountries-severity.service";
import { useTenant } from "../../../context/TenantContext";

type Totais = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
};

export default function ThreatSeverityCard({
  className = "",
  dias = "todos",
  topN = 5,
}: {
  className?: string;
  dias?: string;
  topN?: number;
}) {
  const { tenantAtivo } = useTenant(); // 👈 apenas como dependência
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [totais, setTotais] = useState<Totais>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  });

  useEffect(() => {
    if (!tenantAtivo) return; // 🔹 só busca após o tenant carregar

    let ativo = true;
    (async () => {
      try {
        setLoading(true);
        setErro(null);

        // 🔹 o tenant é tratado internamente pelo service
        const paises = await getTopCountriesWithSeverity(dias, topN);

        const sums = paises.reduce(
          (acc, item) => {
            acc.critical += item.severidades.critical;
            acc.high += item.severidades.high;
            acc.medium += item.severidades.medium;
            acc.low += item.severidades.low;
            return acc;
          },
          { critical: 0, high: 0, medium: 0, low: 0 }
        );

        const final: Totais = {
          ...sums,
          total: sums.critical + sums.high + sums.medium + sums.low,
        };

        if (!ativo) return;
        setTotais(final);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar Threat Severity");
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [dias, topN, tenantAtivo]); // 👈 reagindo ao tenant ativo, sem passá-lo

  const fmt = useMemo(() => new Intl.NumberFormat("pt-BR"), []);
  const linhas = [
    { nome: "Crítico", cor: "#EC4899", valor: totais.critical },
    { nome: "Alto", cor: "#6A55DC", valor: totais.high },
    { nome: "Médio", cor: "#6301F4", valor: totais.medium },
    { nome: "Baixo", cor: "#1DD69A", valor: totais.low },
  ];

  if (loading) {
    return (
      <div className={`cards rounded-xl p-4 shadow-md ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-24 bg-[#ffffff14] rounded animate-pulse" />
        </div>
        <div className="h-7 w-28 bg-[#ffffff14] rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-24 bg-[#ffffff14] rounded animate-pulse" />
              <div className="h-3 w-10 bg-[#ffffff14] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={`cards rounded-xl p-4 shadow-md ${className}`}>
        <p className="text-xs text-red-400">{erro}</p>
      </div>
    );
  }

  return (
    <div className={`cards rounded-xl p-4 shadow-md mt-[10px] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs text-gray-300">Gravidade das Ameaças (Países)</h4>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-white text-2xl font-semibold">
          {fmt.format(totais.total)}
        </span>
        <span className="text-gray-400 text-sm">Ameaças</span>
      </div>

      <div className="space-y-2 text-sm">
        {linhas.map((l) => (
          <Linha key={l.nome} cor={l.cor} nome={l.nome} valor={fmt.format(l.valor)} />
        ))}
      </div>
    </div>
  );
}

function Linha({ cor, nome, valor }: { cor: string; nome: string; valor: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
        <span className="text-gray-300">{nome}</span>
      </div>
      <span className="text-gray-300">{valor}</span>
    </div>
  );
}