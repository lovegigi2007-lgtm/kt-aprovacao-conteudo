import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { getMiniaturasPorConteudo } from "@/lib/data/thumbnails";
import { ContentCard } from "@/components/content-card";
import { BatchUploader } from "@/components/batch-uploader";
import { aprovarTodosPendentesDaLeva, criarSubpasta } from "@/app/actions/batches";
import { DeleteBatchButton } from "@/components/delete-batch-button";
import { DeleteContentButton } from "@/components/delete-content-button";
import {
  statusParaLabel,
  redeParaLabel,
  formatoParaLabel,
  tipoParaLabel,
} from "@/lib/labels";
import { Conteudo } from "@/lib/types";

const nomesMes = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function CriativosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const { papel, project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const hoje = new Date();
  const [anoParam, mesParam] = (params.mes ?? "").split("-").map(Number);
  const ano = anoParam || hoje.getFullYear();
  const mes = mesParam ? mesParam - 1 : hoje.getMonth();

  const inicioMes = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  const fimMes = new Date(ano, mes + 1, 0).toISOString().slice(0, 10);

  const { data: levas } = await supabase
    .from("batches")
    .select("*")
    .eq("project_id", project.id)
    .gte("mes_referencia", inicioMes)
    .lte("mes_referencia", fimMes)
    .order("criado_em", { ascending: true });

  const idsLevas = (levas ?? []).map((l) => l.id);

  const { data: criativos } = idsLevas.length
    ? await supabase
        .from("contents")
        .select("*")
        .in("batch_id", idsLevas)
        .order("criado_em", { ascending: true })
    : { data: [] as never[] };

  const { data: subpastas } = idsLevas.length
    ? await supabase
        .from("batch_folders")
        .select("*")
        .in("batch_id", idsLevas)
        .is("pasta_mae_id", null)
        .order("ordem", { ascending: true })
    : { data: [] as never[] };

  const miniaturaPorConteudo = await getMiniaturasPorConteudo(
    supabase,
    (criativos ?? []).map((c) => c.id)
  );

  const podeEditar = papel === "administrador" || papel === "editor";
  const podeAprovar = papel === "administrador" || papel === "aprovador";
  const podeApagar = papel === "administrador";

  const mesAnterior = mes === 0 ? `${ano - 1}-12` : `${ano}-${String(mes).padStart(2, "0")}`;
  const mesSeguinte =
    mes === 11 ? `${ano + 1}-01` : `${ano}-${String(mes + 2).padStart(2, "0")}`;
  const mesAtual = `${ano}-${String(mes + 1).padStart(2, "0")}`;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 md:py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/criativos?mes=${mesAnterior}`}
            className="h-9 w-9 rounded-full bg-principal/10 text-principal flex items-center justify-center font-bold transition-colors hover:bg-principal/20"
          >
            ‹
          </Link>
          <h1 className="font-title font-900 text-2xl text-principal">
            {nomesMes[mes]} {ano}
          </h1>
          <Link
            href={`/criativos?mes=${mesSeguinte}`}
            className="h-9 w-9 rounded-full bg-principal/10 text-principal flex items-center justify-center font-bold transition-colors hover:bg-principal/20"
          >
            ›
          </Link>
        </div>
        {podeEditar && (
          <Link href={`/criativos/nova-leva?mes=${mesAtual}`} className="btn-primario">
            + Nova leva
          </Link>
        )}
      </div>

      {(levas ?? []).length === 0 && (
        <p className="text-sm text-texto/50 italic">
          Nenhuma leva criada para este mês ainda.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(levas ?? []).map((leva) => {
          const itensDaLeva = (criativos ?? []).filter(
            (c) => c.batch_id === leva.id
          );
          const pendentes = itensDaLeva.filter(
            (c) => c.status === "em_aprovacao"
          ).length;
          const aprovados = itensDaLeva.filter(
            (c) => c.status === "aprovado" || c.status === "publicado"
          ).length;

          const converter = (linha: (typeof itensDaLeva)[number]): Conteudo => ({
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
            miniaturaUrl: miniaturaPorConteudo.get(linha.id) ?? null,
          });

          const subpastasDaLeva = (subpastas ?? []).filter(
            (p) => p.batch_id === leva.id
          );
          const semSubpasta = itensDaLeva.filter((c) => !c.batch_folder_id);

          return (
            <div key={leva.id} className="flex flex-col gap-2 min-w-0">
              <div className="rounded-xl bg-principal text-branco px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-title font-800 text-sm">{leva.nome}</p>
                  {podeApagar && (
                    <DeleteBatchButton batchId={leva.id} nome={leva.nome} />
                  )}
                </div>
                <p className="text-[11px] text-branco/80">
                  {leva.data_aprovacao
                    ? `✓ Aprovada em ${new Date(
                        leva.data_aprovacao + "T00:00:00"
                      ).toLocaleDateString("pt-BR")}`
                    : itensDaLeva.length === 0
                    ? "Sem criativos ainda"
                    : `Em aprovação · ${aprovados} de ${itensDaLeva.length} aprovados`}
                </p>
                {leva.drive_folder_url && (
                  <a
                    href={leva.drive_folder_url}
                    target="_blank"
                    className="text-[11px] text-destaque underline"
                  >
                    📁 pasta no Drive
                  </a>
                )}
              </div>

              {podeAprovar && pendentes > 1 && (
                <form action={aprovarTodosPendentesDaLeva}>
                  <input type="hidden" name="batchId" value={leva.id} />
                  <button className="w-full text-xs font-semibold rounded-full bg-[var(--status-aprovado)] text-branco py-2">
                    ✅ Aprovar todos pendentes ({pendentes})
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-2">
                {semSubpasta.map((c) => (
                  <div key={c.id} className="relative">
                    <Link href={`/conteudo/${c.id}`}>
                      <ContentCard conteudo={converter(c)} />
                    </Link>
                    {podeApagar && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <DeleteContentButton
                          contentId={c.id}
                          titulo={c.titulo}
                          tamanho="pequeno"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {podeEditar && (
                <BatchUploader projectId={project.id} batchId={leva.id} />
              )}

              {subpastasDaLeva.map((pasta) => {
                const itensDaPasta = itensDaLeva.filter(
                  (c) => c.batch_folder_id === pasta.id
                );
                return (
                  <div
                    key={pasta.id}
                    className="rounded-lg border border-black/10 p-2 mt-1 flex flex-col gap-2"
                  >
                    <p className="text-xs font-semibold text-texto/70">
                      📁 {pasta.nome}
                    </p>
                    {itensDaPasta.map((c) => (
                      <div key={c.id} className="relative">
                        <Link href={`/conteudo/${c.id}`}>
                          <ContentCard conteudo={converter(c)} />
                        </Link>
                        {podeApagar && (
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <DeleteContentButton
                              contentId={c.id}
                              titulo={c.titulo}
                              tamanho="pequeno"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {podeEditar && (
                      <BatchUploader
                        projectId={project.id}
                        batchId={leva.id}
                        batchFolderId={pasta.id}
                        texto={`+ Adicionar em "${pasta.nome}"`}
                      />
                    )}
                  </div>
                );
              })}

              {podeEditar && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs font-semibold text-apoio">
                    + Nova subpasta
                  </summary>
                  <form action={criarSubpasta} className="flex gap-2 mt-2">
                    <input type="hidden" name="batchId" value={leva.id} />
                    <input
                      name="nome"
                      required
                      placeholder="Ex.: Vídeos"
                      className="campo-input flex-1 text-xs"
                    />
                    <button className="text-xs font-semibold rounded-full bg-principal/10 text-principal px-3">
                      Criar
                    </button>
                  </form>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
