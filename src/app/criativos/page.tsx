import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { getMiniaturasPorConteudo } from "@/lib/data/thumbnails";
import { ContentCard } from "@/components/content-card";
import { BatchUploader } from "@/components/batch-uploader";
import { aprovarTodosPendentesDaLeva } from "@/app/actions/batches";
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

  const miniaturaPorConteudo = await getMiniaturasPorConteudo(
    supabase,
    (criativos ?? []).map((c) => c.id)
  );

  const podeEditar = papel === "administrador" || papel === "editor";
  const podeAprovar = papel === "administrador" || papel === "aprovador";

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
            className="h-9 w-9 rounded-full bg-principal/10 text-principal flex items-center justify-center font-bold"
          >
            ‹
          </Link>
          <h1 className="font-title font-900 text-2xl text-principal">
            {nomesMes[mes]} {ano}
          </h1>
          <Link
            href={`/criativos?mes=${mesSeguinte}`}
            className="h-9 w-9 rounded-full bg-principal/10 text-principal flex items-center justify-center font-bold"
          >
            ›
          </Link>
        </div>
        {podeEditar && (
          <Link
            href={`/criativos/nova-leva?mes=${mesAtual}`}
            className="rounded-full bg-principal text-branco text-sm font-semibold px-4 py-2.5 min-h-[44px] hover:bg-principal/90 flex items-center"
          >
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

          const conteudosConvertidos: Conteudo[] = itensDaLeva.map((linha) => ({
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
          }));

          return (
            <div key={leva.id} className="flex flex-col gap-2 min-w-0">
              <div className="rounded-xl bg-principal text-branco px-3 py-2.5">
                <p className="font-title font-800 text-sm">{leva.nome}</p>
                <p className="text-[11px] text-branco/80">
                  {leva.data_aprovacao
                    ? `✓ Aprovada em ${new Date(
                        leva.data_aprovacao + "T00:00:00"
                      ).toLocaleDateString("pt-BR")}`
                    : itensDaLeva.length === 0
                    ? "Sem criativos ainda"
                    : `Em aprovação · ${aprovados} de ${itensDaLeva.length} aprovados`}
                </p>
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
                {conteudosConvertidos.map((c) => (
                  <Link key={c.id} href={`/conteudo/${c.id}`}>
                    <ContentCard conteudo={c} />
                  </Link>
                ))}
              </div>

              {podeEditar && (
                <BatchUploader projectId={project.id} batchId={leva.id} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
