// src/utils/incidentes/status.ts
import type { IconType } from "react-icons";
import { FaLockOpen, FaRegCheckCircle } from "react-icons/fa";
import { RiProgress5Line, RiQuestionLine } from "react-icons/ri";
import { IoStopCircleOutline } from "react-icons/io5";
import { MdOutlineGppBad, MdOutlineHealthAndSafety } from "react-icons/md";
import { GrTroubleshoot } from "react-icons/gr";
import { TbMessageReport } from "react-icons/tb";

export type StatusMeta = {
  label: string;
  Icon: IconType;
  color: string;
};

const STATUS_MAP: Record<string, StatusMeta> = {
  open: { label: "Aberto", Icon: FaLockOpen, color: "text-gray-500" },
  "in progress": { label: "Em progresso", Icon: RiProgress5Line, color: "text-gray-500" },
  containment: { label: "Contenção", Icon: IoStopCircleOutline, color: "text-gray-500" },
  eradication: { label: "Erradicação", Icon: MdOutlineGppBad, color: "text-gray-500" },
  recovery: { label: "Recuperação", Icon: MdOutlineHealthAndSafety, color: "text-gray-500" },
  "post-incident": { label: "Pós-incidente", Icon: GrTroubleshoot, color: "text-gray-500" },
  reporting: { label: "Reportando", Icon: TbMessageReport, color: "text-gray-500" },
  closed: { label: "Fechado", Icon: FaRegCheckCircle, color: "text-gray-500" },
  unspecified: { label: "Não especificado", Icon: RiQuestionLine, color: "text-gray-500" },
};

const DEFAULT_STATUS: StatusMeta = {
  label: "—",
  Icon: RiQuestionLine,
  color: "text-gray-400",
};

export function getStatusMeta(status?: string): StatusMeta {
  const key = (status ?? "").toLowerCase().trim();
  return STATUS_MAP[key] ?? { ...DEFAULT_STATUS, label: status || "—" };
}
