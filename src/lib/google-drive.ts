import { google, drive_v3 } from "googleapis";
import { createClient } from "@/lib/supabase/server";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Pega um cliente do Drive já autenticado para um projeto, renovando o
// token automaticamente se tiver expirado.
export async function getDriveClienteDoProjeto(projectId: string) {
  const supabase = await createClient();
  const { data: conexao } = await supabase
    .from("google_drive_connections")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (!conexao) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: conexao.access_token,
    refresh_token: conexao.refresh_token,
    expiry_date: new Date(conexao.expira_em).getTime(),
  });

  if (new Date(conexao.expira_em).getTime() < Date.now() + 2 * 60 * 1000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await supabase
      .from("google_drive_connections")
      .update({
        access_token: credentials.access_token,
        expira_em: new Date(credentials.expiry_date ?? Date.now() + 3600_000).toISOString(),
      })
      .eq("project_id", projectId);
  }

  return {
    drive: google.drive({ version: "v3", auth: oauth2Client }),
    pastaRaizId: conexao.pasta_raiz_id as string | null,
  };
}

// Acha uma subpasta pelo nome (sem diferenciar maiúscula/minúscula) dentro
// de uma pasta-mãe; se não existir, cria.
async function encontrarOuCriarPastaFilha(
  drive: drive_v3.Drive,
  pastaMaeId: string,
  nome: string
): Promise<string> {
  const lista = await drive.files.list({
    q: `'${pastaMaeId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
  });

  const existente = (lista.data.files ?? []).find(
    (f) => f.name?.toLowerCase() === nome.toLowerCase()
  );
  if (existente?.id) return existente.id;

  const nova = await drive.files.create({
    requestBody: {
      name: nome,
      mimeType: "application/vnd.google-apps.folder",
      parents: [pastaMaeId],
    },
    fields: "id",
  });

  return nova.data.id!;
}

const SUBPASTAS_PADRAO = ["Bruto", "Em aprovação", "Editado final", "Capa"];

const pastaPorFormato: Record<string, string> = {
  estatico: "Estático",
  reels: "Reels",
  carrossel: "Carrossel",
  story: "Stories",
};

// Cria a pasta de um conteúdo (ideia ou conteúdo já formalizado) dentro de
// Conteúdos/<Formato>/<nome>, já com as subpastas Bruto/Em aprovação/
// Editado final/Capa. Devolve o link da pasta principal.
export async function criarPastaDeConteudo(
  projectId: string,
  formato: string,
  nomeDaPasta: string
): Promise<string | null> {
  const cliente = await getDriveClienteDoProjeto(projectId);
  if (!cliente || !cliente.pastaRaizId) return null;
  const { drive, pastaRaizId } = cliente;

  const pastaConteudos = await encontrarOuCriarPastaFilha(drive, pastaRaizId, "Conteúdos");
  const pastaFormato = await encontrarOuCriarPastaFilha(
    drive,
    pastaConteudos,
    pastaPorFormato[formato] ?? formato
  );

  const pastaPrincipal = await drive.files.create({
    requestBody: {
      name: nomeDaPasta,
      mimeType: "application/vnd.google-apps.folder",
      parents: [pastaFormato],
    },
    fields: "id, webViewLink",
  });

  const pastaId = pastaPrincipal.data.id;
  if (!pastaId) return null;

  for (const nome of SUBPASTAS_PADRAO) {
    await drive.files.create({
      requestBody: {
        name: nome,
        mimeType: "application/vnd.google-apps.folder",
        parents: [pastaId],
      },
      fields: "id",
    });
  }

  return pastaPrincipal.data.webViewLink ?? null;
}

// Cria a pasta de uma leva de criativos dentro de Criativos/<nome da leva>.
export async function criarPastaDeLeva(
  projectId: string,
  nomeDaLeva: string
): Promise<string | null> {
  const cliente = await getDriveClienteDoProjeto(projectId);
  if (!cliente || !cliente.pastaRaizId) return null;
  const { drive, pastaRaizId } = cliente;

  const pastaCriativos = await encontrarOuCriarPastaFilha(drive, pastaRaizId, "Criativos");

  const pastaLeva = await drive.files.create({
    requestBody: {
      name: nomeDaLeva,
      mimeType: "application/vnd.google-apps.folder",
      parents: [pastaCriativos],
    },
    fields: "id, webViewLink",
  });

  return pastaLeva.data.webViewLink ?? null;
}

export function extrairIdDaPastaDoLink(link: string): string | null {
  const match = link.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
