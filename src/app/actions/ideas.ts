"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function criarIdeia(formData: FormData) {
  const { user, project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim() || null;
  const copyLink = String(formData.get("copyLink") ?? "").trim() || null;
  const nota = String(formData.get("nota") ?? "").trim() || null;

  if (!titulo) throw new Error("Escreva um título para a ideia.");

  const { error } = await supabase.from("ideas").insert({
    project_id: project.id,
    titulo,
    link,
    copy_link: copyLink,
    nota,
    autor_id: user.id,
  });

  if (error) throw new Error("Não foi possível salvar a ideia: " + error.message);

  revalidatePath("/ideias");
  redirect("/ideias");
}

export async function excluirIdeia(formData: FormData) {
  const ideaId = String(formData.get("ideaId"));
  const { papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para apagar ideias.");
  }
  const supabase = await createClient();
  await supabase.from("ideas").delete().eq("id", ideaId);
  revalidatePath("/ideias");
}
