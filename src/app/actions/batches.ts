"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { criarPastaDeLeva } from "@/lib/google-drive";
import { apagarArquivosDoConteudo } from "@/app/actions/contents";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hojeChaveBR } from "@/lib/data-br";

export async function excluirLeva(formData: FormData) {
  const batchId = String(formData.get("batchId"));
  const { papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador") {
    throw new Error("Só o administrador pode apagar levas.");
  }
  const supabase = await createClient();

  const { data: itens } = await supabase
    .from("contents")
    .select("id")
    .eq("batch_id", batchId);

  for (const item of itens ?? []) {
    await apagarArquivosDoConteudo(supabase, item.id);
  }

  const ids = (itens ?? []).map((i) => i.id);
  if (ids.length > 0) {
    await supabase.from("contents").delete().in("id", ids);
  }

  await supabase.from("batches").delete().eq("id", batchId);

  revalidatePath("/criativos");
}

export async function criarLeva(formData: FormData) {
  const { project, papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para criar levas.");
  }
  const supabase = await createClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const mesReferencia = String(formData.get("mesReferencia") ?? "");

  if (!nome || !mesReferencia) {
    throw new Error("Nome e mês de referência são obrigatórios.");
  }

  let driveFolderUrl: string | null = null;
  try {
    driveFolderUrl = await criarPastaDeLeva(project.id, nome);
  } catch {
    // segue sem travar a criação da leva se o Drive não estiver conectado
  }

  const { error } = await supabase.from("batches").insert({
    project_id: project.id,
    nome,
    mes_referencia: `${mesReferencia}-01`,
    drive_folder_url: driveFolderUrl,
  });

  if (error) throw new Error("Não foi possível criar a leva: " + error.message);

  revalidatePath("/criativos");
  redirect(`/criativos?mes=${mesReferencia}`);
}

export async function criarSubpasta(formData: FormData) {
  const batchId = String(formData.get("batchId"));
  const nome = String(formData.get("nome") ?? "").trim();
  const { papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para criar subpastas.");
  }
  if (!nome) throw new Error("Dê um nome para a subpasta.");

  const supabase = await createClient();
  await supabase.from("batch_folders").insert({ batch_id: batchId, nome });

  revalidatePath("/criativos");
}

export async function aprovarTodosPendentesDaLeva(formData: FormData) {
  const batchId = String(formData.get("batchId"));
  const { user, papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "aprovador") {
    throw new Error("Você não tem permissão para aprovar criativos.");
  }
  const supabase = await createClient();

  const { data: pendentes } = await supabase
    .from("contents")
    .select("id")
    .eq("batch_id", batchId)
    .eq("status", "em_aprovacao");

  for (const item of pendentes ?? []) {
    await supabase.from("approvals").insert({
      content_id: item.id,
      aprovador_id: user.id,
      decisao: "aprovado",
      comentario: "Aprovado em lote com os demais da leva.",
    });
    await supabase
      .from("contents")
      .update({ status: "aprovado", atualizado_em: new Date().toISOString() })
      .eq("id", item.id);
    await supabase.from("activity_log").insert({
      content_id: item.id,
      autor_id: user.id,
      tipo_evento: "aprovado",
    });
  }

  await atualizarDataAprovacaoDaLeva(supabase, batchId);

  revalidatePath("/criativos");
}

export async function atualizarDataAprovacaoDaLeva(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  batchId: string
) {
  const { data: itensDaLeva } = await supabase
    .from("contents")
    .select("status")
    .eq("batch_id", batchId);

  if (!itensDaLeva || itensDaLeva.length === 0) return;

  const todosProntos = itensDaLeva.every(
    (i: { status: string }) => i.status === "aprovado" || i.status === "publicado"
  );

  if (todosProntos) {
    await supabase
      .from("batches")
      .update({ data_aprovacao: hojeChaveBR() })
      .eq("id", batchId)
      .is("data_aprovacao", null);
  }
}
