"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { revalidatePath } from "next/cache";

export async function marcarChecklist(
  contentId: string,
  checklistItemId: string,
  marcado: boolean
) {
  const { papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para editar o checklist.");
  }
  const supabase = await createClient();

  await supabase.from("checklist_responses").upsert(
    {
      content_id: contentId,
      checklist_item_id: checklistItemId,
      marcado,
    },
    { onConflict: "content_id,checklist_item_id" }
  );

  revalidatePath(`/conteudo/${contentId}`);
}
