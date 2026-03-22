import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { ptBR } from "date-fns/locale";
import { registerLocale } from "react-datepicker";
import { addDays } from "date-fns";
import { FaCalendarAlt } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";

type PeriodoRapido = "24h" | "48h" | "7d" | "15d" | "30d";

// Períodos rápidos mapeados para dias (janelas canônicas do backend)
const MAPA_DIAS: Record<PeriodoRapido, string> = {
  "24h": "1",
  "48h": "2",
  "7d":  "7",
  "15d": "15",
  "30d": "30",
};

registerLocale("pt-BR", ptBR);

// Payload diferenciado:
// - períodos rápidos → { dias: "7" }
// - range customizado → { from: string; to: string }
export type DateRangePayload =
  | { dias: string; from?: undefined; to?: undefined }
  | { from: string; to: string; dias?: undefined };

export default function DateRangePicker({
  onApply,
  resetKey,
}: {
  onApply: (payload: DateRangePayload) => void;
  resetKey?: number;
}) {
  const [open, setOpen] = useState(false);
  const [periodoRapido, setPeriodoRapido] = useState<PeriodoRapido>("24h");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hoje = new Date();
  const limiteInicio = new Date();
  limiteInicio.setMonth(limiteInicio.getMonth() - 12);

  /* ================= CLICK FORA ================= */
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* ================= RESET EXTERNO ================= */
  useEffect(() => {
    if (resetKey === undefined) return;
    setPeriodoRapido("24h");
    setStartDate(null);
    setEndDate(null);
  }, [resetKey]);

  function calcularDatas(periodo: PeriodoRapido) {
    const agora = new Date();
    const dias  = Number(MAPA_DIAS[periodo]);
    const from  = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
    return { from, to: agora };
  }

  function aplicar() {
    const agora = new Date();

    // ─── Período rápido → passa dias diretamente (não from/to)
    if (periodoRapido) {
      onApply({ dias: MAPA_DIAS[periodoRapido] });
      setOpen(false);
      return;
    }

    // ─── Range customizado do calendário → passa from/to
    if (startDate && endDate) {
      const from = new Date(startDate);
      from.setHours(0, 0, 0, 0);

      const to = new Date(endDate);
      to.setHours(23, 59, 59, 999);

      if (to > agora) to.setTime(agora.getTime());
      if (from > agora) return;

      onApply({ from: from.toISOString(), to: to.toISOString() });
      setOpen(false);
      return;
    }

    // ─── Fallback: 24h
    onApply({ dias: "1" });
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[14px] text-purple-400 hover:text-purple-200 transition-colors"
      >
        {/* @ts-ignore */}
        <FaCalendarAlt className="w-4 h-4" />
        Filtros
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-3 z-50
            bg-[#0A0617] border border-[#1D1929]
            rounded-xl p-4 shadow-lg
            min-w-[530px]
          "
        >
          {/* PERÍODOS RÁPIDOS */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-gray-400 text-sm mr-2">Dias:</span>

            {(["24h", "48h", "7d", "15d", "30d"] as PeriodoRapido[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  const { from, to } = calcularDatas(p);
                  setPeriodoRapido(p);
                  setStartDate(from);
                  setEndDate(to);
                }}
                className={`px-3 py-1 rounded-md text-sm border transition
                  ${
                    periodoRapido === p
                      ? "bg-purple-600/20 text-purple-300 border-purple-600"
                      : "text-gray-400 border-[#1D1929] hover:border-purple-500"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* CALENDÁRIO */}
          <DatePicker
            inline
            locale="pt-BR"
            selectsRange
            monthsShown={2}
            startDate={startDate}
            endDate={endDate}
            onChange={(dates: [Date | null, Date | null]) => {
              const [start, end] = dates;
              // Seleção manual no calendário → limpa período rápido
              setPeriodoRapido(null as any);
              setStartDate(start);
              setEndDate(end);
            }}
            minDate={limiteInicio}
            maxDate={
              startDate
                ? addDays(startDate, 30) > hoje
                  ? hoje
                  : addDays(startDate, 30)
                : hoje
            }
            dateFormat="dd/MM/yyyy"
          />

          <div className="flex justify-end mt-4">
            <button
              onClick={aplicar}
              className="
                bg-purple-600 hover:bg-purple-700
                text-white px-4 py-2 rounded-md
                text-sm transition
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