// src/components/GeoHitsMap.tsx
import { useMemo, useEffect, useState, useRef } from 'react';
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

// -------- helpers gerais --------
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickWeightedIndex(
  pts: { count: number }[],
  excludeIdx?: number
): number {
  const total = pts.reduce((acc, p, idx) => acc + (idx === excludeIdx ? 0 : (p.count || 1)), 0);
  if (total <= 0) return 0;
  let r = Math.random() * total;
  for (let i = 0; i < pts.length; i++) {
    if (i === excludeIdx) continue;
    r -= (pts[i].count || 1);
    if (r <= 0) return i;
  }
  return 0;
}

// -------- helpers do arco (Bézier quadrático em coordenadas lat/lng) --------
type Pt = { lat: number; lng: number };

function controlPoint(p0: Pt, p1: Pt, curvature = 0.25): Pt {
  // ponto médio
  const mid = { lat: (p0.lat + p1.lat) / 2, lng: (p0.lng + p1.lng) / 2 };
  // vetor P0->P1 no espaço (x = lng, y = lat)
  const dx = p1.lng - p0.lng;
  const dy = p1.lat - p0.lat;
  // desloca o controle perpendicularmente para criar o arco
  return {
    lat: mid.lat + dx * curvature,
    lng: mid.lng - dy * curvature,
  };
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
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    pts.push(bezierPoint(t, p0, c, p1));
  }
  return pts;
}

export default function GeoHitsMap({ height = 400, dias = 'todos' }: GeoHitsMapProps) {
  const [points, setPoints] = useState<{ lat: number; lng: number; count: number; pais: string }[]>([]);
  const [target, setTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ativo (-1 = silêncio)
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const activeRef = useRef<number>(-1);
  useEffect(() => { activeRef.current = activeIdx; }, [activeIdx]);

  // velocidade da animação do "glow dot"
  const speedClasses = ['speed-0', 'speed-1', 'speed-2'];
  const [speedClass, setSpeedClass] = useState<string>('speed-1');

  // scheduler params
  const MIN_MS = 900;
  const MAX_MS = 2800;
  const SILENT_CHANCE = 0.15;

  // animação do dot ao longo do arco (0..1)
  const [animT, setAnimT] = useState<number>(0);
  const rafRef = useRef<number | null>(null);

  const darkTiles = useMemo(
    () => 'https://{s}.basemaps.cartocdn.com/spotify_dark/{z}/{x}/{y}{r}.png',
    []
  );

  // fetch dos dados
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

        // alvo = Brasil (ou centróide do BR)
        const br = pts.find(p => p.pais.toLowerCase() === 'brazil');
        setTarget(br ? { lat: br.lat, lng: br.lng } : { lat: -14.235, lng: -51.9253 });

        // começa em silêncio
        setActiveIdx(-1);
      } catch (e: any) {
        if (ativo) setErro(e?.message || 'Erro ao carregar pontos do mapa');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [dias]);

  // scheduler aleatório (um país por vez, pausas aleatórias)
  useEffect(() => {
    if (points.length === 0) return;

    let timeoutId: number | undefined;

    const tick = () => {
      const doSilent = Math.random() < SILENT_CHANCE;

      if (doSilent) {
        setActiveIdx(-1);
      } else {
        const next = pickWeightedIndex(points, activeRef.current >= 0 ? activeRef.current : undefined);
        setActiveIdx(next);
        setSpeedClass(speedClasses[randInt(0, speedClasses.length - 1)]);
      }

      const delay = randInt(MIN_MS, MAX_MS);
      timeoutId = window.setTimeout(tick, delay);
    };

    timeoutId = window.setTimeout(tick, randInt(MIN_MS, MAX_MS));
    return () => { if (timeoutId) window.clearTimeout(timeoutId); };
  }, [points]);

  // anima o "glow dot" de 0→1 toda vez que muda o ativo
  useEffect(() => {
    if (activeIdx < 0) { setAnimT(0); if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const start = performance.now();
    const dur = 1100 + randInt(0, 700); // 1.1s–1.8s
    // animação linear (pode trocar por easing se quiser)
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setAnimT(t);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [activeIdx]);

  // calcula arco + posição do dot para o ativo
  const arcPositions: [number, number][] | null = (() => {
    if (activeIdx < 0 || !target || !points[activeIdx]) return null;
    const src = points[activeIdx];
    const p0 = { lat: src.lat, lng: src.lng };
    const p1 = { lat: target.lat, lng: target.lng };
    const c = controlPoint(p0, p1, 0.24);  // ajuste a curvatura aqui (0.15–0.35)
    const sampled = sampleBezier(p0, c, p1, 80);
    return sampled.map(p => [p.lat, p.lng]);
  })();

  const dotCenter: [number, number] | null = (() => {
    if (activeIdx < 0 || !target || !points[activeIdx]) return null;
    const src = points[activeIdx];
    const p0 = { lat: src.lat, lng: src.lng };
    const p1 = { lat: target.lat, lng: target.lng };
    const c = controlPoint(p0, p1, 0.24);
    const p = bezierPoint(animT, p0, c, p1);
    return [p.lat, p.lng];
  })();

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
        <ZoomControl position="topleft" />

        <Pane name="basemap" style={{ zIndex: 200 }}>
          <TileLayer url={darkTiles} />
        </Pane>

        <Pane name="bubbles" style={{ zIndex: 400 }}>
          {/* alvo: BRASIL */}
          {target && (
            <CircleMarker
              center={[target.lat, target.lng]}
              radius={6}
              pathOptions={{ color: 'transparent', fillColor: '#22c55e', fillOpacity: 0.85 }}
              className="bubble-pulse"
            />
          )}

          {/* países (adicione Tooltip se quiser) */}
          {points.map((p, i) => (
            <CircleMarker
              key={`pt-${i}`}
              center={[p.lat, p.lng]}
              radius={Math.max(4, Math.log10(p.count + 10))}
              pathOptions={{
                color: 'transparent',
                fillColor: '#EC4899',
                fillOpacity: i === activeIdx ? 0.95 : 0.6,
              }}
              className={i === activeIdx ? 'source-active' : undefined}
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

        {/* arco + glow dot do ativo */}
        <Pane name="shooting-lines" className="shooting-lines-pane" style={{ zIndex: 350 }}>
          {arcPositions && (
            <Polyline
              positions={arcPositions}
              pathOptions={{
                color: '#EC4899',
                weight: 2.2,
                opacity: 0.85,
              }}
              className={`flow-arc ${speedClass}`}
            />
          )}
          {dotCenter && (
            <CircleMarker
              center={dotCenter}
              radius={4}
              pathOptions={{ color: 'transparent', fillColor: '#EC4899', fillOpacity: 1 }}
              className={`glow-dot ${speedClass}`}
            />
          )}
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