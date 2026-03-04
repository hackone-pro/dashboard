type HostCPU = {
  name: string;
  cpu: number; // percentual
};

const TOTAL_BLOCKS = 20;

export default function TopHostsCPU() {

  // ================================
  // DADOS FAKE
  // ================================
  const hosts: HostCPU[] = [
    {
      name: "SRV-APP-01",
      cpu: 82.5,
    },
    {
      name: "SRV-DB-01",
      cpu: 64.3,
    },
    {
      name: "SRV-WEB-02",
      cpu: 38.7,
    },
  ];

  return (
    <div className="h-full flex flex-col">

      {/* Título */}
      <h3 className="text-white text-md mb-1">CPU</h3>
      <p className="text-gray-400 text-sm mb-4">
        Top hosts por CPU %
      </p>

      <div className="flex flex-col gap-5">

        {hosts.map((host) => {

          const activeBlocks = Math.round(
            (host.cpu / 100) * TOTAL_BLOCKS
          );

          return (
            <div key={host.name}>

              {/* Cabeçalho */}
              <div className="flex justify-between text-sm mb-1">

                <span className="text-gray-400">
                  {host.name}
                </span>

                <span className="text-gray-400">
                  {host.cpu}%
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