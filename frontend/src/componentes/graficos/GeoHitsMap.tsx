import { useMemo, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Pane,
  CircleMarker,
  useMap,
  ZoomControl,
  Polyline,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";

import { useTenant } from "../../context/TenantContext";

type GeoHitsMapProps = {
  height?: number | string;
  dias?: "1" | "7" | "15" | "30" | "todos";
};

type Flow = {
  origem: {
    ip: string;
    pais: string | null;
    cidade?: string | null;
    lat: number | null;
    lng: number | null;
    srcport: string | null;
    servico: string | null;
    interface: string | null;
  };
  destino: {
    ip: string;
    pais?: string | null;
    cidade?: string | null;
    lat: number | null;
    lng: number | null;
    agente?: string | null;
    tenant?: string | null;
    dstintf?: string | null;
    dstport?: string | null;
    devname?: string | null;
  };
  total: number;
  severidades: { key: string; doc_count: number }[];
};


function FitToData({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.2));
  }, [map, points]);
  return null;
}

/* ------- helpers de arco (Bézier) ------- */
type Pt = { lat: number; lng: number };

function controlPoint(p0: Pt, p1: Pt, curvature = 0.24): Pt {
  const mid = { lat: (p0.lat + p1.lat) / 2, lng: (p0.lng + p1.lng) / 2 };
  const dx = p1.lng - p0.lng;
  const dy = p1.lat - p0.lat;
  return { lat: mid.lat + dx * curvature, lng: mid.lng - dy * curvature };
}
function bezierPoint(t: number, p0: Pt, c: Pt, p1: Pt): Pt {
  const u = 1 - t;
  return {
    lat: u * u * p0.lat + 2 * u * t * c.lat + t * t * p1.lat,
    lng: u * u * p0.lng + 2 * u * t * c.lng + t * t * p1.lng,
  };
}
function sampleBezier(p0: Pt, c: Pt, p1: Pt, samples = 80): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= samples; i++) pts.push(bezierPoint(i / samples, p0, c, p1));
  return pts;
}

export default function GeoHitsMap({ height = 400, dias = "todos" }: GeoHitsMapProps) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { tenantAtivo } = useTenant();

  const darkTiles = useMemo(
    () => "https://{s}.basemaps.cartocdn.com/spotify_dark/{z}/{x}/{y}{r}.png",
    []
  );

  // fetch
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    (async () => {
      try {
        setCarregando(true);
        setErro(null);

        const inicio = Date.now();
        const API_URL = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem("token");

        const url = new URL(`${API_URL}/api/acesso/wazuh/top-paises-geo`);
        if (dias) url.searchParams.set("dias", dias);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: { flows: Flow[] } = await res.json();
        if (!ativo) return;

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0); // tempo mínimo p/ transição suave
        setTimeout(() => {
          if (ativo) setFlows(data.flows || []);
        }, delay);
      } catch (e: any) {
        if (ativo) setErro(e?.message || "Erro ao carregar pontos do mapa");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [dias, tenantAtivo]); // 👈 reage também à troca de tenant

  // prepara pontos para ajustar bounds
  const allPoints = useMemo(() => {
    return flows.flatMap((f) => {
      const pts: { lat: number; lng: number }[] = [];
      if (f.origem.lat && f.origem.lng) pts.push({ lat: f.origem.lat, lng: f.origem.lng });
      if (f.destino.lat && f.destino.lng) pts.push({ lat: f.destino.lat, lng: f.destino.lng });
      return pts;
    });
  }, [flows]);

  // calcula arcos origem → destino
  const arcs = useMemo(() => {
    return flows
      .map((f, i) => {
        if (!f.origem.lat || !f.origem.lng || !f.destino.lat || !f.destino.lng) return null;
        const p0 = { lat: f.origem.lat, lng: f.origem.lng };
        const p1 = { lat: f.destino.lat, lng: f.destino.lng };
        const c = controlPoint(p0, p1, 0.24);
        const sampled = sampleBezier(p0, c, p1, 80).map((p) => [p.lat, p.lng]) as [
          number,
          number
        ][];
        return { positions: sampled, group: i % 6 };
      })
      .filter(Boolean) as { positions: [number, number][]; group: number }[];
  }, [flows]);

  return (
    <div
      className="w-full relative z-0 rounded-sm overflow-hidden"
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        background:
          "radial-gradient(circle at center, #6B21A8 0%, #321C5E 40%, #1B1032 75%, #0D0C22 100%)",
      }}
    >
      <MapContainer
        zoom={2}
        center={[0, 0]}
        minZoom={2}
        maxZoom={4}
        zoomControl={false}
        className="w-full h-full"
        worldCopyJump
      >
        <ZoomControl position="topleft" />

        <Pane name="basemap" style={{ zIndex: 200 }}>
          <TileLayer url={darkTiles} />
        </Pane>

        {/* ORIGENS (pulse vermelho) */}
        <Pane name="origin-bubbles" style={{ zIndex: 410 }}>
          {flows.map(
            (f, i) =>
              f.origem.lat &&
              f.origem.lng && (
                <CircleMarker
                  key={`origem-${i}`}
                  center={[f.origem.lat, f.origem.lng]}
                  radius={5}
                  pathOptions={{
                    color: "transparent",
                    fillColor: "#c52248",
                    fillOpacity: 0.85,
                  }}
                  className="origin-pulse"
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} className="country-tip">
                    <div className="text-xs p-1">
                      <div className="pb-1 text-gray-300">
                        <b className="text-[#9385e3] uppercase">Origem:</b>{" "}
                        {f.origem.pais === "Interno"
                          ? "IP Interno"
                          : [f.origem.cidade, f.origem.pais].filter(Boolean).join(" - ") || "Desconhecido"}
                      </div>
                      {/* <div><b>Total:</b> {f.total}</div> */}
                      <div className="pb-1 text-gray-300"><b className="text-[#9385e3] uppercase">IP:</b> {f.origem.ip}</div>
                      <div className="pb-1 text-gray-300"><b className="text-[#9385e3] uppercase">Porta:</b> {f.origem.srcport || "N/A"}</div>
                      <div className="pb-1 text-gray-300"><b className="text-[#9385e3] uppercase">Serviço:</b> {f.origem.servico || "N/A"}</div>
                      <div className="pb-1 text-gray-300"><b className="text-[#9385e3] uppercase">Interface:</b> {f.origem.interface || "N/A"}</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              )
          )}
        </Pane>

        {/* DESTINOS (pulse verde) */}
        <Pane name="dest-bubbles" style={{ zIndex: 420 }}>
          {flows.map(
            (f, i) =>
              f.destino.lat &&
              f.destino.lng && (
                <CircleMarker
                  key={`destino-${i}`}
                  center={[f.destino.lat, f.destino.lng]}
                  radius={6}
                  pathOptions={{
                    color: "transparent",
                    fillColor: "#22c55e",
                    fillOpacity: 0.85,
                  }}
                  className="bubble-pulse"
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} className="country-tip">
                    <div className="text-xs p-1">
                      <div className="pb-1 text-gray-300">
                        <b className="text-[#9385e3] uppercase">Destino:</b>{" "}
                        {f.destino.pais === "Interno"
                          ? "IP Interno"
                          : [f.destino.cidade, f.destino.pais].filter(Boolean).join(" - ") || "Desconhecido"}
                      </div>
                      <div className="pb-1 text-gray-300"><b className="text-[#9385e3] uppercase">IP:</b> {f.destino.ip}</div>
                      {/* <div><b>Agente:</b> {f.destino.agente || "N/A"}</div> */}
                      <div className="pb-1 text-gray-300"><b className="text-[#9385e3] uppercase">Interface:</b> {f.destino.dstintf || "N/A"}</div>
                      <div className="pb-1 text-gray-300"><b className="text-[#9385e3] uppercase">Porta:</b> {f.destino.dstport || "N/A"}</div>
                      <div className="pb-1 text-gray-300"><b className="text-[#9385e3] uppercase">Device:</b> {f.destino.devname || "N/A"}</div>
                      {/* <div className="pt-1"><b>Total:</b> {f.total}</div> */}
                    </div>
                  </Tooltip>
                </CircleMarker>
              )
          )}
        </Pane>

        {/* ARCOS + DOTS CORRENDO */}
        <Pane name="shooting-lines" className="shooting-lines-pane" style={{ zIndex: 350 }}>
          {arcs.map((arc, i) => {
            const d =
              `M ${arc.positions[0][1]},${arc.positions[0][0]} ` +
              arc.positions.slice(1).map((p) => `L ${p[1]},${p[0]}`).join(" ");

            return (
              <g key={`arc-${i}`}>
                <Polyline
                  positions={arc.positions}
                  pathOptions={{
                    weight: 2.2,
                    opacity: 0.95,
                    color: "transparent",   // 👈 transparente
                  }}
                  className={`flow-arc s-i-${arc.group}`}
                />

                {/* dot correndo */}
                {[...Array(3)].map((_, j) => (
                  <circle
                    key={`dot-${i}-${j}`}
                    className="glow-dot"
                    style={{
                      offsetPath: `path('${d}')`,
                      offsetRotate: "auto",
                      ["--dot-dur" as any]: `${2.5 + Math.random() * 1.5}s`, // duração aleatória
                      ["--delay" as any]: `${Math.random() * 5}s`,            // delay aleatório
                    }}
                  />
                ))}
              </g>
            );
          })}
        </Pane>

        <FitToData points={allPoints} />
      </MapContainer>

      {carregando && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 bg-black/20">
          Carregando mapa…
        </div>
      )}
      {erro && (
        <div className="absolute bottom-2 left-2 text-[11px] px-2 py-1 rounded bg-red-600/70 text-white">
          {erro}
        </div>
      )}
    </div>
  );
}
