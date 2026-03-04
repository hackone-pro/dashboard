const TOTAL_BLOCKS = 20;

export default function VPN() {

  // ================================
  // DADOS FAKE
  // ================================
  const vpns = [
    {
      nome: "VPN-HQ-RJ",
      firewall: "FW-HQ-SP",
      status: "up",
    },
    {
      nome: "VPN-HQ-MG",
      firewall: "FW-HQ-SP",
      status: "up",
    },
    {
      nome: "VPN-FILIAL-SUL",
      firewall: "FW-FILIAL-RJ",
      status: "down",
    },
  ];

  return (
    <div className="h-full flex flex-col">

      {/* Título */}
      <p className="text-gray-400 text-sm mb-4">
        Status e Volume de tráfego por VPN
      </p>

      <div className="flex flex-col gap-5">

        {vpns.map((vpn) => {

          const isUp = vpn.status === "up";
          const activeBlocks = isUp ? TOTAL_BLOCKS : 0;

          return (
            <div key={`${vpn.firewall}-${vpn.nome}`}>

              {/* Cabeçalho */}
              <div className="flex justify-between items-center text-sm mb-1 mt-4">

                <div className="flex flex-col">
                  <span className="text-gray-400">{vpn.nome}</span>

                  <span className="text-[11px] text-gray-500">
                    {vpn.firewall}
                  </span>
                </div>

                <span
                  className={`text-xs font-medium px-4 py-[4px] rounded-md
                    ${
                      isUp
                        ? "bg-green-900/40 text-green-400"
                        : "bg-[#EC4899]/15 text-[#EC4899]"
                    }
                  `}
                >
                  {isUp ? "Up" : "Down"}
                </span>

              </div>

              {/* Barra segmentada */}
              <div className="flex gap-1">

                {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => (

                  <div
                    key={i}
                    className={`h-4 w-full rounded-sm
                      ${
                        i < activeBlocks
                          ? "bg-gradient-to-t from-purple-700 to-purple-500"
                          : "bg-[#2a2a2a]"
                      }
                    `}
                  />

                ))}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}