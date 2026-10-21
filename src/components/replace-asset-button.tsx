"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gerarUrlDeUpload } from "@/app/actions/storage";
import { trocarAsset } from "@/app/actions/assets";

export function ReplaceAssetButton({
  projectId,
  contentId,
  assetId,
}: {
  projectId: string;
  contentId: string;
  assetId: string;
}) {
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function trocar(arquivo: File) {
    setEnviando(true);
    try {
      const tipo = arquivo.type.startsWith("video")
        ? "video"
        : arquivo.type === "application/pdf"
        ? "pdf"
        : "imagem";

      const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const caminho = `${projectId}/${contentId}/${Date.now()}-${nomeLimpo}`;

      const urlDeUpload = await gerarUrlDeUpload(caminho);
      const resposta = await fetch(urlDeUpload, { method: "PUT", body: arquivo });
      if (!resposta.ok) throw new Error("Falha ao enviar o arquivo.");

      await trocarAsset(contentId, assetId, caminho, tipo);
      router.refresh();
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,application/pdf"
        className="hidden"
        id={`replace-${assetId}`}
        onChange={(e) => e.target.files?.[0] && trocar(e.target.files[0])}
      />
      <label
        htmlFor={`replace-${assetId}`}
        className="cursor-pointer h-6 px-2 rounded-full bg-black/60 text-branco text-[10px] font-semibold flex items-center justify-center hover:bg-principal"
      >
        {enviando ? "..." : "trocar"}
      </label>
    </>
  );
}
