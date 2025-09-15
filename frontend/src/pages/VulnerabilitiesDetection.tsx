import { useEffect, useState } from 'react';
import { getVulnSeveridades, VulnSeveridades } from "../services/wazuh/vulnseveridades.service";
import { getTopVulnerabilidades, TopVulnerabilidade } from '../services/wazuh/topseveridades.service';
import { getTopOSVulnerabilidades, TopOSVulnerabilidade } from "../services/wazuh/topsovulnerabilidades.service";
import { getTopAgentesVulnerabilidades, TopAgenteVulnerabilidade } from '../services/wazuh/agentesvulnerabilidades.service';
import { getTopPackagesVulnerabilidades, TopPackageVulnerabilidade } from '../services/wazuh/packagesvulnerabilidades.service';
import { getTopScoresVulnerabilidades, TopScoreItem } from '../services/wazuh/vulntopscores.service';
import { getAnoVulnerabilidades, AnoVulnerabilidade } from '../services/wazuh/anovulnerabilidades.service';

import GraficoBarHorizontal from '../componentes/graficos/GraficoBarraHorizontal';
import GraficoStackedBarChart from '../componentes/graficos/GraficoStackedBarChart';

import LayoutModel from '../componentes/LayoutModel';
import { FaSyncAlt } from "react-icons/fa";

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

export default function VulnerabilitiesDetection() {

  const [data, setData] = useState<VulnSeveridades | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [topVulns, setTopVulns] = useState<TopVulnerabilidade[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [errTop, setErrTop] = useState<string | null>(null);

  const [topSo, setTopSo] = useState<TopOSVulnerabilidade[]>([]);
  const [loadingTopSo, setLoadingTopSo] = useState(true);
  const [errTopSo, setErrTopso] = useState<string | null>(null);

  const [topAgents, setTopAgents] = useState<TopAgenteVulnerabilidade[]>([]);
  const [loadingTopAgents, setLoadingTopAgents] = useState(true);
  const [errTopAgents, setErrTopAgents] = useState<string | null>(null);

  const [topPackages, setTopPackages] = useState<TopPackageVulnerabilidade[]>([]);
  const [loadingTopPackages, setLoadingTopPackages] = useState(true);
  const [errTopPackages, setErrTopPackages] = useState<string | null>(null);

  const [topScores, setTopScores] = useState<TopScoreItem[]>([]);
  const [loadingTopScores, setLoadingTopScores] = useState(true);
  const [errTopScores, setErrTopScores] = useState<string | null>(null);

  const [anoVulns, setAnoVulns] = useState<AnoVulnerabilidade[]>([]);
  const [loadingAnoVulns, setLoadingAnoVulns] = useState(true);
  const [errAnoVulns, setErrAnoVulns] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getVulnSeveridades();
        setData(res);
      } catch (e: any) {
        setErr(e?.message || "Falha ao carregar severidades");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const lista = await getTopVulnerabilidades("cve", 5, "todos");
        setTopVulns(lista);
      } catch (e: any) {
        setErrTop(e?.message || "Falha ao carregar Top vulnerabilidades");
      } finally {
        setLoadingTop(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const lista = await getTopOSVulnerabilidades(5, "todos");
        setTopSo(lista);
      } catch (e: any) {
        setErrTopso(e?.message || "Falha ao carregar Top OS");
      } finally {
        setLoadingTopSo(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const lista = await getTopAgentesVulnerabilidades(5, "todos");
        setTopAgents(lista);
      } catch (e: any) {
        setErrTopAgents(e?.message || "Falha ao carregar Top Agents");
      } finally {
        setLoadingTopAgents(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const lista = await getTopPackagesVulnerabilidades(5, "todos");
        setTopPackages(lista);
      } catch (e: any) {
        setErrTopPackages(e?.message || "Falha ao carregar Top Packages");
      } finally {
        setLoadingTopPackages(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const lista = await getTopScoresVulnerabilidades(5, "todos"); // default
        setTopScores(lista);
      } catch (e: any) {
        setErrTopScores(e?.message || "Falha ao carregar distribuição CVSS");
      } finally {
        setLoadingTopScores(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const lista = await getAnoVulnerabilidades("todos"); // busca padrão
        setAnoVulns(lista);
      } catch (e: any) {
        setErrAnoVulns(e?.message || "Falha ao carregar vulnerabilidades por ano");
      } finally {
        setLoadingAnoVulns(false);
      }
    })();
  }, []);

  return (
    <LayoutModel titulo="Detecção de vulnerabilidades">
      <section className="cards p-6 rounded-2xl shadow-lg">
        <div className="flex flex-wrap justify-between items-start mb-6">
          <div className="flex flex-col">
            <h3 className="text-white text-base font-semibold">
              {data?.total !== undefined && (
                <span>alertas totais: {formatPt(data.total)}</span>
              )}
            </h3>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-md border border-[#1D1929] bg-[#0A0617] hover:bg-gray-700 text-gray-400 px-3 py-1 rounded-md transition"
            >
              {/* @ts-ignore */}
              <FaSyncAlt className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {err && (
          <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2 mb-4">
            {err}
          </div>
        )}

        {/* Grid com 5 colunas (responsivo) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
          {/* Card base */}
          {loading ? (
            // Skeletons enquanto carrega
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 h-full border border-white/5 animate-pulse"
              >
                <div className="h-8 w-24 mb-2 rounded bg-white/10" />
                <div className="h-4 w-40 rounded bg-white/10" />
              </div>
            ))
          ) : (
            <>
              {/* Crítico */}
              <div className="rounded-xl p-4 h-full border border-white/5 text-center">
                <div className="text-3xl font-semibold leading-tight text-pink-400">
                  {formatPt(data?.critical ?? 0)}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Severidade Crítica
                </div>
              </div>

              {/* Alto */}
              <div className="rounded-xl p-4 h-full border border-white/5 text-center">
                <div className="text-3xl font-semibold leading-tight text-violet-400">
                  {formatPt(data?.high ?? 0)}
                </div>
                <div className="text-sm text-gray-300 mt-1">Severidade Alta</div>
              </div>

              {/* Médio */}
              <div className="rounded-xl p-4 h-full border border-white/5 text-center">
                <div className="text-3xl font-semibold leading-tight text-indigo-400">
                  {formatPt(data?.medium ?? 0)}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Severidade Média
                </div>
              </div>

              {/* Baixo */}
              <div className="rounded-xl p-4 h-full border border-white/5 text-center">
                <div className="text-3xl font-semibold leading-tight text-emerald-400">
                  {formatPt(data?.low ?? 0)}
                </div>
                <div className="text-sm text-gray-300 mt-1">Severidade Baixa</div>
              </div>

              {/* Pendentes (Avaliação) */}
              <div className="rounded-xl p-4 h-full border border-white/5 text-center">
                <div className="text-3xl font-semibold leading-tight text-slate-300">
                  {formatPt(data?.pending ?? 0)}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Pendentes (Avaliação)
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl shadow-lg my-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">

          {/* Coluna 1 - Top 5 Vulnerabilidades */}
          <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-white">Top 5 Vulnerabilidades</h3>
              <span className="text-xs text-gray-400">Total</span>
            </div>

            {errTop && (
              <div className="text-xs text-red-400 mb-2">{errTop}</div>
            )}

            {loadingTop ? (
              <ul className="space-y-2 ">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span className="h-4 w-32 rounded bg-white/10 animate-pulse" />
                    <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 py-3">
                {topVulns.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5 pb-1"
                  >
                    <span className="truncate font-medium text-gray-400">{item.key}</span>
                    <span className='font-medium text-gray-400'>{item.total}</span>
                  </li>
                ))}
                {topSo.length === 0 && (
                  <li className='text-center'>
                    <span className='text-xs text-gray-400 py-4'>Sem vulnerabilidades</span>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Coluna 2 */}
          <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-white">Top 5 (OS)</h3>
              <span className="text-xs text-gray-400">Total</span>
            </div>

            {errTopSo && (
              <div className="text-xs text-red-400 mb-2">{errTopSo}</div>
            )}

            {loadingTopSo ? (
              <ul className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span className="h-4 w-40 rounded bg-white/10 animate-pulse" />
                    <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 py-3">
                {topSo.slice(0, 5).map((os) => (
                  <li
                    key={os.os}
                    className="flex justify-between items-center text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5 pb-1"
                  >
                    <span className="truncate font-medium text-gray-400">{os.os}</span>
                    <span className='font-medium text-gray-400'>{formatPt(os.total)}</span>
                  </li>
                ))}
                {topSo.length === 0 && (
                  <li className='text-center'>
                    <span className='text-xs text-gray-400 py-4'>Sem vulnerabilidades de OS</span>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Coluna 3 */}
          <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-white">Top 5 Agentes</h3>
              <span className="text-xs text-gray-400">Total</span>
            </div>

            {errTopAgents && (
              <div className="text-xs text-red-400 mb-2">{errTopAgents}</div>
            )}

            {loadingTopAgents ? (
              <ul className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span className="h-4 w-40 rounded bg-white/10 animate-pulse" />
                    <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 py-3">
                {topAgents.slice(0, 5).map((agent) => (
                  <li
                    key={agent.agent}
                    className="flex justify-between items-center text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5 pb-1"
                  >
                    <span className="truncate font-medium text-gray-400">{agent.agent}</span>
                    <span className="font-medium text-gray-400">{formatPt(agent.total)}</span>
                  </li>
                ))}
                {topAgents.length === 0 && (
                  <li className='text-center'>
                    <span className='text-xs text-gray-400 py-4'>Sem vulnerabilidades em agentes</span>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Coluna 4 */}
          <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-white">Top 5 Pacotes</h3>
              <span className="text-xs text-gray-400">Total</span>
            </div>

            {errTopPackages && (
              <div className="text-xs text-red-400 mb-2">{errTopPackages}</div>
            )}

            {loadingTopPackages ? (
              <ul className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span className="h-4 w-40 rounded bg-white/10 animate-pulse" />
                    <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : (
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
                {topPackages.length === 0 && (
                  <li className='text-center'>
                    <span className='text-xs text-gray-400 py-4'>Sem vulnerabilidades de pacotes</span>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl shadow-lg my-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-white">
                Pontuações de vulnerabilidade mais comuns
              </h3>
            </div>

            {errTopScores && (
              <div className="text-xs text-red-400 mb-2">{errTopScores}</div>
            )}

            {loadingTopScores ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
                Carregando gráfico...
              </div>
            ) : topScores.length > 0 ? (
              <GraficoBarHorizontal
                categorias={topScores.map((s) => s.score)}
                valores={topScores.map((s) => s.total)}
                cor="#632BD3" // roxo padrão
                tituloY="Pontuação base de vulnerabilidade"
              />
            ) : (
              <div className="text-xs text-center text-gray-400 py-4">
                Sem dados de vulnerabilidades
              </div>
            )}
          </div>
          <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-white">Pontuações de vulnerabilidade mais comuns</h3>
            </div>

            {errTopSo && (
              <div className="text-xs text-red-400 mb-2">{errTopSo}</div>
            )}

            {loadingTopSo ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
                Carregando gráfico...
              </div>
            ) : topSo.length > 0 ? (
              <GraficoBarHorizontal
                categorias={topSo.map((os) => os.os)}     // nomes dos OS
                valores={topSo.map((os) => os.total)}    // totais de vulnerabilidades
                cor="#632BD3"
                tituloY="Tipo de sistema operacional host"
              />
            ) : (
              <div className="text-xs text-center text-gray-400 py-4">
                Sem vulnerabilidades de OS
              </div>
            )}
          </div>
          <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-white">Vulnerabilidades por Ano</h3>
            </div>

            {errAnoVulns && (
              <div className="text-xs text-red-400 mb-2">{errAnoVulns}</div>
            )}

            {loadingAnoVulns ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
                Carregando gráfico...
              </div>
            ) : anoVulns.length > 0 ? (
              <GraficoStackedBarChart
                categorias={anoVulns.map((a) => a.ano)} // eixo X
                series={[
                  {
                    name: "Baixo",
                    data: anoVulns.map((a) => a.severity.Low || 0),
                  },
                  {
                    name: "Médio",
                    data: anoVulns.map((a) => a.severity.Medium || 0),
                  },
                  {
                    name: "Alto",
                    data: anoVulns.map((a) => a.severity.High || 0),
                  },
                  {
                    name: "Crítico",
                    data: anoVulns.map((a) => a.severity.Critical || 0),
                  },
                ]}
              />
            ) : (
              <div className="text-xs text-center text-gray-400 py-4">
                Sem dados de vulnerabilidades por ano
              </div>
            )}
          </div>

        </div>
      </section>
    </LayoutModel>
  );
}
