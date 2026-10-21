import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 fala o mesmo protocolo do Amazon S3, então usamos o SDK da AWS
// apontando para o endpoint da Cloudflare.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // O R2 não suporta o recurso de "checksum automático" que as versões
  // mais novas do SDK da AWS ativam por padrão — isso causa um CORS/erro
  // de assinatura na URL assinada. Desligando, volta a funcionar normal.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "kt-aprovacao-conteudo";
