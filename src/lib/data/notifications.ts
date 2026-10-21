import { createClient } from "@/lib/supabase/server";

// Não é uma Server Action (não é chamada direto da tela) — é um helper
// usado de dentro de outras actions (aprovações, comentários etc.) para
// criar notificações no sininho.
export async function criarNotificacao(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  tipo: string,
  link: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    tipo,
    link,
  });
}

export async function getNotificacoesNaoLidasCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("lida", false);

  return count ?? 0;
}
