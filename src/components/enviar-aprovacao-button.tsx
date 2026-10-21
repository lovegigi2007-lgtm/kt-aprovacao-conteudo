"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { enviarParaAprovacao } from "@/app/actions/approvals";

export function EnviarAprovacaoButton({
  contentId,
  checklistCompleto,
  temChecklist,
  texto,
}: {
  contentId: string;
  checklistCompleto: boolean;
  temChecklist: boolean;
  texto: string;
}) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (temChecklist && !checklistCompleto) {
      const confirmou = window.confirm(
        "Nem todos os itens do checklist estão marcados. Enviar mesmo assim?"
      );
      if (!confirmou) return;
    }
    startTransition(async () => {
      await enviarParaAprovacao(contentId, temChecklist && !checklistCompleto);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pendente}
      className="w-full rounded-full bg-principal text-branco font-semibold text-sm py-3 min-h-[44px] hover:bg-principal/90 disabled:opacity-60"
    >
      {pendente ? "Enviando..." : texto}
    </button>
  );
}
