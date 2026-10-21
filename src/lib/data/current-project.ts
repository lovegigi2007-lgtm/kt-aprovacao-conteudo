import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getUsuarioEProjetoAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Por enquanto pega o primeiro projeto do usuário (seletor de projeto vem depois).
  const { data: membro } = await supabase
    .from("project_members")
    .select(
      "papel, projects(id, nome, slug, tema, redes_ativas, regra_aprovacao, metas_frequencia)"
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro || !membro.projects) {
    throw new Error(
      "Seu usuário ainda não foi adicionado a nenhum projeto. Peça para um administrador te convidar."
    );
  }

  return {
    user,
    papel: membro.papel as "administrador" | "editor" | "aprovador" | "leitor",
    // @ts-expect-error - join do Supabase retorna objeto único por causa do .maybeSingle()
    project: membro.projects as {
      id: string;
      nome: string;
      slug: string;
      tema: Record<string, string>;
      redes_ativas: string[];
      regra_aprovacao: string;
      metas_frequencia: Record<string, unknown>;
    },
  };
}
