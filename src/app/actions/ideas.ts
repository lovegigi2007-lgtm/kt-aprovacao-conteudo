"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { labelParaFormato, labelParaTipo } from "@/lib/labels";
import { criarPastaDeConteudo } from "@/lib/google-drive";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function criarIdeia(formData: FormData) {
  const { user, project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim() || null;
  const copyLink = String(formData.get("copyLink") ?? "").trim() || null;
  const nota = String(formData.get("nota") ?? "").trim() || null;
  const tipoLabel = String(formData.get("tipo") ?? "Conteúdo");
  const formatoLabel = String(formData.get("formato") ?? "Estático");
  const tipo = labelParaTipo[tipoLabel] ?? "conteudo";
  const formato = labelParaFormato[formatoLabel] ?? "estatico";

  if (!titulo) throw new Error("Escreva um título para a ideia.");

  // Se for conteúdo (não criativo), já cria a pasta no Drive dentro do
  // formato certo — a leva de criativos cria a dela na hora de criar a leva.
  let driveFolderUrl: string | null = null;
  if (tipo === "conteudo") {
    try {
      driveFolderUrl = await criarPastaDeConteudo(project.id, formato, titulo);
    } catch (e) {
      console.error("Erro ao criar pasta no Drive para a ideia:", e);
      // segue sem travar a ideia mesmo se o Drive falhar
    }
  }

  const { error } = await supabase.from("ideas").insert({
    project_id: project.id,
    titulo,
    link,
    copy_link: copyLink,
    nota,
    autor_id: user.id,
    tipo,
    formato,
    drive_folder_url: driveFolderUrl,
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
