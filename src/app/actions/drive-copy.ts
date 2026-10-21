"use server";

// Precisa de mais tempo que o padrão porque vídeo grande demora pra
// transferir do R2 pro Drive.
export const maxDuration = 60;

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { enviarArquivoParaPastaDoConteudo } from "@/lib/google-drive";

// Copia um arquivo que já está no R2 (de um asset) pra dentro da pasta do
// Drive do conteúdo. Roda depois do upload normal pro R2 — se o Drive não
// estiver conectado ou der erro, não trava nada, só não copia.
export async function copiarAssetParaDrive(
  projectId: string,
  contentId: string,
  caminhoStorage: string,
  mimeType: string,
  eCapa: boolean
) {
  try {
    const supabase = await createClient();
    const { data: conteudo } = await supabase
      .from("contents")
      .select("drive_folder_url")
      .eq("id", contentId)
      .maybeSingle();

    if (!conteudo?.drive_folder_url) return;

    const objeto = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: caminhoStorage })
    );
    if (!objeto.Body) return;

    const nomeArquivo = caminhoStorage.split("/").pop() ?? "arquivo";

    await enviarArquivoParaPastaDoConteudo(
      projectId,
      conteudo.drive_folder_url,
      eCapa ? "Capa" : "Editado final",
      nomeArquivo,
      mimeType,
      objeto.Body
    );
  } catch (e) {
    console.error("Erro ao copiar arquivo pro Drive:", e);
    // não propaga o erro — o upload pro R2 já deu certo, isso é só um extra
  }
}
