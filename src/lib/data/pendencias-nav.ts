import { createClient } from "@/lib/supabase/server";

// Não é Server Action — é chamada do layout, que também envolve a tela de
// login (sem usuário ainda). Não lança erro, só devolve zero.
export async function getPendenciasPorAba() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { conteudo: 0, criativos: 0 };

  const { data: membro } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro) return { conteudo: 0, criativos: 0 };

  const [{ count: conteudo }, { count: criativos }] = await Promise.all([
    supabase
      .from("contents")
      .select("id", { count: "exact", head: true })
      .eq("project_id", membro.project_id)
      .neq("tipo", "criativo")
      .in("status", ["em_aprovacao", "reprovado"]),
    supabase
      .from("contents")
      .select("id", { count: "exact", head: true })
      .eq("project_id", membro.project_id)
      .eq("tipo", "criativo")
      .in("status", ["em_aprovacao", "reprovado"]),
  ]);

  return { conteudo: conteudo ?? 0, criativos: criativos ?? 0 };
}
