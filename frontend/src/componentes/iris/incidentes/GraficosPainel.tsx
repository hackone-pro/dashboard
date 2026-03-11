// src/componentes/incidentes/GraficosPainel.tsx
//
// Painel com os 4 cards de donut (abertos, fechados, atribuídos, não atribuídos).

import GraficoDonutIncidentes from "../../graficos/GraficoDonutIncidentes";
import { GraficoSkeleton } from "./ui";

import { FaLockOpen, FaRegCheckCircle } from "react-icons/fa";
import { HiLockClosed } from "react-icons/hi";
import { VscError } from "react-icons/vsc";

import { agruparPorSeveridade } from "../../../utils/incidentes/helpers";
import { nivelDoIncidente } from "../../../hooks/useIncidentes";

import type { PageIncidente } from "../../../types/incidentes.types";
import type { FiltroOrigem } from "../../../hooks/useIncidentes";

/* =========================================
 * TYPES
 * ======================================= */
interface GraficosPainelProps {
  carregando: boolean;
  chartResetKey: number;
  abertos: PageIncidente[];
  fechados: PageIncidente[];
  atribuidos: PageIncidente[];
  naoAtribuidos: PageIncidente[];
  onFiltrar: (nivel: string | null, origem: FiltroOrigem) => void;
}

/* =========================================
 * COMPONENTE
 * ======================================= */
export default function GraficosPainel({
  carregando,
  chartResetKey,
  abertos,
  fechados,
  atribuidos,
  naoAtribuidos,
  onFiltrar,
}: GraficosPainelProps) {
  if (carregando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GraficoSkeleton />
        <GraficoSkeleton />
        <GraficoSkeleton />
        <GraficoSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <GraficoDonutIncidentes
        key={`abertos-${chartResetKey}`}
        titulo={
          <span className="flex items-center gap-1">
            {/* @ts-ignore */}
            <FaLockOpen className="text-gray-400" /> Incidentes abertos
          </span>
        }
        total={abertos.length}
        valores={agruparPorSeveridade(abertos, nivelDoIncidente)}
        onFiltrarPorNivel={(nivel) => onFiltrar(nivel || null, nivel ? "abertos" : null)}
      />

      <GraficoDonutIncidentes
        key={`fechados-${chartResetKey}`}
        titulo={
          <span className="flex items-center gap-1">
            {/* @ts-ignore */}
            <HiLockClosed className="text-gray-400" /> Incidentes fechados
          </span>
        }
        total={fechados.length}
        valores={agruparPorSeveridade(fechados, nivelDoIncidente)}
        onFiltrarPorNivel={(nivel) => onFiltrar(nivel, "fechados")}
      />

      <GraficoDonutIncidentes
        key={`atribuidos-${chartResetKey}`}
        titulo={
          <span className="flex items-center gap-1">
            {/* @ts-ignore */}
            <FaRegCheckCircle className="text-gray-400" /> Incidentes atribuídos
          </span>
        }
        total={atribuidos.length}
        valores={agruparPorSeveridade(atribuidos, nivelDoIncidente)}
        onFiltrarPorNivel={(nivel) => onFiltrar(nivel, "atribuidos")}
      />

      <GraficoDonutIncidentes
        key={`naoatribuidos-${chartResetKey}`}
        titulo={
          <span className="flex items-center gap-1">
            {/* @ts-ignore */}
            <VscError className="text-gray-400" /> Incidentes não atribuídos
          </span>
        }
        total={naoAtribuidos.length}
        valores={agruparPorSeveridade(naoAtribuidos, nivelDoIncidente)}
        onFiltrarPorNivel={(nivel) => onFiltrar(nivel, "nao_atribuidos")}
      />
    </div>
  );
}