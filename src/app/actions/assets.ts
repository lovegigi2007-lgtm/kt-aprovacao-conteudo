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
