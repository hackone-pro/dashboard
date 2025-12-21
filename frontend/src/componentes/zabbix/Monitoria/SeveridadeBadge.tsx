type Props = {
    nivel: "critico" | "alto" | "medio" | "baixo" | "info";
};

const CORES = {
    critico: "bg-[#CB1391]/16 text-[#CB1391] border-[#CB1391]",
    alto: "bg-[#8A47CD]/20 text-[#8A47CD] border-[#8A47CD]/30",
    medio: "bg-[#5355C8]/20 text-[#5355C8] border-[#5355C8]/30",
    baixo: "bg-[#1DD69A]/20 text-[#1DD69A] border-[#1DD69A]/30",
    info: "bg-gray-600/20 text-gray-400 border-gray-500/30",
};

const LABEL = {
    critico: "Crítico",
    alto: "Alto",
    medio: "Médio",
    baixo: "Baixo",
    info: "Info",
};

export default function SeveridadeBadge({ nivel }: Props) {
    return (
        <span
            className={`
            inline-flex items-center justify-center
            px-2 py-1 text-xs
            rounded-md border
            w-[50px]
            ${CORES[nivel]}
          `}
        >
            {LABEL[nivel]}
        </span>
    );
}
