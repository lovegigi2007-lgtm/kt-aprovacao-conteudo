"use server";

import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { extensaoParaMime } from "@/lib/mime";

// Gera uma URL assinada para o NAVEGADOR enviar o arquivo direto pro R2,
// sem passar pelo nosso servidor (mais rápido para vídeos grandes).
export async function gerarUrlDeUpload(caminho: string) {
  const { papel } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador" && papel !== "editor") {
    throw new Error("Você não tem permissão para enviar arquivos.");
  }

  // Não incluímos o Content-Type na assinatura de propósito: isso evita
  // problemas de CORS/assinatura no R2 quando o cabeçalho enviado pelo
  // navegador não bate exatamente com o assinado. O tipo correto é
  // aplicado depois, na hora de exibir (ver gerarUrlDeLeitura).
  const comando = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: caminho,
  });

  return getSignedUrl(r2, comando, { expiresIn: 60 * 10 }); // 10 minutos
}

// Gera uma URL assinada para EXIBIR um arquivo privado por um tempo limitado.
export async function gerarUrlDeLeitura(caminho: string) {
  await getUsuarioEProjetoAtual(); // só exige que a pessoa esteja logada no projeto

  const extensao = caminho.split(".").pop()?.toLowerCase() ?? "";

  const comando = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: caminho,
    ResponseContentType: extensaoParaMime[extensao],
  });

  return getSignedUrl(r2, comando, { expiresIn: 60 * 60 }); // 1 hora
}
