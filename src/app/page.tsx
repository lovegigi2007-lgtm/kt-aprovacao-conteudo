import Link from "next/link";
import { ContentCard } from "@/components/content-card";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import {
  statusParaLabel,
  redeParaLabel,
  formatoParaLabel,
  tipoParaLabel,
} from "@/lib/labels";
import { Conteudo } from "@/lib/types";
import { getMiniaturasPorConteudo } from "@/lib/data/thumbnails";

function proximosDias(qtd: number) {
  const dias = [];
  const hoje = new Date();
  for (let i = 1; i <= qtd; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    dias.push(d);
  }
  return dias;
}

function chaveDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

const corPorFormato: Record<string, string> = {
  estatico: "#0B3D23",
  reels: "#39812C",
  carrossel: "#97CC0E",
  story: "#A8742A",
};

export default async function SemanalPage() {
  const { project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const dias = proximosDias(7);
  const inicio = new Date(dias[0]);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(dias[6]);
  fim.setHours(23, 59, 59, 999);

  const { data: linhas, error } = await supabase
    .from("contents")
    .select("*")
    .eq("project_id", project.id)
    .neq("tipo", "criativo")
    .gte("data_hora", inicio.toISOString())
    .lte("data_hora", fim.toISOString())
    .order("data_hora", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os conteúdos: " + error.message);
  }

  const idsConteudos = (linhas ?? []).map((l) => l.id);
  const miniaturaPorConteudo = await getMiniaturasPorConteudo(
    supabase,
    idsConteudos
  );

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
    corCapa: corPorFormato[linha.formato] ?? "#39812C",
    miniaturaUrl: miniaturaPorConteudo.get(linha.id) ?? null,
  }));

  const porDia = new Map(dias.map((d) => [chaveDia(d), [] as Conteudo[]]));
  for (const c of conteudos) {
    const chave = c.dataHora.slice(0, 10);
    porDia.get(chave)?.push(c);
  }

  const totalFeed = conteudos.filter(
    (c) => c.formato !== "Story" && c.rede === "Instagram"
  ).length;
  const totalStories = conteudos.filter(
    (c) => c.formato === "Story" && c.rede === "Instagram"
  ).length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metasInstagram = (project.metas_frequencia as any)?.instagram ?? {};
  const metaFeed = metasInstagram.feed_por_semana ?? 0;
  const metaStories = (metasInstagram.stories_por_dia ?? 0) * 7;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-title font-900 text-2xl text-principal">
            Semanal
          </h1>
          <p className="text-sm text-texto/60">
            {dias[0].toLocaleDateString("pt-BR")} a{" "}
            {dias[6].toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Link
          href="/novo-conteudo"
          className="rounded-full bg-principal text-branco text-sm font-semibold px-4 py-2.5 min-h-[44px] hover:bg-principal/90 flex items-center"
        >
          + Novo conteúdo
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
        <span className="rounded-full bg-apoio/10 text-apoio font-semibold px-3 py-1.5">
          Feed: {totalFeed} de {metaFeed}
        </span>
        <span className="rounded-full bg-apoio/10 text-apoio font-semibold px-3 py-1.5">
          Stories: {totalStories} de {metaStories}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {dias.map((dia) => {
          const chave = chaveDia(dia);
          const conteudosDoDia = porDia.get(chave) ?? [];
          return (
            <div key={chave} className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-title font-800 text-xs uppercase tracking-wide text-texto/70">
                    {dia.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </p>
                  <p className="font-title font-800 text-sm text-principal">
                    {dia.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </p>
                </div>
                <Link
                  href={`/novo-conteudo?data=${chave}`}
                  aria-label="Novo conteúdo neste dia"
                  className="h-7 w-7 rounded-full bg-principal/10 text-principal text-sm font-bold hover:bg-principal/20 flex items-center justify-center"
                >
                  +
                </Link>
              </div>
              <div className="flex flex-col gap-2 min-h-[80px]">
                {conteudosDoDia.length === 0 && (
                  <p className="text-[11px] text-texto/40 italic py-2">
                    dia vazio
                  </p>
                )}
                {conteudosDoDia.map((c) => (
                  <Link key={c.id} href={`/conteudo/${c.id}`}>
                    <ContentCard conteudo={c} />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
