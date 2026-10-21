"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { gerarUrlDeUpload } from "@/app/actions/storage";

interface AssetUploaderProps {
  projectId: string;
  contentId: string;
  proximaOrdem: number;
}

export function AssetUploader({
  projectId,
  contentId,
  proximaOrdem,
}: AssetUploaderProps) {
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
      let ordem = proximaOrdem;
      const lista = Array.from(arquivos);
      for (let i = 0; i < lista.length; i++) {
        const arquivo = lista[i];
        setProgresso(`Enviando ${i + 1} de ${lista.length}...`);

        const tipo = arquivo.type.startsWith("video")
          ? "video"
          : arquivo.type === "application/pdf"
          ? "pdf"
          : "imagem";

        const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const caminho = `${projectId}/${contentId}/${Date.now()}-${nomeLimpo}`;

        const urlDeUpload = await gerarUrlDeUpload(caminho);

        const respostaUpload = await fetch(urlDeUpload, {
          method: "PUT",
          body: arquivo,
        });

        if (!respostaUpload.ok) {
          throw new Error("Falha ao enviar o arquivo para o armazenamento.");
        }

        const { error: erroInsert } = await supabase.from("assets").insert({
          content_id: contentId,
          tipo,
          caminho_storage: caminho,
          ordem,
          e_capa: ordem === 0 && tipo === "imagem",
        });

        if (erroInsert) throw erroInsert;
        ordem++;
      }

      router.refresh();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível enviar o arquivo. Tente de novo."
      );
    } finally {
      setEnviando(false);
      setProgresso("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-apoio/30 bg-apoio/5 p-4 text-center">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,application/pdf"
        className="hidden"
        id="asset-input"
        onChange={(e) => e.target.files && enviarArquivos(e.target.files)}
      />
      <label
        htmlFor="asset-input"
        className="cursor-pointer text-sm font-semibold text-apoio"
      >
        {enviando ? progresso || "Enviando..." : "Clique para enviar fotos ou vídeos"}
      </label>
      <p className="text-[11px] text-texto/50 mt-1">
        JPG, PNG, WEBP, HEIC, MP4, MOV ou PDF
      </p>
      {erro && (
        <p className="text-xs text-[var(--status-reprovado)] mt-2">{erro}</p>
      )}
    </div>
  );
}
