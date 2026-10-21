import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { getMiniaturasPorConteudo } from "@/lib/data/thumbnails";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ pendentes?: string }>;
}) {
  const params = await searchParams;
  const mostrarPendentes = params.pendentes === "1";
  const { project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const statusAlvo = mostrarPendentes
    ? ["publicado", "aprovado", "em_aprovacao", "reprovado"]
    : ["publicado", "aprovado"];

  const { data: linhas } = await supabase
    .from("contents")
    .select("*")
    .eq("project_id", project.id)
    .eq("rede", "instagram")
    .eq("tipo", "conteudo")
    .neq("formato", "story")
    .in("status", statusAlvo)
    .order("data_hora", { ascending: false });

  const miniaturaPorConteudo = await getMiniaturasPorConteudo(
    supabase,
    (linhas ?? []).map((l) => l.id)
  );

  const totalPublicados = (linhas ?? []).filter(
    (l) => l.status === "publicado"
  ).length;

  const iconePorFormato: Record<string, string> = {
    reels: "▶",
    carrossel: "▦",
  };

  return (
    <div className="max-w-[420px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-title font-900 text-xl text-principal">Feed</h1>
        <Link
          href={`/feed${mostrarPendentes ? "" : "?pendentes=1"}`}
          className={`text-xs font-semibold rounded-full px-3 py-1.5 ${
            mostrarPendentes
              ? "bg-principal text-branco"
              : "bg-principal/10 text-principal"
          }`}
        >
          {mostrarPendentes ? "✓ Com pendentes" : "Mostrar pendentes"}
        </Link>
      </div>

      {/* Cabeçalho do perfil */}
      <div className="flex items-center gap-4 mb-3">
        <div className="h-16 w-16 rounded-full bg-principal flex items-center justify-center font-title font-900 text-branco text-lg flex-shrink-0">
          KT
        </div>
        <div className="flex gap-4 text-center text-sm">
          <div>
            <p className="font-title font-800 text-texto">
              {totalPublicados}
            </p>
            <p className="text-[11px] text-texto/60">publicações</p>
          </div>
          <div>
            <p className="font-title font-800 text-texto">—</p>
            <p className="text-[11px] text-texto/60">seguidores</p>
          </div>
          <div>
            <p className="font-title font-800 text-texto">—</p>
            <p className="text-[11px] text-texto/60">seguindo</p>
          </div>
        </div>
      </div>
      <p className="font-title font-800 text-sm text-texto mb-1">
        {project.nome}
      </p>
      {project.bio && (
        <p className="text-xs text-texto/70 mb-4">{project.bio}</p>
      )}

      {/* Grade 3:4 */}
      <div className="grid grid-cols-3 gap-0.5">
        {(linhas ?? []).map((item) => {
          const miniatura = miniaturaPorConteudo.get(item.id);
          return (
            <Link
              key={item.id}
              href={`/conteudo/${item.id}`}
              className="relative"
              style={{ aspectRatio: "3/4" }}
            >
              {miniatura ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={miniatura}
                  alt=""
                  className={`w-full h-full object-cover ${
                    item.status === "reprovado" || item.status === "em_aprovacao"
                      ? "opacity-50"
                      : ""
                  }`}
                />
              ) : (
                <div
                  className={`w-full h-full bg-apoio/10 flex items-center justify-center text-[9px] text-texto/40 px-1 text-center ${
                    item.status === "reprovado" || item.status === "em_aprovacao"
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  {item.titulo}
                </div>
              )}
              {iconePorFormato[item.formato] && (
                <span className="absolute top-1 right-1 text-branco text-xs drop-shadow">
                  {iconePorFormato[item.formato]}
                </span>
              )}
              {item.status !== "publicado" && (
                <span
                  className={`absolute bottom-1 left-1 text-branco text-[8px] font-semibold px-1.5 py-0.5 rounded ${
                    item.status === "reprovado"
                      ? "bg-[var(--status-reprovado)]"
                      : "bg-black/60"
                  }`}
                >
                  {item.status === "aprovado"
                    ? "aprovado"
                    : item.status === "reprovado"
                    ? "reprovado"
                    : "pendente"}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {(linhas ?? []).length === 0 && (
        <p className="text-sm text-texto/50 italic text-center py-8">
          Nenhum post aprovado ou publicado ainda.
        </p>
      )}
    </div>
  );
}
