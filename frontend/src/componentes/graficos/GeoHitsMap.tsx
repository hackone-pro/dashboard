import { useMemo, useEffect } from 'react';
import {
  MapContainer, TileLayer, Pane, CircleMarker, Tooltip, useMap, ZoomControl
} from 'react-leaflet';
import L from 'leaflet';

// Dados fictícios
const points = [
  { lat: -23.55, lng: -46.63, count: 14118 },
  { lat: -22.90, lng: -43.20, count: 10588 },
  { lat: -34.60, lng: -58.38, count: 7059 },
  { lat:  51.51, lng:  -0.13, count: 3530 },
  { lat:  40.71, lng: -74.00, count: 1200 },
  { lat:  48.85, lng:   2.35, count: 800  },
  { lat:  52.52, lng:  13.40, count: 600  },
];

function FitToData() {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.2));
  }, [map]);
  return null;
}

function getColor(v: number) {
  if (v > 10588) return '#ff4d5a';
  if (v > 7059)  return '#ff7a50';
  if (v > 3530)  return '#ffb14d';
  return '#ffcf66';
}

function getRadius(v: number) {
  return Math.max(4, Math.sqrt(v) / 8);
}

export default function GeoHitsMap() {
  const darkTiles = useMemo(
    () => 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    []
  );

  return (
    <div className="w-full h-[400px] relative z-0 rounded-sm overflow-hidden">
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
          <TileLayer url={darkTiles} attribution='&copy; OpenStreetMap & Carto' />
        </Pane>

        <Pane name="bubbles" style={{ zIndex: 400 }}>
          {points.map((p, i) => (
            <CircleMarker
              key={i}
              center={[p.lat, p.lng]}
              radius={getRadius(p.count)}
              pathOptions={{
                color: 'transparent',
                fillColor: getColor(p.count),
                fillOpacity: 0.85,
              }}
            >
              <Tooltip direction="top" offset={[0, -2]} opacity={1} className="!bg-[#0f0f14] !text-white">
                <div style={{ fontSize: 12 }}>
                  <div><b>Count:</b> {p.count.toLocaleString('en-US')}</div>
                  <div><b>Lat/Lng:</b> {p.lat.toFixed(2)}, {p.lng.toFixed(2)}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </Pane>

        <Pane name="ui" style={{ zIndex: 600 }}>
          <div
            style={{
              position: 'absolute',
              top: 30,
              left: -50,
              width:150,
              background: 'rgba(18,18,24,0.9)',
              border: '1px solid #2c2c3a',
              borderRadius: 2,
              padding: '10px 12px',
              color: '#ddd',
              fontSize: 12,
              lineHeight: 1.3,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Count</div>
            <div style={{ display: 'grid', gap: 6 }}>
              <LegendItem color="#ffcf66" label="1 – 3.530" />
              <LegendItem color="#ffb14d" label="3.531 – 7.059" />
              <LegendItem color="#ff7a50" label="7.060 – 10.588" />
              <LegendItem color="#ff4d5a" label="10.589 – 14.118" />
            </div>
          </div>
        </Pane>

        <FitToData />
      </MapContainer>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{
        width: 10, height: 10, background: color, borderRadius: '50%', display: 'inline-block'
      }} />
      <span>{label}</span>
    </div>
  );
}