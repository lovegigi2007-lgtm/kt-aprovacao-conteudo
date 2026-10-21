import { Status } from "@/lib/types";

const estilos: Record<Status, string> = {
  Rascunho: "bg-[var(--status-rascunho-bg)] text-[var(--status-rascunho)]",
  "Em aprovação":
    "bg-[var(--status-em-aprovacao-bg)] text-[var(--status-em-aprovacao)]",
  Reprovado: "bg-[var(--status-reprovado-bg)] text-[var(--status-reprovado)]",
  Aprovado: "bg-[var(--status-aprovado-bg)] text-[var(--status-aprovado)]",
  Publicado: "bg-[var(--status-publicado-bg)] text-[var(--status-publicado)]",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${estilos[status]}`}
    >
      {status === "Publicado" && "✓ "}
      {status}
    </span>
  );
}
