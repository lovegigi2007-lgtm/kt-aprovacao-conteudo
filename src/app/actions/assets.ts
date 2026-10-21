"use server";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { revalidatePath } from "next/cache";

export async function excluirAsset(formData: FormData) {
  const assetId = String(formData.get("assetId"));
  const contentId = String(formData.get("contentId"));

  const { papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para apagar arquivos.");
  }

  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("assets")
    .select("caminho_storage")
    .eq("id", assetId)
    .maybeSingle();

  if (asset) {
    try {
      await r2.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: asset.caminho_storage })
      );
    } catch {
      // se já não existir no armazenamento, segue e apaga do banco mesmo assim
    }
  }

  await supabase.from("assets").delete().eq("id", assetId);

  revalidatePath(`/conteudo/${contentId}`);
  revalidatePath("/");
}

// Substitui um arquivo mantendo a versão anterior guardada (não apaga, só
// marca como "não é mais a versão atual"), pra dar pra comparar v1/v2.
export async function trocarAsset(
  contentId: string,
  assetAntigoId: string,
  novoCaminho: string,
  tipo: string
) {
  const { user, papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para trocar arquivos.");
  }
  const supabase = await createClient();

  const { data: antigo } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetAntigoId)
    .maybeSingle();

  if (!antigo) throw new Error("Arquivo original não encontrado.");

  await supabase
    .from("assets")
    .update({ versao_atual: false })
    .eq("id", assetAntigoId);

  await supabase.from("assets").insert({
    content_id: contentId,
    tipo,
    caminho_storage: novoCaminho,
    ordem: antigo.ordem,
    e_capa: antigo.e_capa,
    versao: (antigo.versao ?? 1) + 1,
    versao_atual: true,
  });

  await supabase.from("activity_log").insert({
    content_id: contentId,
    autor_id: user.id,
    tipo_evento: "arquivo_substituido",
  });

  revalidatePath(`/conteudo/${contentId}`);
  revalidatePath("/");
}
