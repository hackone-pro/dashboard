// @ts-ignore
import { VectorMap } from '@south-paw/react-vector-maps';

import world from '../../maps/world.json'; // ajuste o caminho se necessário

// Dados fictícios, IDs em minúsculo conforme seu world.json
const incidents: Record<string, number> = {
  br: 80,
  us: 45,
  fr: 23,
  ru: 80,
  ca: 100,
  cn: 14,
  in: 12,
  de: 7,
  au: 8,
};

// Função para definir cor conforme quantidade de incidentes
function getFill(id: string) {
  const value = incidents[id] || 0;
  if (value > 50) return '#f87171';   // Vermelho
  if (value > 20) return '#fbbf24';   // Laranja
  if (value > 0) return '#34d399';    // Verde
  return '#22223b';                   // Cor default
}

export default function MapaIncidentes() {
  return (
    <div style={{
      margin: '0 auto',
      padding: 16,
      position: 'relative',
      minHeight: 300,
    }}>
      <VectorMap
        {...world}
        // @ts-ignore
        layerProps={(layer:any) => ({
          style: {
            fill: getFill(layer.id),
            stroke: "#333652",
            strokeWidth: 0.7,
            cursor: incidents[layer.id] ? "pointer" : "default",
            transition: "fill 0.3s",
          },
          onMouseEnter: (e: any) => {
            e.target.style.opacity = 0.8;
          },
          onMouseLeave: (e: any) => {
            e.target.style.opacity = 1;
          },
          onClick: () => alert(`${layer.name}: ${incidents[layer.id] || 0} incidentes`)
        })}
      />

      {/* Legenda */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        left: 18,
        background: 'rgba(0,0,0,0.82)',
        borderRadius: 7,
        padding: '7px 18px',
        color: '#fff',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 1px 8px #0003',
      }}>
        <b>Legenda:</b>
        <span style={{
          display: 'inline-block', width: 12, height: 12, borderRadius: 9999, background: '#f87171', marginRight: 3
        }} /> {'> 50'}
        <span style={{
          display: 'inline-block', width: 12, height: 12, borderRadius: 9999, background: '#fbbf24', marginRight: 3
        }} /> {'> 20'}
        <span style={{
          display: 'inline-block', width: 12, height: 12, borderRadius: 9999, background: '#34d399', marginRight: 3
        }} /> {'1-20'}
        <span style={{
          display: 'inline-block', width: 12, height: 12, borderRadius: 9999, background: '#22223b', marginRight: 3, border: '1px solid #555'
        }} /> {'0'}
      </div>
    </div>
  );
}
