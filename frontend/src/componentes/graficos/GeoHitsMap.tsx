// src/components/GeoHitsMap.tsx
import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Pane, CircleMarker, useMap, ZoomControl, Polyline } from 'react-leaflet';
import L from 'leaflet';

type GeoHitsMapProps = { height?: number | string }; // 👈 NOVO (opcional; default 400)

const points = [
  { lat: 41.87, lng: 12.56, count: 1200 },
  { lat: 55.75, lng: 37.62, count: 1100 },
  { lat: 45.42, lng: -75.69, count: 1050 },
  { lat: -35.28, lng: 149.13, count: 980 },
  { lat: 38.72, lng: -9.14, count: 920 },
  { lat: 35.68, lng: 139.76, count: 850 },
  { lat: 39.91, lng: 116.40, count: 800 },
];

const target = { lat: -23.55, lng: -46.63 };

function FitToData() {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.2));
  }, [map]);
  return null;
}

export default function GeoHitsMap({ height = 400 }: GeoHitsMapProps) { // 👈 default mantém o card igual
  const darkTiles = useMemo(
    () => 'https://{s}.basemaps.cartocdn.com/spotify_dark/{z}/{x}/{y}{r}.png',
    []
  );

  return (
    <div
      className="w-full relative z-0 rounded-sm overflow-hidden"
      style={{
        height: typeof height === 'number' ? `${height}px` : height, // 👈 altura controlável
        background: 'radial-gradient(circle at center, #6B21A8 0%, #321C5E 40%, #1B1032 75%, #0D0C22 100%)',
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
          <CircleMarker
            center={[target.lat, target.lng]}
            radius={6}
            pathOptions={{ color: 'transparent', fillColor: '#22c55e', fillOpacity: 0.85 }}
            className="bubble-pulse"
          />
        </Pane>

        <Pane name="shooting-lines" style={{ zIndex: 350 }}>
          {points.map((p, i) => (
            <Polyline
              key={`line-${i}`}
              positions={[[p.lat, p.lng], [target.lat, target.lng]]}
              pathOptions={{ color: '#EC4899', weight: 2, opacity: 1 }}
              className="shooting-line"
            />
          ))}
        </Pane>

        <FitToData />
      </MapContainer>
    </div>
  );
}
