"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { labelParaRede, labelParaFormato, labelParaTipo } from "@/lib/labels";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function apagarArquivosDoConteudo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  contentId: string
) {
  const { data: assets } = await supabase
    .from("assets")
    .select("caminho_storage")
    .eq("content_id", contentId);

  for (const a of assets ?? []) {
    try {
      await r2.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: a.caminho_storage })
      );
    } catch {
      // se já não existir no armazenamento, ignora e segue
    }
  }
}

export async function excluirConteudo(contentId: string) {
  const { papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador") {
    throw new Error("Só o administrador pode apagar conteúdos.");
  }
  const supabase = await createClient();

  await apagarArquivosDoConteudo(supabase, contentId);
  await supabase.from("contents").delete().eq("id", contentId);

  revalidatePath("/");
  revalidatePath("/mensal");
  revalidatePath("/criativos");
  revalidatePath("/feed");
  revalidatePath("/aprovacao");
  revalidatePath("/ideias");
}

export async function criarConteudo(formData: FormData) {
  const { user, project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const data = String(formData.get("data") ?? "");
  const hora = String(formData.get("hora") ?? "09:00");
  const redeLabel = String(formData.get("rede") ?? "Instagram");
  const formatoLabel = String(formData.get("formato") ?? "Estático");
  const tipoLabel = String(formData.get("tipo") ?? "Conteúdo");
  const objetivo = String(formData.get("objetivo") ?? "").trim() || null;
  const legenda = String(formData.get("legenda") ?? "").trim() || null;
  const cta = String(formData.get("cta") ?? "").trim() || null;
  const copyLink = String(formData.get("copyLink") ?? "").trim() || null;
  const ideaId = String(formData.get("ideaId") ?? "").trim() || null;

  if (!titulo || !data) {
    throw new Error("Título e data são obrigatórios.");
  }

  const { data: novo, error } = await supabase
    .from("contents")
    .insert({
      project_id: project.id,
      titulo,
      data_hora: new Date(`${data}T${hora}:00`).toISOString(),
      rede: labelParaRede[redeLabel] ?? "instagram",
      formato: labelParaFormato[formatoLabel] ?? "estatico",
      tipo: labelParaTipo[tipoLabel] ?? "conteudo",
      objetivo,
      legenda,
      cta,
      copy_link: copyLink,
      responsavel_id: user.id,
      status: "rascunho",
      idea_id: ideaId,
    })
    .select("id")
    .single();

  if (error || !novo) {
    throw new Error("Não foi possível salvar o conteúdo: " + error?.message);
  }

  await supabase.from("activity_log").insert({
    content_id: novo.id,
    autor_id: user.id,
    tipo_evento: "criado",
  });

  if (ideaId) {
    await supabase
      .from("ideas")
      .update({ convertida_em_conteudo_id: novo.id })
      .eq("id", ideaId);
  }

  revalidatePath("/");
  revalidatePath("/ideias");
  redirect(`/conteudo/${novo.id}`);
}

export async function editarConteudo(formData: FormData) {
  const contentId = String(formData.get("contentId"));
  const { user, papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para editar este conteúdo.");
  }
  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("contents")
    .select("*")
    .eq("id", contentId)
    .maybeSingle();
  if (!atual) throw new Error("Conteúdo não encontrado.");

  const titulo = String(formData.get("titulo") ?? "").trim();
  const data = String(formData.get("data") ?? "");
  const hora = String(formData.get("hora") ?? "09:00");
  const redeLabel = String(formData.get("rede") ?? "Instagram");
  const formatoLabel = String(formData.get("formato") ?? "Estático");
  const tipoLabel = String(formData.get("tipo") ?? "Conteúdo");
  const objetivo = String(formData.get("objetivo") ?? "").trim() || null;
  const legenda = String(formData.get("legenda") ?? "").trim() || null;
  const cta = String(formData.get("cta") ?? "").trim() || null;
  const copyLink = String(formData.get("copyLink") ?? "").trim() || null;

  if (!titulo || !data) {
    throw new Error("Título e data são obrigatórios.");
  }

  const novaDataHora = new Date(`${data}T${hora}:00`).toISOString();
  const novaRede = labelParaRede[redeLabel] ?? "instagram";
  const novoFormato = labelParaFormato[formatoLabel] ?? "estatico";
  const novoTipo = labelParaTipo[tipoLabel] ?? "conteudo";

  const apenasDataMudou =
    atual.titulo === titulo &&
    atual.objetivo === objetivo &&
    atual.legenda === legenda &&
    atual.cta === cta &&
    atual.copy_link === copyLink &&
    atual.rede === novaRede &&
    atual.formato === novoFormato &&
    atual.tipo === novoTipo;

  const derrubaAprovacao = atual.status === "aprovado" && !apenasDataMudou;
  const novoStatus = derrubaAprovacao ? "em_aprovacao" : atual.status;

  const { error } = await supabase
    .from("contents")
    .update({
      titulo,
      data_hora: novaDataHora,
      rede: novaRede,
      formato: novoFormato,
      tipo: novoTipo,
      objetivo,
      legenda,
      cta,
      copy_link: copyLink,
      status: novoStatus,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", contentId);

  if (error) throw new Error("Não foi possível salvar: " + error.message);

  await supabase.from("activity_log").insert({
    content_id: contentId,
    autor_id: user.id,
    tipo_evento: derrubaAprovacao ? "editado_derrubou_aprovacao" : "editado",
  });

  revalidatePath(`/conteudo/${contentId}`);
  revalidatePath("/");
  redirect(`/conteudo/${contentId}`);
}

export async function marcarComoPublicado(formData: FormData) {
  const contentId = String(formData.get("contentId"));
  const link = String(formData.get("linkPublicado") ?? "").trim() || null;

  const { user, papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para marcar este conteúdo como publicado.");
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("contents")
    .update({
      status: "publicado",
      link_publicado: link,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", contentId);
  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    content_id: contentId,
    autor_id: user.id,
    tipo_evento: "publicado",
  });

  revalidatePath(`/conteudo/${contentId}`);
  revalidatePath("/");
  revalidatePath("/mensal");
}
