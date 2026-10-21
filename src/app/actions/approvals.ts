"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { atualizarDataAprovacaoDaLeva } from "@/app/actions/batches";
import { criarNotificacao } from "@/lib/data/notifications";
import { revalidatePath } from "next/cache";

export async function enviarParaAprovacao(
  contentId: string,
  checklistIncompleto = false
) {
  const { user, papel, project } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para enviar este conteúdo para aprovação.");
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("contents")
    .update({ status: "em_aprovacao", atualizado_em: new Date().toISOString() })
    .eq("id", contentId);
  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    content_id: contentId,
    autor_id: user.id,
    tipo_evento: "enviado_para_aprovacao",
    detalhes: checklistIncompleto ? { checklist_incompleto: true } : {},
  });

  const { data: aprovadores } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", project.id)
    .in("papel", ["administrador", "aprovador"]);

  for (const a of aprovadores ?? []) {
    await criarNotificacao(
      supabase,
      a.user_id,
      "aguardando_aprovacao",
      `/conteudo/${contentId}`
    );
  }

  revalidatePath(`/conteudo/${contentId}`);
  revalidatePath("/");
}

export async function aprovarConteudo(formData: FormData) {
  const contentId = String(formData.get("contentId"));
  const comentario = String(formData.get("comentario") ?? "").trim() || null;

  const { user, papel, project } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "aprovador") {
    throw new Error("Você não tem permissão para aprovar este conteúdo.");
  }
  const supabase = await createClient();

  await supabase.from("approvals").insert({
    content_id: contentId,
    aprovador_id: user.id,
    decisao: "aprovado",
    comentario,
  });

  // Regra "todos_aprovadores": só aprova de vez quando todo mundo com
  // papel de aprovador já tiver aprovado a versão atual.
  let statusFinal: "aprovado" | "em_aprovacao" = "aprovado";
  if (project.regra_aprovacao === "todos_aprovadores") {
    const { data: aprovadores } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", project.id)
      .in("papel", ["aprovador", "administrador"]);

    const { data: aprovacoes } = await supabase
      .from("approvals")
      .select("aprovador_id, decisao")
      .eq("content_id", contentId)
      .order("criado_em", { ascending: false });

    const decisaoMaisRecentePorPessoa = new Map<string, string>();
    for (const a of aprovacoes ?? []) {
      if (!decisaoMaisRecentePorPessoa.has(a.aprovador_id)) {
        decisaoMaisRecentePorPessoa.set(a.aprovador_id, a.decisao);
      }
    }

    const todosAprovaram = (aprovadores ?? []).every(
      (m) => decisaoMaisRecentePorPessoa.get(m.user_id) === "aprovado"
    );
    statusFinal = todosAprovaram ? "aprovado" : "em_aprovacao";
  }

  await supabase
    .from("contents")
    .update({ status: statusFinal, atualizado_em: new Date().toISOString() })
    .eq("id", contentId);

  await supabase.from("activity_log").insert({
    content_id: contentId,
    autor_id: user.id,
    tipo_evento: statusFinal === "aprovado" ? "aprovado" : "aprovado_parcial",
  });

  if (statusFinal === "aprovado") {
    const { data: conteudoAtual } = await supabase
      .from("contents")
      .select("tipo, batch_id, responsavel_id, titulo")
      .eq("id", contentId)
      .maybeSingle();
    if (conteudoAtual?.tipo === "criativo" && conteudoAtual.batch_id) {
      await atualizarDataAprovacaoDaLeva(supabase, conteudoAtual.batch_id);
    }
    if (conteudoAtual?.responsavel_id) {
      await criarNotificacao(
        supabase,
        conteudoAtual.responsavel_id,
        "aprovado",
        `/conteudo/${contentId}`
      );
    }
  }

  revalidatePath(`/conteudo/${contentId}`);
  revalidatePath("/");
  revalidatePath("/criativos");
}

export async function reprovarConteudo(formData: FormData) {
  const contentId = String(formData.get("contentId"));
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (!comentario) {
    throw new Error("É obrigatório escrever o motivo da reprovação.");
  }

  const { user, papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "aprovador") {
    throw new Error("Você não tem permissão para reprovar este conteúdo.");
  }
  const supabase = await createClient();

  await supabase.from("approvals").insert({
    content_id: contentId,
    aprovador_id: user.id,
    decisao: "reprovado",
    comentario,
  });

  const { data: conteudoReprovado } = await supabase
    .from("contents")
    .update({ status: "reprovado", atualizado_em: new Date().toISOString() })
    .eq("id", contentId)
    .select("responsavel_id")
    .maybeSingle();

  await supabase.from("activity_log").insert({
    content_id: contentId,
    autor_id: user.id,
    tipo_evento: "reprovado",
    detalhes: { motivo: comentario },
  });

  if (conteudoReprovado?.responsavel_id) {
    await criarNotificacao(
      supabase,
      conteudoReprovado.responsavel_id,
      "reprovado",
      `/conteudo/${contentId}`
    );
  }

  revalidatePath(`/conteudo/${contentId}`);
  revalidatePath("/");
}

export async function adicionarComentario(formData: FormData) {
  const contentId = String(formData.get("contentId"));
  const texto = String(formData.get("texto") ?? "").trim();
  const slideRaw = String(formData.get("slide") ?? "").trim();

  if (!texto) return;

  const { user } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  await supabase.from("comments").insert({
    content_id: contentId,
    autor_id: user.id,
    texto,
    slide: slideRaw ? Number(slideRaw) : null,
  });

  const { data: conteudo } = await supabase
    .from("contents")
    .select("responsavel_id")
    .eq("id", contentId)
    .maybeSingle();

  if (conteudo?.responsavel_id && conteudo.responsavel_id !== user.id) {
    await criarNotificacao(
      supabase,
      conteudo.responsavel_id,
      "comentario",
      `/conteudo/${contentId}`
    );
  }

  revalidatePath(`/conteudo/${contentId}`);
}
