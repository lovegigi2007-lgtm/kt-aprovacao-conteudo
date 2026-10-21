"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { gerarUrlDeUpload } from "@/app/actions/storage";
import { copiarAssetParaDrive } from "@/app/actions/drive-copy";

interface BatchUploaderProps {
  projectId: string;
  batchId: string;
  batchFolderId?: string | null;
  batchDriveFolderUrl?: string | null;
  texto?: string;
}

export function BatchUploader({
  projectId,
  batchId,
  batchFolderId,
  batchDriveFolderUrl,
  texto,
}: BatchUploaderProps) {
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function enviarArquivos(arquivos: FileList) {
    setErro(null);
    setEnviando(true);
    const supabase = createClient();

    try {
      const lista = Array.from(arquivos);
      for (let i = 0; i < lista.length; i++) {
        const arquivo = lista[i];
        setProgresso(`Enviando ${i + 1} de ${lista.length}...`);

        const tipoArquivo = arquivo.type.startsWith("video") ? "video" : "imagem";
        const titulo = arquivo.name.replace(/\.[^/.]+$/, "");

        const { data: conteudo, error: erroConteudo } = await supabase
          .from("contents")
          .insert({
            project_id: projectId,
            titulo,
            data_hora: new Date().toISOString(),
            rede: "instagram",
            formato: tipoArquivo === "video" ? "reels" : "estatico",
            tipo: "criativo",
            status: "rascunho",
            batch_id: batchId,
            batch_folder_id: batchFolderId ?? null,
            drive_folder_url: batchDriveFolderUrl ?? null,
          })
          .select("id")
          .single();

        if (erroConteudo || !conteudo) throw erroConteudo;

        const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const caminho = `${projectId}/${conteudo.id}/${Date.now()}-${nomeLimpo}`;

        const urlDeUpload = await gerarUrlDeUpload(caminho);

        const respostaUpload = await fetch(urlDeUpload, {
          method: "PUT",
          body: arquivo,
        });

        if (!respostaUpload.ok) {
          throw new Error("Falha ao enviar o arquivo para o armazenamento.");
        }

        const eCapa = tipoArquivo === "imagem";
        await supabase.from("assets").insert({
          content_id: conteudo.id,
          tipo: tipoArquivo,
          caminho_storage: caminho,
          ordem: 0,
          e_capa: eCapa,
        });

        await supabase.from("activity_log").insert({
          content_id: conteudo.id,
          tipo_evento: "criado",
        });

        copiarAssetParaDrive(
          projectId,
          conteudo.id,
          caminho,
          arquivo.type || "application/octet-stream",
          eCapa
        ).catch(() => {});
      }

      router.refresh();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível enviar os arquivos. Tente de novo."
      );
    } finally {
      setEnviando(false);
      setProgresso("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime"
        className="hidden"
        id={`batch-input-${batchId}-${batchFolderId ?? "raiz"}`}
        onChange={(e) => e.target.files && enviarArquivos(e.target.files)}
      />
      <label
        htmlFor={`batch-input-${batchId}-${batchFolderId ?? "raiz"}`}
        className="cursor-pointer block text-center rounded-lg border-2 border-dashed border-apoio/30 bg-apoio/5 text-apoio text-xs font-semibold py-3 hover:bg-apoio/10"
      >
        {enviando ? progresso || "Enviando..." : texto ?? "+ Adicionar criativos (vários arquivos)"}
      </label>
      {erro && (
        <p className="text-[11px] text-[var(--status-reprovado)] mt-1">{erro}</p>
      )}
    </div>
  );
}
