import CountUp from "react-countup"

type ContadorProps = {
  valor: number
  duration?: number
  color?: string // 💡 cor em Tailwind ou CSS
  className?: string
}

export default function Contador({
  valor,
  duration = 1.5,
  color,
  className = "text-3xl font-bold",
}: ContadorProps) {
  return (
    <span className={`${className} ${color ?? "text-white"}`}>
      <CountUp end={valor} duration={duration} separator="." />
    </span>
  )
}