import { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Pane, CircleMarker, useMap, ZoomControl, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';

type GeoHitsMapProps = {
  height?: number | string;
  dias?: '1' | '7' | '15' | '30' | 'todos';
};

type TopPais = {
  pais: string;
  total: number;
  lat: number | null;
  lng: number | null;
};

function FitToData({ points, target }: { points: { lat: number; lng: number }[]; target?: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    const todos = [...points];
    if (target) todos.push(target);
    if (!todos.length) return;
    const bounds = L.latLngBounds(todos.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.2));
  }, [map, points, target]);
  return null;
}

/** Injeta <defs> com o gradient no mesmo <svg> do Leaflet */
function MapGradientDefs() {
  const map = useMap();
  useEffect(() => {
    const pane = map.getPanes().overlayPane as HTMLElement | null;
    if (!pane) return;
    const svg = pane.querySelector('svg');
    if (!svg) return;

    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.prepend(defs);
    }

    let grad = svg.querySelector('#flowArcGradient') as SVGLinearGradientElement | null;
    if (!grad) {
      grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', 'flowArcGradient');
      grad.setAttribute('gradientUnits', 'objectBoundingBox');
      grad.setAttribute('x1', '0%');
      grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '100%');
      grad.setAttribute('y2', '0%');

      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#EC4899');
      stop1.setAttribute('stop-opacity', '1');

      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#EC4899');
      stop2.setAttribute('stop-opacity', '0.15');

      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
    }
  }, [map]);
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

// gera um "hue" (0–359) estável a partir do nome do país
function hueFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 37 + s.charCodeAt(i)) % 360;
  }
  return h;
}

// cor HSL agradável (viva mas não neon)
function colorForCountry(name: string) {
  const h = hueFromString(name);
  return `hsl(${h} 75% 55%)`; // pode ajustar saturação/luminosidade aqui
}

export default function GeoHitsMap({ height = 400, dias = 'todos' }: GeoHitsMapProps) {
  const [points, setPoints] = useState<{ lat: number; lng: number; count: number; pais: string }[]>([]);
  const [target, setTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const darkTiles = useMemo(
    () => 'https://{s}.basemaps.cartocdn.com/spotify_dark/{z}/{x}/{y}{r}.png',
    []
  );

  // fetch
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setCarregando(true);
        setErro(null);
        const API_URL = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('token');

        const url = new URL(`${API_URL}/api/acesso/wazuh/top-paises-geo`);
        if (dias) url.searchParams.set('dias', dias);

        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: { topPaises: TopPais[] } = await res.json();
        if (!ativo) return;

        const pts = (data?.topPaises || [])
          .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
          .map(p => ({ lat: p.lat as number, lng: p.lng as number, count: p.total, pais: p.pais }));

        setPoints(pts);

        const br = pts.find(p => p.pais.toLowerCase() === 'brazil');
        setTarget(br ? { lat: br.lat, lng: br.lng } : { lat: -14.235, lng: -51.9253 });
      } catch (e: any) {
        if (ativo) setErro(e?.message || 'Erro ao carregar pontos do mapa');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [dias]);

  // pré-calcula todos os arcos (um por país → Brasil)
  const arcs = useMemo(() => {
    if (!target) return [] as { positions: [number, number][], group: number }[];
    return points.map((src, i) => {
      const p0 = { lat: src.lat, lng: src.lng };
      const p1 = { lat: target.lat, lng: target.lng };
      const c = controlPoint(p0, p1, 0.24);
      const sampled = sampleBezier(p0, c, p1, 80).map(p => [p.lat, p.lng]) as [number, number][];
      return { positions: sampled, group: i % 6 }; // grupo para variar delay/duração
    });
  }, [points, target]);

  return (
    <div
      className="w-full relative z-0 rounded-sm overflow-hidden"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        background: 'radial-gradient(circle at center, #6B21A8 0%, #321C5E 40%, #1B1032 75%, #0D0C22 100%)'
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
        <MapGradientDefs /> {/* gradient para os arcos */}
        <ZoomControl position="topleft" />

        <Pane name="basemap" style={{ zIndex: 200 }}>
          <TileLayer url={darkTiles} />
        </Pane>

        <Pane name="bubbles" style={{ zIndex: 400 }}>
          {/* alvo: Brasil */}
          {target && (
            <CircleMarker
              center={[target.lat, target.lng]}
              radius={6}
              pathOptions={{ color: 'transparent', fillColor: '#22c55e', fillOpacity: 0.85 }}
              className="bubble-pulse"
            />
          )}

          {/* países (com tooltip) */}
          {points.map((p, i) => (
            <CircleMarker
              key={`pt-${i}`}
              center={[p.lat, p.lng]}
              radius={Math.max(4, Math.log10(p.count + 10))}
              pathOptions={{
                // uma bordinha sutil ajuda a destacar sobre o tile escuro
                color: 'rgba(255,255,255,0.15)',
                weight: 0.6,
                fillColor: colorForCountry(p.pais),
                fillOpacity: 0.8,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1} className="country-tip">
                <div className="text-xs">
                  <div className="font-medium">{p.pais}</div>
                  <div className="opacity-80">Eventos: {p.count.toLocaleString()}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

        </Pane>

        {/* TODOS os arcos animando juntos */}
        <Pane name="shooting-lines" className="shooting-lines-pane" style={{ zIndex: 350 }}>
          {arcs.map((arc, i) => (
            <Polyline
              key={`arc-${i}`}
              positions={arc.positions}
              pathOptions={{
                weight: 2.2,
                opacity: 0.95,
                dashArray: '6 28', // segmento + espaço (parece “fluxo”)
                // NÃO defina 'color' aqui; o stroke vem do CSS com o gradient
              }}
              className={`flow-arc s-i-${arc.group}`}
            />
          ))}
        </Pane>

        <FitToData points={points} target={target ?? undefined} />
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