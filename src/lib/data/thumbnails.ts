import { SupabaseClient } from "@supabase/supabase-js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { extensaoParaMime } from "@/lib/mime";

export async function getMiniaturasPorConteudo(
  supabase: SupabaseClient,
  contentIds: string[]
): Promise<Map<string, string>> {
  const miniaturaPorConteudo = new Map<string, string>();
  if (contentIds.length === 0) return miniaturaPorConteudo;

  const { data: capas } = await supabase
    .from("assets")
    .select("content_id, caminho_storage, e_capa, ordem, tipo")
    .in("content_id", contentIds)
    .eq("versao_atual", true)
    .eq("tipo", "imagem")
    .order("ordem", { ascending: true });

  const capaEscolhidaPorConteudo = new Map<string, string>();
  for (const asset of capas ?? []) {
    const atual = capaEscolhidaPorConteudo.get(asset.content_id);
    if (!atual || asset.e_capa) {
      capaEscolhidaPorConteudo.set(asset.content_id, asset.caminho_storage);
    }
  }

  await Promise.all(
    Array.from(capaEscolhidaPorConteudo.entries()).map(
      async ([contentId, caminho]) => {
        try {
          const extensao = caminho.split(".").pop()?.toLowerCase() ?? "";
          const url = await getSignedUrl(
            r2,
            new GetObjectCommand({
              Bucket: R2_BUCKET,
              Key: caminho,
              ResponseContentType: extensaoParaMime[extensao],
            }),
            { expiresIn: 60 * 60 }
          );
          miniaturaPorConteudo.set(contentId, url);
        } catch {
          // arquivo ainda não migrado ou indisponível, ignora
        }
      }
    )
  );

  return miniaturaPorConteudo;
}
