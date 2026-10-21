import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google-drive";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

export async function GET() {
  const { papel, project } = await getUsuarioEProjetoAtual();
  if (papel !== "administrador") {
    return NextResponse.json(
      { erro: "Só o administrador do projeto pode conectar o Google Drive." },
      { status: 403 }
    );
  }

  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: project.id,
  });

  return NextResponse.redirect(url);
}
