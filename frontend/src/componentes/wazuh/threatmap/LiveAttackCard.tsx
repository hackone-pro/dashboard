import { useEffect, useRef, useState } from "react";
import { FiActivity } from "react-icons/fi";
import { guessCountryCode } from "../../../utils/countryUtils";
import { useAttackStream } from "../../../context/AttackStreamProvider";

type LiveAttack = {
  tecnica?: string;
  origemPais: string;
  destinoPais: string;
  device?: string;
  _id: string;
};

export default function LiveAttackCard({ className = "" }) {
  const { newEvents, ready } = useAttackStream();

  const [ataques, setAtaques] = useState<LiveAttack[]>([]);
  const [offsetY, setOffsetY] = useState(-36);
  const [animando, setAnimando] = useState(false);

  const primeiraCarga = useRef(true);

  const VISIBLE_COUNT = 5;
  const BUFFER = 1;
  const ROW_HEIGHT = 36;
  const TICK_MS = 20;

  /* ============================
     RECEBE EVENTOS NOVOS
  ============================ */
  useEffect(() => {
    if (!ready) return;

    if (primeiraCarga.current) {
      primeiraCarga.current = false;
      return;
    }

    if (!newEvents.length) return;

    const novos: LiveAttack[] = newEvents
      .filter((f: any) => {
        if (
          !f.origem ||
          !f.destino ||
          f.origem.lat == null ||
          f.origem.lng == null ||
          f.destino.lat == null ||
          f.destino.lng == null
        ) {
          return false;
        }

        // ignora ataques sem deslocamento real
        if (
          f.origem.lat === f.destino.lat &&
          f.origem.lng === f.destino.lng
        ) {
          return false;
        }

        return true;
      })
      .map((f: any) => ({
        tecnica:
          f.rule?.mitre?.technique?.join?.(", ") ||
          f.rule?.mitre?.technique ||
          f.rule?.description ||
          "—",
      
        origemPais: f.origem.pais || "Desconhecido",
        destinoPais: f.destino.pais || "Desconhecido",
        device: f.destino.devname || "N/A",
        _id: f._id,
      }));
      

    setAtaques((prev) => [...novos.reverse(), ...prev]);
    setAnimando(true);
    setOffsetY(-ROW_HEIGHT);
  }, [newEvents, ready]);

  /* ============================
     ANIMAÇÃO SOMENTE SE HOUVER EVENTO
  ============================ */
  useEffect(() => {
    if (!animando) return;

    const interval = setInterval(() => {
      setOffsetY((prev) => {
        const next = prev + 1;

        if (next >= 0) {
          setAnimando(false);
          setAtaques((prevAtaques) =>
            prevAtaques.slice(0, VISIBLE_COUNT + BUFFER)
          );
          return 0;
        }

        return next;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [animando]);

  /* ============================
     SKELETON — SÓ NA 1ª CARGA
  ============================ */
  if (!ready) {
    return (
      <div className={`p-4 bg-[#0b061a]/90 border border-[#ffffff12] ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          {/* @ts-ignore */}
          <FiActivity className="text-purple-400 animate-pulse" size={16} />
          <div className="h-4 w-44 bg-[#ffffff14] rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 bg-[#ffffff08] rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ============================
     RENDER
  ============================ */
  return (
    <div className={className}>
      <div className="flex items-center justify-between px-3 py-3 bg-[#0A0617] border border-[#ffffff12]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-sm text-gray-200 font-medium">
            Ataques cibernéticos ao vivo
          </span>
        </div>
        <span className="text-[11px] text-gray-400">
          {new Date().toLocaleDateString("pt-BR")}
        </span>
      </div>

      <div className="grid grid-cols-4 text-[13px] text-white px-3 py-2 bg-[#120c24] border border-[#ffffff0f] text-center">
        <span>Técnica de Ataque</span>
        <span>Origem</span>
        <span>Destino</span>
        <span>Origem de Detecção</span>
      </div>

      <div className="relative overflow-hidden h-[180px]">
        <div className="bg-[#100D19]/80 backdrop-blur-md px-3 py-2">
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              willChange: "transform",
            }}
          >
            {ataques.map((ataque, i) => (
              <div
                key={ataque._id + i}
                className="grid grid-cols-4 items-center text-xs py-2"
              >
                <div className="text-gray-400 truncate">
                  {ataque.tecnica}
                </div>

                <div className="flex flex-col items-center gap-1">
                  {guessCountryCode(ataque.origemPais) && (
                    <img
                      src={`https://flagcdn.com/24x18/${guessCountryCode(
                        ataque.origemPais
                      )!.toLowerCase()}.png`}
                      width={18}
                      height={14}
                    />
                  )}
                  <span className="text-gray-400 truncate text-center">
                    {ataque.origemPais}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  {guessCountryCode(ataque.destinoPais) && (
                    <img
                      src={`https://flagcdn.com/24x18/${guessCountryCode(
                        ataque.destinoPais
                      )!.toLowerCase()}.png`}
                      width={18}
                      height={14}
                    />
                  )}
                  <span className="text-gray-400 truncate text-center">
                    {ataque.destinoPais}
                  </span>
                </div>

                <div className="flex justify-center text-gray-400">
                  {ataque.device}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
