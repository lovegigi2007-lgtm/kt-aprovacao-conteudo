import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google-drive";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const projectId = searchParams.get("state");

  if (!code || !projectId) {
    return NextResponse.redirect(`${origin}/configuracoes?drive=erro`);
  }

  const { user } = await getUsuarioEProjetoAtual();
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    // Sem refresh_token normalmente significa que a pessoa já tinha
    // autorizado antes. Peça pra revogar o acesso em myaccount.google.com
    // e tentar de novo.
    return NextResponse.redirect(`${origin}/configuracoes?drive=sem_refresh_token`);
  }

  const supabase = await createClient();

  await supabase.from("google_drive_connections").upsert(
    {
      project_id: projectId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expira_em: new Date(tokens.expiry_date ?? Date.now() + 3600_000).toISOString(),
      conectado_por: user.id,
    },
    { onConflict: "project_id" }
  );

  return NextResponse.redirect(`${origin}/configuracoes?drive=conectado`);
}
