"use client";

import { useState } from "react";
import Link from "next/link";
import { redeParaLabel, formatoParaLabel, statusParaLabel } from "@/lib/labels";
import { StatusBadge } from "./status-badge";
import { Status } from "@/lib/types";
import { chaveDiaBR, hojeChaveBR } from "@/lib/data-br";

const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface ConteudoLinha {
  id: string;
  titulo: string;
  data_hora: string;
  rede: string;
  formato: string;
  status: string;
}

// As células do calendário vêm do servidor ancoradas ao meio-dia UTC (ver
// gerarGradeDoMes em mensal/page.tsx) — por isso lemos sempre com os
// métodos UTC aqui, pra não escorregar um dia no fuso de quem está vendo.
function chaveDiaCelula(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function MensalInterativo({
  redesParaMostrar,
  linhas,
  celulas,
  ano,
  mes,
  miniaturaPorConteudo,
}: {
  redesParaMostrar: readonly string[];
  linhas: ConteudoLinha[];
  celulas: Date[];
  ano: number;
  mes: number;
  miniaturaPorConteudo: Record<string, string>;
}) {
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const hojeChave = hojeChaveBR();

  const itensDoDiaSelecionado = diaSelecionado
    ? linhas.filter((l) => chaveDiaBR(l.data_hora) === diaSelecionado)
    : [];

  const painelAberto = diaSelecionado !== null;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div
        className={`flex flex-col gap-10 min-w-0 transition-all ${
          painelAberto ? "md:w-[60%]" : "w-full"
        }`}
      >
        {redesParaMostrar.map((rede) => (
          <CalendarioDaRede
            key={rede}
            rede={rede}
            ano={ano}
            mes={mes}
            celulas={celulas}
            conteudos={linhas.filter((l) => l.rede === rede)}
            miniaturaPorConteudo={miniaturaPorConteudo}
            hojeChave={hojeChave}
            diaSelecionado={diaSelecionado}
            onSelecionarDia={setDiaSelecionado}
          />
        ))}
        {redesParaMostrar.length === 0 && (
          <p className="text-sm text-texto/50 italic">
            Nenhuma rede ativa neste projeto ainda.
          </p>
        )}
      </div>

      {/* Painel lateral — computador */}
      {painelAberto && (
        <div className="hidden md:block md:w-[38%] sticky top-4">
          <PainelDoDia
            diaSelecionado={diaSelecionado!}
            itens={itensDoDiaSelecionado}
            miniaturaPorConteudo={miniaturaPorConteudo}
            onFechar={() => setDiaSelecionado(null)}
          />
        </div>
      )}

      {/* Gaveta — celular */}
      {painelAberto && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setDiaSelecionado(null)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-cartao p-4 shadow-lg">
            <div className="h-1 w-10 bg-texto/20 rounded-full mx-auto mb-3" />
            <PainelDoDia
              diaSelecionado={diaSelecionado!}
              itens={itensDoDiaSelecionado}
              miniaturaPorConteudo={miniaturaPorConteudo}
              onFechar={() => setDiaSelecionado(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PainelDoDia({
  diaSelecionado,
  itens,
  miniaturaPorConteudo,
  onFechar,
}: {
  diaSelecionado: string;
  itens: ConteudoLinha[];
  miniaturaPorConteudo: Record<string, string>;
  onFechar: () => void;
}) {
  const dataFormatada = new Date(diaSelecionado + "T00:00:00").toLocaleDateString(
    "pt-BR",
    { weekday: "long", day: "2-digit", month: "long" }
  );

  return (
    <div className="cartao p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-title font-800 text-base text-principal capitalize">
          {dataFormatada}
        </h3>
        <button
          onClick={onFechar}
          aria-label="Fechar"
          className="h-7 w-7 rounded-full bg-principal/10 text-principal flex items-center justify-center hover:bg-principal/20"
        >
          ✕
        </button>
      </div>

      {itens.length === 0 && (
        <p className="text-sm text-texto/50 italic">Nenhum conteúdo neste dia.</p>
      )}

      <div className="flex flex-col gap-2">
        {itens.map((item) => (
          <Link
            key={item.id}
            href={`/conteudo/${item.id}`}
            className="flex items-center gap-2 rounded-lg border border-black/5 bg-fundo p-2 hover:shadow-sm transition-shadow"
          >
            {miniaturaPorConteudo[item.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={miniaturaPorConteudo[item.id]}
                alt=""
                className="h-10 w-10 rounded object-cover flex-shrink-0"
              />
            ) : (
              <span className="h-10 w-10 rounded bg-apoio/20 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-texto truncate">
                {item.titulo}
              </p>
              <p className="text-[11px] text-texto/50">
                {redeParaLabel[item.rede]} · {formatoParaLabel[item.formato]}
              </p>
            </div>
            <StatusBadge status={statusParaLabel[item.status] as Status} />
          </Link>
        ))}
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
  hojeChave,
  diaSelecionado,
  onSelecionarDia,
}: {
  rede: string;
  ano: number;
  mes: number;
  celulas: Date[];
  conteudos: ConteudoLinha[];
  miniaturaPorConteudo: Record<string, string>;
  hojeChave: string;
  diaSelecionado: string | null;
  onSelecionarDia: (chave: string) => void;
}) {
  const porDia = new Map<string, ConteudoLinha[]>();
  for (const c of conteudos) {
    const chave = chaveDiaBR(c.data_hora);
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
          const chave = chaveDiaCelula(dia);
          const itens = porDia.get(chave) ?? [];
          const foraDoMes = dia.getUTCMonth() !== mes;
          const ehHoje = chave === hojeChave;
          const selecionado = chave === diaSelecionado;
          return (
            <button
              key={chave}
              type="button"
              onClick={() => onSelecionarDia(chave)}
              className={`text-left rounded-lg border min-h-[72px] p-1 flex flex-col gap-1 transition-colors ${
                foraDoMes ? "bg-black/[0.02] opacity-40 border-black/5" : "bg-cartao"
              } ${
                selecionado
                  ? "border-principal ring-2 ring-principal/30"
                  : ehHoje
                  ? "border-apoio ring-1 ring-apoio/40"
                  : "border-black/5 hover:border-apoio/40"
              }`}
            >
              <span
                className={`text-[10px] font-semibold ${
                  ehHoje ? "text-apoio" : "text-texto/50"
                }`}
              >
                {ehHoje ? "Hoje" : dia.getUTCDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {itens.slice(0, 2).map((item) => {
                  const miniatura = miniaturaPorConteudo[item.id];
                  const esmaecido =
                    item.status === "em_aprovacao" || item.status === "reprovado";
                  return (
                    <span
                      key={item.id}
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
                    </span>
                  );
                })}
                {itens.length > 2 && (
                  <span className="text-[9px] text-texto/40">
                    +{itens.length - 2}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
