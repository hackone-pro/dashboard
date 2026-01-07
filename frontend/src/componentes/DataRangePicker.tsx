// src/componentes/DataRangePicker.tsx
import { SetStateAction, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { ptBR } from "date-fns/locale";
import { registerLocale } from "react-datepicker";
import { FaCalendarAlt } from "react-icons/fa";
import { HiArrowLongRight } from "react-icons/hi2";
import "react-datepicker/dist/react-datepicker.css";

type PeriodoRapido = "24h" | "48h" | "7d" | "15d" | "30d";

export default function DateRangePicker({
  onApply,
}: {
  onApply: (payload: { from: string; to: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [periodoRapido, setPeriodoRapido] = useState<PeriodoRapido>("24h");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hoje = new Date();
  const limiteInicio = new Date();
  limiteInicio.setMonth(limiteInicio.getMonth() - 1);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function calcularPeriodo(periodo: PeriodoRapido) {
    const agora = new Date();

    const mapa: Record<PeriodoRapido, number> = {
      "24h": 1,
      "48h": 2,
      "7d": 7,
      "15d": 15,
      "30d": 30,
    };

    const from = new Date(
      agora.getTime() - mapa[periodo] * 24 * 60 * 60 * 1000
    );

    return { from, to: agora };
  }

  function aplicar() {
    let from: Date;
    let to: Date;

    if (periodoRapido) {
      ({ from, to } = calcularPeriodo(periodoRapido));
    } else if (startDate && endDate) {
      from = new Date(startDate);
      from.setHours(0, 0, 0, 0);

      to = new Date(endDate);
      to.setHours(23, 59, 59, 999);
    } else {
      ({ from, to } = calcularPeriodo("24h"));
    }

    onApply({
      from: from.toISOString(),
      to: to.toISOString(),
    });

    setOpen(false);
  }

  return (
    <div className="relative">
      {/* BOTÃO FILTROS */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-[14px] text-purple-400 hover:text-purple-200 transition-colors"
      >
        {/* @ts-ignore */}
        <FaCalendarAlt className="w-4 h-4" />
        Filtros
      </button>

      {/* MODAL */}
      {open && (
        <div
          className="absolute right-0 mt-3 z-50 bg-[#0A0617] border border-[#1D1929] rounded-xl p-4 w-[auto] shadow-lg flex flex-col"
        >

          {/* LINHA 1 — PERÍODOS RÁPIDOS */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-gray-400 text-sm mr-2">Dias:</span>

            {(["24h", "48h", "7d", "15d", "30d"] as PeriodoRapido[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  const { from, to } = calcularPeriodo(p);
                  setPeriodoRapido(p);
                  setStartDate(from);
                  setEndDate(to);
                }}
                className={`px-3 py-1 rounded-md text-sm border transition
                  ${periodoRapido === p
                    ? "bg-purple-600/20 text-purple-300 border-purple-600"
                    : "text-gray-400 border-[#1D1929] hover:border-purple-500"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* LINHA 2 — CALENDÁRIOS */}
          <div className="flex items-start gap-4 mb-4">
            <div>
              <span className="text-xs text-gray-500 block mb-1">
                Data inicial
              </span>
              <DatePicker
                selected={startDate}
                onChange={(d: Date | null) => {
                  setPeriodoRapido(null as any);
                  setStartDate(d);
                  setEndDate(null); // força escolher data final novamente
                }}
                minDate={limiteInicio}
                maxDate={hoje}
                dateFormat="dd/MM/yyyy"
                inline
              />

            </div>
            {/* @ts-ignore */}
            <HiArrowLongRight className="text-gray-500 mt-10" />

            <div>
              <span className="text-xs text-gray-500 block mb-1">
                Data final
              </span>
              <DatePicker
                selected={endDate}
                onChange={(d: Date | null) => {
                  setPeriodoRapido(null as any);
                  setEndDate(d);
                }}
                minDate={startDate ?? limiteInicio}
                maxDate={hoje}
                dateFormat="dd/MM/yyyy"
                inline
              />

            </div>
          </div>

          {/* LINHA 3 — APLICAR */}
          <div className="flex justify-end">
            <button
              onClick={aplicar}
              className="
                flex items-center gap-2
                bg-purple-600 hover:bg-purple-700
                text-white px-4 py-2
                rounded-md text-sm transition
              "
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
