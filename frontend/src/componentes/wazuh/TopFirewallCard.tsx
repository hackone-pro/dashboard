import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { getTopFirewalls, TopFirewallItem } from "../../services/wazuh/topfirewall.service";
import { useTenant } from "../../context/TenantContext";

export default function TopFirewallCard() {
  const [firewalls, setFirewalls] = useState<TopFirewallItem[]>([]);
  const [dias, setDias] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { tenantAtivo } = useTenant();

  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    async function fetchData() {
      try {
        setCarregando(true);
        setErro(null);
        const dados = await getTopFirewalls(dias);
        if (!ativo) return;
        setFirewalls(dados.slice(0, 5)); // Top 5
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao buscar top firewalls");
        setFirewalls([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetchData();
    return () => {
      ativo = false;
    };
  }, [dias, tenantAtivo]);

  const categorias = useMemo(() => firewalls.map((fw) => fw.gerador), [firewalls]);

  const absBaixo = firewalls.map((fw) => fw.severidade.baixo);
  const absMedio = firewalls.map((fw) => fw.severidade.medio);
  const absAlto = firewalls.map((fw) => fw.severidade.alto);
  const absCritico = firewalls.map((fw) => fw.severidade.critico);
  const allZero = [absBaixo, absMedio, absAlto, absCritico].every((arr) =>
    arr.every((v) => v === 0)
  );

  const MIN_PCT = 1.0;
  function buildDisplaySeries() {
    const n = categorias.length;
    const dispBaixo = new Array(n).fill(0);
    const dispMedio = new Array(n).fill(0);
    const dispAlto = new Array(n).fill(0);
    const dispCrit = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      const vals = [
        absBaixo[i] || 0,
        absMedio[i] || 0,
        absAlto[i] || 0,
        absCritico[i] || 0,
      ];
      const total = vals.reduce((a, b) => a + b, 0);
      if (total <= 0) continue;

      let pct = vals.map((v) => (v / total) * 100);
      let extra = 0;
      for (let j = 0; j < pct.length; j++) {
        if (vals[j] > 0 && pct[j] > 0 && pct[j] < MIN_PCT) {
          extra += MIN_PCT - pct[j];
          pct[j] = MIN_PCT;
        }
      }

      if (extra > 0) {
        const idxMaior = vals.indexOf(Math.max(...vals));
        pct[idxMaior] = Math.max(0, pct[idxMaior] - extra);
      }

      const soma = pct.reduce((a, b) => a + b, 0);
      const diff = soma - 100;
      if (Math.abs(diff) > 0.01) {
        const idxMaior = vals.indexOf(Math.max(...vals));
        pct[idxMaior] = Math.max(0, pct[idxMaior] - diff);
      }

      dispBaixo[i] = pct[0];
      dispMedio[i] = pct[1];
      dispAlto[i] = pct[2];
      dispCrit[i] = pct[3];
    }

    return { dispBaixo, dispMedio, dispAlto, dispCrit };
  }

  const { dispBaixo, dispMedio, dispAlto, dispCrit } = useMemo(buildDisplaySeries, [
    categorias.join("|"),
    absBaixo,
    absMedio,
    absAlto,
    absCritico,
  ]);

  const series = useMemo(() => {
    if (allZero) {
      return [{ name: "Alertas", data: firewalls.map((fw) => fw.total) }];
    }
    return [
      { name: "Baixo", data: dispBaixo },
      { name: "Médio", data: dispMedio },
      { name: "Alto", data: dispAlto },
      { name: "Crítico", data: dispCrit },
    ];
  }, [allZero, firewalls, dispBaixo, dispMedio, dispAlto, dispCrit]);

  const isStacked = series.length > 1;

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: isStacked,
      stackType: isStacked ? "100%" : undefined,
      toolbar: { show: false },
      foreColor: "#99a1af",
    },
    plotOptions: { bar: { horizontal: true, barHeight: "60%" } },
    stroke: { width: 2, colors: ["#0d0c22"] },
    dataLabels: { enabled: false },
    tooltip: {
      theme: "dark",
      custom: ({ dataPointIndex }) => {
        const name = categorias[dataPointIndex] || "";
        const vB = absBaixo[dataPointIndex] || 0;
        const vM = absMedio[dataPointIndex] || 0;
        const vA = absAlto[dataPointIndex] || 0;
        const vC = absCritico[dataPointIndex] || 0;

        return `
          <div style="background:#1b1530; padding:8px 10px; border-radius:8px; border:1px solid #2d2650; min-width:140px">
            <div style="color:#eae6ff; font-weight:600; margin-bottom:6px">${name}</div>
            <div style="color:#EC4899">Crítico: ${vC.toLocaleString("pt-BR")}</div>
            <div style="color:#A855F7">Alto: ${vA.toLocaleString("pt-BR")}</div>
            <div style="color:#6366F1">Médio: ${vM.toLocaleString("pt-BR")}</div>
            <div style="color:#10B981">Baixo: ${vB.toLocaleString("pt-BR")}</div>
          </div>
        `;
      },
    },
    xaxis: {
      categories: categorias,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { show: true, style: { colors: "#99a1af" } } },
    legend: {
      show: isStacked,
      position: "bottom",
      labels: { colors: "#c7c7d1" },
    },
    grid: {
      borderColor: "#2c2c3a",
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
    },
    colors: ["#1DD69A", "#6366F1", "#A855F7", "#F914AD"],
    fill: { opacity: 1 },
  };

  const chartKey = `tfw-${dias}-${tenantAtivo?.id ?? "none"}`;

  return (
    <div className="cards flex-grow p-6 rounded-2xl shadow-lg card-dashboard relative transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="grid grid-cols-12 mb-5">
        <div className="col-span-8">
          <h3 className="text-sm text-white">Top 5 Firewalls geradores de alertas</h3>
        </div>
        <div className="col-span-4 flex items-center justify-end">
          <select
            className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-sm border border-[#1D1929]"
            value={dias}
            onChange={(e) => setDias(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="1">24 horas</option>
            <option value="7">7 dias</option>
            <option value="15">15 dias</option>
            <option value="30">30 dias</option>
          </select>
        </div>
      </div>

      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
          {erro}
        </div>
      )}

      {carregando ? (
        // 🔹 Skeleton igual aos outros cards
        <div className="flex flex-col gap-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-40 bg-[#ffffff0a] rounded" />
              <div className="h-3 w-20 bg-[#ffffff0a] rounded" />
            </div>
          ))}
        </div>
      ) : firewalls.length === 0 ? (
        <div className="text-xs text-gray-400">Nenhum dado para exibir.</div>
      ) : (
        <Chart key={chartKey} options={options} series={series as any} type="bar" height={340} />
      )}
    </div>
  );
}