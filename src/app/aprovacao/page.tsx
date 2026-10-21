import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { ContentCard } from "@/components/content-card";
import {
  statusParaLabel,
  redeParaLabel,
  formatoParaLabel,
  tipoParaLabel,
} from "@/lib/labels";
import { Conteudo } from "@/lib/types";

export default async function AprovacaoPage() {
  const { papel, project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  if (papel !== "administrador" && papel !== "aprovador") {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-sm text-texto/60">
          Essa área é só para quem tem papel de aprovador neste projeto.
        </p>
      </div>
    );
  }

  const { data: linhas } = await supabase
    .from("contents")
    .select("*")
    .eq("project_id", project.id)
    .eq("status", "em_aprovacao")
    .order("data_hora", { ascending: true });

  const conteudos: Conteudo[] = (linhas ?? []).map((linha) => ({
    id: linha.id,
    titulo: linha.titulo,
    dataHora: linha.data_hora,
    rede: redeParaLabel[linha.rede] as Conteudo["rede"],
    formato: formatoParaLabel[linha.formato] as Conteudo["formato"],
    tipo: tipoParaLabel[linha.tipo] as Conteudo["tipo"],
    status: statusParaLabel[linha.status] as Conteudo["status"],
    etiquetas: [],
    responsavel: "",
    corCapa: "#39812C",
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-6">
      <h1 className="font-title font-900 text-2xl text-principal mb-1">
        Aguardando sua aprovação
      </h1>
      <p className="text-sm text-texto/60 mb-5">
        {conteudos.length === 0
          ? "Nada pendente por aqui — tudo em dia."
          : `${conteudos.length} conteúdo(s) esperando sua avaliação.`}
      </p>

      <div className="flex flex-col gap-3">
        {conteudos.map((c) => (
          <Link key={c.id} href={`/conteudo/${c.id}`}>
            <ContentCard conteudo={c} />
          </Link>
        ))}
      </div>
    </div>
  );
}
