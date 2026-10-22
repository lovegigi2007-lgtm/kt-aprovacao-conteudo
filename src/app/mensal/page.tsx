import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { getMiniaturasPorConteudo } from "@/lib/data/thumbnails";
import { MensalInterativo } from "@/components/mensal-interativo";

const nomesMes = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const ordemRedes = ["instagram", "linkedin", "tiktok"] as const;

function gerarGradeDoMes(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes, 1);
  // getDay(): 0=domingo..6=sábado. Queremos semana começando segunda.
  const offset = (primeiroDia.getDay() + 6) % 7;
  const inicioGrade = new Date(ano, mes, 1 - offset);

  const celulas: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicioGrade);
    d.setDate(inicioGrade.getDate() + i);
    celulas.push(d);
  }
  return celulas;
}

export default async function MensalPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; pendentes?: string }>;
}) {
  const params = await searchParams;
  const { project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const hoje = new Date();
  const [anoParam, mesParam] = (params.mes ?? "").split("-").map(Number);
  const ano = anoParam || hoje.getFullYear();
  const mes = mesParam ? mesParam - 1 : hoje.getMonth();
  const mostrarPendentes = params.pendentes === "1";

  const inicioMes = new Date(ano, mes, 1, 0, 0, 0);
  const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59);

  const statusAlvo = mostrarPendentes
    ? ["aprovado", "publicado", "em_aprovacao", "reprovado"]
    : ["aprovado", "publicado"];

  const { data: linhas } = await supabase
    .from("contents")
    .select("*")
    .eq("project_id", project.id)
    .neq("tipo", "criativo")
    .in("status", statusAlvo)
    .gte("data_hora", inicioMes.toISOString())
    .lte("data_hora", fimMes.toISOString())
    .order("data_hora", { ascending: true });

  const miniaturaPorConteudoMapa = await getMiniaturasPorConteudo(
    supabase,
    (linhas ?? []).map((l) => l.id)
  );
  const miniaturaPorConteudo = Object.fromEntries(miniaturaPorConteudoMapa);

  const mesAnterior = mes === 0 ? `${ano - 1}-12` : `${ano}-${String(mes).padStart(2, "0")}`;
  const mesSeguinte =
    mes === 11 ? `${ano + 1}-01` : `${ano}-${String(mes + 2).padStart(2, "0")}`;

  const celulas = gerarGradeDoMes(ano, mes);
  const redesParaMostrar = ordemRedes.filter((r) =>
    (project.redes_ativas ?? []).includes(r)
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 md:py-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/mensal?mes=${mesAnterior}${mostrarPendentes ? "&pendentes=1" : ""}`}
            className="h-9 w-9 rounded-full bg-principal/10 text-principal flex items-center justify-center font-bold transition-colors hover:bg-principal/20"
          >
            ‹
          </Link>
          <h1 className="font-title font-900 text-2xl text-principal">
            {nomesMes[mes]} {ano}
          </h1>
          <Link
            href={`/mensal?mes=${mesSeguinte}${mostrarPendentes ? "&pendentes=1" : ""}`}
            className="h-9 w-9 rounded-full bg-principal/10 text-principal flex items-center justify-center font-bold transition-colors hover:bg-principal/20"
          >
            ›
          </Link>
        </div>
        <Link
          href={`/mensal?mes=${ano}-${String(mes + 1).padStart(2, "0")}${
            mostrarPendentes ? "" : "&pendentes=1"
          }`}
          className={`text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${
            mostrarPendentes
              ? "bg-principal text-branco"
              : "bg-principal/10 text-principal hover:bg-principal/20"
          }`}
        >
          {mostrarPendentes ? "✓ Mostrando pendentes" : "Mostrar também pendentes"}
        </Link>
      </div>

      <div className="mt-4">
        <MensalInterativo
          redesParaMostrar={redesParaMostrar}
          linhas={linhas ?? []}
          celulas={celulas}
          ano={ano}
          mes={mes}
          miniaturaPorConteudo={miniaturaPorConteudo}
        />
      </div>
    </div>
  );
}
