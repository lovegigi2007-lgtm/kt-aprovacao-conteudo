"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarChecklist } from "@/app/actions/checklist";

interface ChecklistItem {
  id: string;
  texto: string;
}

export function Checklist({
  contentId,
  itens,
  respostas,
  somenteLeitura,
}: {
  contentId: string;
  itens: ChecklistItem[];
  respostas: Map<string, boolean>;
  somenteLeitura?: boolean;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  if (itens.length === 0) return null;

  return (
    <div className="rounded-lg border border-black/5 bg-cartao p-3 flex flex-col gap-2 mb-4">
      <p className="text-xs font-semibold text-texto/60">
        Checklist de publicação
      </p>
      {itens.map((item) => {
        const marcado = respostas.get(item.id) ?? false;
        return (
          <label
            key={item.id}
            className={`flex items-start gap-2 text-sm ${
              somenteLeitura ? "" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              checked={marcado}
              disabled={somenteLeitura}
              onChange={(e) => {
                const novoValor = e.target.checked;
                startTransition(async () => {
                  await marcarChecklist(contentId, item.id, novoValor);
                  router.refresh();
                });
              }}
              className="mt-0.5 h-4 w-4 accent-apoio flex-shrink-0"
            />
            <span className={marcado ? "text-texto" : "text-texto/60"}>
              {item.texto}
            </span>
          </label>
        );
      })}
    </div>
  );
}
