import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { getMiniaturasPorConteudo } from "@/lib/data/thumbnails";
import { redeParaLabel, formatoParaLabel } from "@/lib/labels";

const nomesMes = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
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

function chaveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
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

  const miniaturaPorConteudo = await getMiniaturasPorConteudo(
    supabase,
    (linhas ?? []).map((l) => l.id)
  );

  const mesAnterior = mes === 0 ? `${ano - 1}-12` : `${ano}-${String(mes).padStart(2, "0")}`;
  const mesSeguinte =
    mes === 11 ? `${ano + 1}-01` : `${ano}-${String(mes + 2).padStart(2, "0")}`;

  const celulas = gerarGradeDoMes(ano, mes);
  const redesParaMostrar = ordemRedes.filter((r) =>
    (project.redes_ativas ?? []).includes(r)
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-4 md:py-6">
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

      <div className="flex flex-col gap-10 mt-4">
        {redesParaMostrar.map((rede) => (
          <CalendarioDaRede
            key={rede}
            rede={rede}
            ano={ano}
            mes={mes}
            celulas={celulas}
            conteudos={(linhas ?? []).filter((l) => l.rede === rede)}
            miniaturaPorConteudo={miniaturaPorConteudo}
          />
        ))}
        {redesParaMostrar.length === 0 && (
          <p className="text-sm text-texto/50 italic">
            Nenhuma rede ativa neste projeto ainda.
          </p>
        )}
      </div>
    </div>
  );
}

function CalendarioDaRede({
  rede,
  ano,
  mes,
  celulas,
  conteudos,
  miniaturaPorConteudo,
}: {
  rede: string;
  ano: number;
  mes: number;
  celulas: Date[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conteudos: any[];
  miniaturaPorConteudo: Map<string, string>;
}) {
  const porDia = new Map<string, typeof conteudos>();
  for (const c of conteudos) {
    const chave = c.data_hora.slice(0, 10);
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave)!.push(c);
  }

  const publicados = conteudos.filter((c) => c.status === "publicado").length;
  const aprovados = conteudos.filter((c) => c.status === "aprovado").length;
  const contagemPorFormato = conteudos.reduce((acc, c) => {
    acc[c.formato] = (acc[c.formato] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (conteudos.length === 0) {
    return (
      <section>
        <h2 className="font-title font-800 text-lg text-principal mb-2">
          {redeParaLabel[rede]}
        </h2>
        <p className="text-sm text-texto/50 italic">
          Nenhum conteúdo neste mês.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-y-1">
        <h2 className="font-title font-800 text-lg text-principal">
          {redeParaLabel[rede]}
        </h2>
        <p className="text-xs text-texto/60">
          {publicados} publicado(s) · {aprovados} aprovado(s) a publicar ·{" "}
          {Object.entries(contagemPorFormato)
            .map(([f, n]) => `${n} ${formatoParaLabel[f]}`)
            .join(" · ")}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-texto/50 mb-1">
        {diasSemana.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celulas.map((dia) => {
          const chave = chaveDia(dia);
          const itens = porDia.get(chave) ?? [];
          const foraDoMes = dia.getMonth() !== mes;
          return (
            <div
              key={chave}
              className={`rounded-lg border border-black/5 min-h-[72px] p-1 flex flex-col gap-1 ${
                foraDoMes ? "bg-black/[0.02] opacity-40" : "bg-branco"
              }`}
            >
              <span className="text-[10px] font-semibold text-texto/50">
                {dia.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {itens.slice(0, 2).map((item) => {
                  const miniatura = miniaturaPorConteudo.get(item.id);
                  const esmaecido =
                    item.status === "em_aprovacao" || item.status === "reprovado";
                  return (
                    <Link
                      key={item.id}
                      href={`/conteudo/${item.id}`}
                      className={`flex items-center gap-1 rounded bg-apoio/10 px-1 py-0.5 ${
                        esmaecido ? "opacity-50" : ""
                      }`}
                    >
                      {miniatura ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={miniatura}
                          alt=""
                          className="h-4 w-4 rounded-sm object-cover flex-shrink-0"
                        />
                      ) : (
                        <span className="h-4 w-4 rounded-sm bg-apoio/30 flex-shrink-0" />
                      )}
                      <span className="text-[9px] text-texto truncate">
                        {item.titulo}
                      </span>
                    </Link>
                  );
                })}
                {itens.length > 2 && (
                  <span className="text-[9px] text-texto/40">
                    +{itens.length - 2}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
