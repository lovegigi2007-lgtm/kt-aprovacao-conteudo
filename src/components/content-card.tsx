import { Conteudo } from "@/lib/types";
import { StatusBadge } from "./status-badge";

function formatarHora(iso: string) {
  const data = new Date(iso);
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContentCard({ conteudo }: { conteudo: Conteudo }) {
  const reprovado = conteudo.status === "Reprovado";

  return (
    <div
      className={`rounded-xl border overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
        reprovado
          ? "border-[var(--status-reprovado)] bg-[var(--status-reprovado-bg)]"
          : "border-black/5 bg-branco"
      }`}
    >
      {conteudo.miniaturaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={conteudo.miniaturaUrl}
          alt=""
          className="h-20 w-full object-cover"
        />
      ) : (
        <div
          className="h-20 w-full flex items-center justify-center"
          style={{ backgroundColor: conteudo.corCapa }}
          aria-hidden
        >
          <span className="text-branco/70 text-[10px] font-semibold uppercase tracking-wide">
            {conteudo.formato}
          </span>
        </div>
      )}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-texto/60">
            {formatarHora(conteudo.dataHora)}
          </span>
          <StatusBadge status={conteudo.status} />
        </div>
        <p className="font-title font-800 text-[13px] leading-snug text-texto">
          {conteudo.titulo}
        </p>
        <div className="flex flex-wrap gap-1">
          {[conteudo.rede, conteudo.formato, conteudo.tipo].map((e) => (
            <span
              key={e}
              className="text-[10px] font-medium rounded-full bg-apoio/10 text-apoio px-2 py-0.5"
            >
              {e}
            </span>
          ))}
        </div>
        {reprovado && conteudo.motivoReprovacao && (
          <p className="text-[11px] text-[var(--status-reprovado)] font-medium line-clamp-2">
            {conteudo.motivoReprovacao}
          </p>
        )}
      </div>
    </div>
  );
}
