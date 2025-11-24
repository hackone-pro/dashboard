import React from "react";

export type TooltipRightProps = {
    text: string;
    children: React.ReactNode;
    status: string;
};

// Mapeia ícone e borda pelo status
function getTooltipStyle(status: string) {
    if (status === "🟢") {
        return {
            icon: "/assets/img/indicador-on.png",
            border: "border-green-500/40",
            shadow: "shadow-green-500/30"
        };
    }
    if (status === "🟡") {
        return {
            icon: "/assets/img/indicador-warning.png",
            border: "border-yellow-400/40",
            shadow: "shadow-yellow-400/30"
        };
    }
    return {
        icon: "/assets/img/indicador-off.png",
        border: "border-red-500/40",
        shadow: "shadow-red-500/30"
    };
}

export default function TooltipRight({ text, children, status }: TooltipRightProps) {

    const { icon, border, shadow } = getTooltipStyle(status);

    return (
        <div className="relative group inline-flex items-center cursor-pointer">
            {/* Elemento alvo */}
            {children}

            {/* Tooltip */}
            <div
                className={`
                    hidden group-hover:flex absolute
                    right-[-230px] top-1/2 -translate-y-1/2
                    bg-[#16112527] backdrop-blur-md
                    px-4 py-3 rounded-xl text-white text-xs w-[220px]
                    items-start gap-3 border ${border}
                    transition-all duration-150 z-50
                `}
            >
                <img src={icon} className="w-6 h-3 mt-[1px]" />

                <span
                    className="leading-tight text-left"
                    dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, "<br/>") }}
                />
            </div>
        </div>
    );
}
