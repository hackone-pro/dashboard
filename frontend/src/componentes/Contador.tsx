import CountUp from "react-countup"

type ContadorProps = {
  valor: number | string // 👈 aceita número ou string
  duration?: number
  color?: string
  className?: string
  suffix?: string
  decimals?: number
}

export default function Contador({
  valor,
  duration = 1.5,
  color,
  className = "text-3xl font-bold",
  suffix = "",
  decimals = 0,
}: ContadorProps) {
  // 🔹 Converte "1,25" → 1.25
  const parsedValue =
    typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : valor

  // 🔹 Detecta se o valor original tinha vírgula
  const usaVirgula = typeof valor === "string" && valor.includes(",")

  return (
    <span className={`flex items-baseline ${className} ${color ?? "text-white"}`}>
      <CountUp
        end={parsedValue}
        duration={duration}
        separator="."
        decimals={decimals}
        decimal={usaVirgula ? "," : "."} // 👈 adapta automaticamente
      />
      {suffix && <span className="ml-1">{suffix}</span>}
    </span>
  )
}
