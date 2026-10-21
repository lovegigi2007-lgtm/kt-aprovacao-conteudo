import { createClient } from "@/lib/supabase/server";

// Não lança erro nem redireciona — é usada no layout, que também
// envolve a tela de login (onde ainda não tem usuário logado).
export async function getFilaAprovacaoCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: membro } = await supabase
    .from("project_members")
    .select("papel, project_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro) return 0;
  if (membro.papel !== "administrador" && membro.papel !== "aprovador") return 0;

  const { count } = await supabase
    .from("contents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", membro.project_id)
    .eq("status", "em_aprovacao");

  return count ?? 0;
}
