import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import Contador from './Contador'; // ajuste o caminho se for diferente

type RiskLevel = 'High' | 'Medium' | 'Low';

interface RiskLevelCardProps {
  level: RiskLevel;
  value: number; // Valor de risco (%)
  incidentes?: number; // Novo: total de incidentes
}

const levelConfig = {
  High: {
    colorFrom: 'from-red-700',
    colorTo: 'to-orange-500',
    icon: <ShieldAlert className="w-16 h-16 text-[#A855F7]" />,
    label: 'RISK LEVEL',
    bar: 'bg-gradient-to-r from-red-700 to-orange-400',
    contadorColor: 'text-red-500'
  },
  Medium: {
    colorFrom: 'from-yellow-600',
    colorTo: 'to-yellow-300',
    icon: <AlertTriangle className="w-16 h-16 text-[#6366F1]" />,
    label: 'RISK LEVEL',
    bar: 'bg-gradient-to-r from-yellow-600 to-yellow-300',
    contadorColor: 'text-yellow-500'
  },
  Low: {
    colorFrom: 'from-cyan-700',
    colorTo: 'to-green-400',
    icon: <CheckCircle className="w-16 h-16 text-[#1DD69A]" />,
    label: 'RISK LEVEL',
    bar: 'bg-gradient-to-r from-cyan-700 to-green-400',
    contadorColor: 'text-cyan-500'
  }
};

export default function RiskLevelCard({ level, value, incidentes }: RiskLevelCardProps) {
  const config = levelConfig[level];

  return (
    <div className={`relative p-10 rounded-2xl shadow-lg flex flex-col justify-center items-center bg-gradient-to-br ${config.colorFrom} ${config.colorTo} w-full h-full min-h-[300px] transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg`}>
      <div className="absolute top-5 right-5">
        <div className="text-sm bg-white/20 px-5 py-1 rounded-full font-bold text-white shadow tracking-wide">{level}</div>
      </div>
      <div className="flex flex-col items-center justify-center w-full gap-5">
        <div><span className="text-lg md:text-2xl text-white font-semibold tracking-wide">{config.label}</span></div>
        <div className="flex items-center gap-2">
          {config.icon}
          <div className="flex flex-col items-start">
            {/* Número principal usando Contador */}
            <span className="flex items-end gap-2">
              <Contador valor={incidentes ?? value}  className="text-5xl md:text-6xl" />
            </span>
          </div>
        </div>
        <div className="w-full mt-4 flex flex-col items-center">
          <div className="w-full h-4 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-4 rounded-full ${config.bar} transition-all`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
