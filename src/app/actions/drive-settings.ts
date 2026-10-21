"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { extrairIdDaPastaDoLink } from "@/lib/google-drive";
import { revalidatePath } from "next/cache";

export async function definirPastaRaizDrive(formData: FormData) {
  const { papel, project } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador") {
    throw new Error("Só o administrador pode configurar a pasta do Drive.");
  }

  const link = String(formData.get("link") ?? "").trim();
  const id = extrairIdDaPastaDoLink(link);
  if (!id) {
    throw new Error("Não consegui reconhecer esse link de pasta do Google Drive.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("google_drive_connections")
    .update({ pasta_raiz_id: id })
    .eq("project_id", project.id);

  if (error) {
    throw new Error(
      "Conecte o Google Drive primeiro (botão acima) antes de definir a pasta."
    );
  }

  revalidatePath("/configuracoes");
}
