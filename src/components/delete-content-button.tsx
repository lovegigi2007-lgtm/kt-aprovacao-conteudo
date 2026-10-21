"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirConteudo } from "@/app/actions/contents";

export function DeleteContentButton({
  contentId,
  titulo,
  redirecionarPara,
  tamanho = "normal",
}: {
  contentId: string;
  titulo: string;
  redirecionarPara?: string;
  tamanho?: "normal" | "pequeno";
}) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const confirmou = window.confirm(
      `Apagar "${titulo}"? Isso remove o conteúdo e os arquivos dele, sem volta.`
    );
    if (!confirmou) return;
    startTransition(async () => {
      await excluirConteudo(contentId);
      if (redirecionarPara) {
        router.push(redirecionarPara);
      } else {
        router.refresh();
      }
    });
  }

  if (tamanho === "pequeno") {
    return (
      <button
        onClick={handleClick}
        disabled={pendente}
        aria-label="Apagar"
        className="h-6 w-6 rounded-full bg-black/60 text-branco text-xs flex items-center justify-center hover:bg-[var(--status-reprovado)] disabled:opacity-60"
      >
        {pendente ? "…" : "✕"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pendente}
      className="text-xs font-semibold text-texto/40 hover:text-[var(--status-reprovado)] disabled:opacity-60"
    >
      {pendente ? "apagando..." : "apagar conteúdo"}
    </button>
  );
}
