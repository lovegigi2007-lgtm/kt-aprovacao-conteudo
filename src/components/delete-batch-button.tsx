"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirLeva } from "@/app/actions/batches";

export function DeleteBatchButton({
  batchId,
  nome,
}: {
  batchId: string;
  nome: string;
}) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    const confirmou = window.confirm(
      `Apagar a leva "${nome}" e TODOS os criativos dela? Isso não tem volta.`
    );
    if (!confirmou) return;
    const formData = new FormData();
    formData.set("batchId", batchId);
    startTransition(async () => {
      await excluirLeva(formData);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pendente}
      className="text-[11px] text-branco/70 hover:text-branco underline disabled:opacity-60"
    >
      {pendente ? "apagando..." : "apagar leva"}
    </button>
  );
}
