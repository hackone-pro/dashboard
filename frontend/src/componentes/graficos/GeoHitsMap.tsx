import { useMemo, useRef, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Pane,
  CircleMarker,
  useMap,
  ZoomControl,
  Polyline,
} from "react-leaflet";
import L from "leaflet";

import { useAttackStream } from "../../context/AttackStreamProvider";

/* =========================
   TIPOS
========================= */
type Flow = {
  origem: {
    ip: string;
    pais?: string | null;
    lat: number | null;
    lng: number | null;
  };
  destino: {
    ip: string;
    pais?: string | null;
    lat: number | null;
    lng: number | null;
    devname?: string | null;
  };
};

type GeoHitsMapProps = {
  height?: number | string;
};

/* =========================
   CONFIG
========================= */
const MAX_FLOWS = 120;
const MAP_LIFETIME_MS = 8000;

/* =========================
   FIT BOUNDS (1x)
========================= */
function FitToData({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  const ajustou = useRef(false);

  useEffect(() => {
    if (!points.length || ajustou.current) return;

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.2));
    ajustou.current = true;
  }, [map, points]);

  return null;
}

/* =========================
   BEZIER HELPERS
========================= */
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
  for (let i = 0; i <= samples; i++) {
    pts.push(bezierPoint(i / samples, p0, c, p1));
  }
  return pts;
}

/* =========================
   COMPONENT
========================= */
export default function GeoHitsMap({ height = 400 }: GeoHitsMapProps) {
  const { events } = useAttackStream();

  const [nowTick, setNowTick] = useState(Date.now());

  /* 🔄 reavalia vida útil dos eventos */
  useEffect(() => {
    const i = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => clearInterval(i);
  }, []);

  /* =========================
     EVENTOS ATIVOS (8s)
  ========================= */
  const activeEvents = useMemo(() => {
    return events.filter(
      (e) =>
        e.ts &&
        nowTick - e.ts <= MAP_LIFETIME_MS &&
        e.origem?.lat != null &&
        e.origem?.lng != null &&
        e.destino?.lat != null &&
        e.destino?.lng != null
    );
  }, [events, nowTick]);

  /* =========================
     FLOWS
  ========================= */
  const flows: Flow[] = useMemo(() => {
    return activeEvents
      .filter((e) => {
        if (!e.origem || !e.destino) return false;

        if (
          e.origem.lat === e.destino.lat &&
          e.origem.lng === e.destino.lng
        ) {
          return false;
        }

        return true;
      })
      .slice(0, MAX_FLOWS)
      .map((e) => ({
        origem: e.origem!,
        destino: e.destino!,
      }));
  }, [activeEvents]);

  /* =========================
     PONTOS (FIT)
  ========================= */
  const allPoints = useMemo(() => {
    return flows.flatMap((f) => {
      const pts: { lat: number; lng: number }[] = [];
      if (f.origem.lat && f.origem.lng)
        pts.push({ lat: f.origem.lat, lng: f.origem.lng });
      if (f.destino.lat && f.destino.lng)
        pts.push({ lat: f.destino.lat, lng: f.destino.lng });
      return pts;
    });
  }, [flows]);

  /* =========================
     ARCOS
  ========================= */
  const arcs = useMemo(() => {
    return flows
      .map((f, i) => {
        if (
          !f.origem.lat ||
          !f.origem.lng ||
          !f.destino.lat ||
          !f.destino.lng
        ) {
          return null;
        }

        const p0 = { lat: f.origem.lat, lng: f.origem.lng };
        const p1 = { lat: f.destino.lat, lng: f.destino.lng };
        const c = controlPoint(p0, p1);

        return {
          id: `${f.origem.ip}-${f.destino.ip}-${i}`,
          group: i % 6,
          positions: sampleBezier(p0, c, p1, 80).map((p) => [
            p.lat,
            p.lng,
          ]) as [number, number][],
        };
      })
      .filter(Boolean) as {
      id: string;
      group: number;
      positions: [number, number][];
    }[];
  }, [flows]);

  const darkTiles =
    "https://{s}.basemaps.cartocdn.com/spotify_dark/{z}/{x}/{y}{r}.png";

  /* =========================
     RENDER
  ========================= */
  return (
    <div
      className="w-full relative rounded-sm overflow-hidden z-0"
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

        {/* ORIGENS */}
        <Pane name="origin-bubbles" style={{ zIndex: 410 }}>
          {flows.map(
            (f, i) =>
              f.origem.lat &&
              f.origem.lng && (
                <CircleMarker
                  key={`origem-${f.origem.ip}-${i}`}
                  center={[f.origem.lat, f.origem.lng]}
                  radius={5}
                  pathOptions={{
                    color: "transparent",
                    fillColor: "#c52248",
                    fillOpacity: 0.85,
                  }}
                  className="origin-pulse"
                />
              )
          )}
        </Pane>

        {/* DESTINOS */}
        <Pane name="dest-bubbles" style={{ zIndex: 420 }}>
          {flows.map(
            (f, i) =>
              f.destino.lat &&
              f.destino.lng && (
                <CircleMarker
                  key={`destino-${f.destino.ip}-${i}`}
                  center={[f.destino.lat, f.destino.lng]}
                  radius={6}
                  pathOptions={{
                    color: "transparent",
                    fillColor: "#22c55e",
                    fillOpacity: 0.85,
                  }}
                  className="bubble-pulse"
                />
              )
          )}
        </Pane>

        {/* ARCOS */}
        <Pane
          name="shooting-lines"
          className="shooting-lines-pane"
          style={{ zIndex: 350 }}
        >
          {arcs.map((arc) => (
            <Polyline
              key={arc.id}
              positions={arc.positions}
              pathOptions={{
                weight: 2.2,
                opacity: 0.9,
                color: "#a855f7",
              }}
              className={`flow-arc s-i-${arc.group}`}
            />
          ))}
        </Pane>

        <FitToData points={allPoints} />
      </MapContainer>
    </div>
  );
}
