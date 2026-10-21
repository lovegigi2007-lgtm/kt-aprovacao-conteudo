import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { excluirIdeia } from "@/app/actions/ideas";
import { formatoParaLabel, tipoParaLabel } from "@/lib/labels";

export default async function IdeiasPage() {
  const { papel, project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const [{ data: ideias }, { data: membros }] = await Promise.all([
    supabase
      .from("ideas")
      .select("*")
      .eq("project_id", project.id)
      .is("convertida_em_conteudo_id", null)
      .order("criado_em", { ascending: false }),
    supabase
      .from("project_members")
      .select("user_id, profiles(nome)")
      .eq("project_id", project.id),
  ]);

  const nomePorUsuario = new Map<string, string>();
  for (const m of membros ?? []) {
    // @ts-expect-error join retorna objeto único
    nomePorUsuario.set(m.user_id, m.profiles?.nome || "Alguém da equipe");
  }

  const podeEditar = papel === "administrador" || papel === "editor";

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-title font-900 text-2xl text-principal">
            Ideias
          </h1>
          <div className="fio-marca" />
          <p className="text-sm text-texto/60">
            Banco de ideias soltas e Reels pendentes de gravação, antes de
            virarem conteúdo.
          </p>
        </div>
        <Link href="/ideias/nova" className="btn-primario whitespace-nowrap">
          + Nova ideia
        </Link>
      </div>

      {(ideias ?? []).length === 0 && (
        <p className="text-sm text-texto/50 italic">
          Nenhuma ideia guardada ainda.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {(ideias ?? []).map((ideia) => (
          <div
            key={ideia.id}
            className="cartao p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-title font-800 text-sm text-texto">
                {ideia.titulo}
              </p>
              <div className="flex gap-1 flex-shrink-0">
                <span className="text-[10px] font-medium rounded-full bg-apoio/10 text-apoio px-2 py-0.5">
                  {tipoParaLabel[ideia.tipo] ?? ideia.tipo}
                </span>
                {ideia.formato && (
                  <span className="text-[10px] font-medium rounded-full bg-apoio/10 text-apoio px-2 py-0.5">
                    {formatoParaLabel[ideia.formato] ?? ideia.formato}
                  </span>
                )}
              </div>
            </div>

            {ideia.drive_folder_url && (
              <a
                href={ideia.drive_folder_url}
                target="_blank"
                className="text-xs text-apoio underline break-all"
              >
                📁 pasta no Drive
              </a>
            )}

            {ideia.link && (
              <a
                href={ideia.link}
                target="_blank"
                className="text-xs text-apoio underline break-all"
              >
                🔗 referência: {ideia.link}
              </a>
            )}

            {ideia.copy_link && (
              <a
                href={ideia.copy_link}
                target="_blank"
                className="text-xs text-apoio underline break-all"
              >
                📝 copy/roteiro: {ideia.copy_link}
              </a>
            )}

            {ideia.nota && (
              <p className="text-sm text-texto/70">{ideia.nota}</p>
            )}

            <div className="flex items-center justify-between mt-1 gap-2">
              <span className="text-[11px] text-texto/50">
                sugerido por {nomePorUsuario.get(ideia.autor_id) ?? "alguém"}
              </span>
              <div className="flex items-center gap-3">
                {podeEditar && (
                  <form action={excluirIdeia}>
                    <input type="hidden" name="ideaId" value={ideia.id} />
                    <button className="text-xs text-texto/40 hover:text-[var(--status-reprovado)]">
                      apagar
                    </button>
                  </form>
                )}
                {podeEditar && (
                  <Link
                    href={`/novo-conteudo?ideaId=${ideia.id}&titulo=${encodeURIComponent(
                      ideia.titulo
                    )}&copyLink=${encodeURIComponent(ideia.copy_link ?? "")}`}
                    className="text-xs font-semibold text-principal underline"
                  >
                    Transformar em conteúdo
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
