import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { StatusBadge } from "@/components/status-badge";
import { Status } from "@/lib/types";
import {
  statusParaLabel,
  redeParaLabel,
  formatoParaLabel,
  tipoParaLabel,
} from "@/lib/labels";
import {
  aprovarConteudo,
  reprovarConteudo,
  adicionarComentario,
} from "@/app/actions/approvals";
import { marcarComoPublicado } from "@/app/actions/contents";
import { AssetUploader } from "@/components/asset-uploader";
import { excluirAsset } from "@/app/actions/assets";
import { ReplaceAssetButton } from "@/components/replace-asset-button";
import { DeleteContentButton } from "@/components/delete-content-button";
import { Checklist } from "@/components/checklist";
import { EnviarAprovacaoButton } from "@/components/enviar-aprovacao-button";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { extensaoParaMime } from "@/lib/mime";

const rotuloEvento: Record<string, string> = {
  criado: "Criado",
  enviado_para_aprovacao: "Enviado para aprovação",
  aprovado: "Aprovado",
  aprovado_parcial: "Aprovado por um dos aprovadores (aguardando os demais)",
  reprovado: "Reprovado",
  publicado: "Marcado como publicado",
  editado: "Editado",
  editado_derrubou_aprovacao: "Editado (voltou para \"Em aprovação\")",
  arquivo_substituido: "Arquivo substituído (versão anterior guardada)",
};

export default async function ConteudoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { papel, project } = await getUsuarioEProjetoAtual();
  const supabase = await createClient();

  const { data: conteudo } = await supabase
    .from("contents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!conteudo) notFound();

  const [
    { data: aprovacoes },
    { data: comentarios },
    { data: historico },
    { data: membros },
    { data: assets },
  ] = await Promise.all([
    supabase
      .from("approvals")
      .select("*")
      .eq("content_id", id)
      .order("criado_em", { ascending: false }),
    supabase
      .from("comments")
      .select("*")
      .eq("content_id", id)
      .order("criado_em", { ascending: true }),
    supabase
      .from("activity_log")
      .select("*")
      .eq("content_id", id)
      .order("criado_em", { ascending: false }),
    supabase
      .from("project_members")
      .select("user_id, profiles(nome)")
      .eq("project_id", project.id),
    supabase
      .from("assets")
      .select("*")
      .eq("content_id", id)
      .eq("versao_atual", true)
      .order("ordem", { ascending: true }),
  ]);

  const [{ data: itensChecklist }, { data: respostasChecklist }] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("id, texto")
      .eq("project_id", project.id)
      .order("ordem", { ascending: true }),
    supabase
      .from("checklist_responses")
      .select("checklist_item_id, marcado")
      .eq("content_id", id),
  ]);

  const mapaRespostasChecklist = new Map(
    (respostasChecklist ?? []).map((r) => [r.checklist_item_id, r.marcado])
  );
  const checklistCompleto =
    (itensChecklist ?? []).length > 0 &&
    (itensChecklist ?? []).every((i) => mapaRespostasChecklist.get(i.id));

  const { data: versoesAnteriores } = await supabase
    .from("assets")
    .select("*")
    .eq("content_id", id)
    .eq("versao_atual", false)
    .order("ordem", { ascending: true })
    .order("versao", { ascending: false });

  const versoesAnterioresComUrl = await Promise.all(
    (versoesAnteriores ?? []).map(async (a) => {
      try {
        const extensao = a.caminho_storage.split(".").pop()?.toLowerCase() ?? "";
        const url = await getSignedUrl(
          r2,
          new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: a.caminho_storage,
            ResponseContentType: extensaoParaMime[extensao],
          }),
          { expiresIn: 60 * 60 }
        );
        return { ...a, url };
      } catch {
        return { ...a, url: null };
      }
    })
  );

  const assetsComUrl = await Promise.all(
    (assets ?? []).map(async (a) => {
      try {
        const extensao = a.caminho_storage.split(".").pop()?.toLowerCase() ?? "";
        const url = await getSignedUrl(
          r2,
          new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: a.caminho_storage,
            ResponseContentType: extensaoParaMime[extensao],
          }),
          { expiresIn: 60 * 60 }
        );
        return { ...a, url };
      } catch {
        return { ...a, url: null };
      }
    })
  );

  const nomePorUsuario = new Map<string, string>();
  for (const m of membros ?? []) {
    // @ts-expect-error join retorna objeto único
    nomePorUsuario.set(m.user_id, m.profiles?.nome || "Alguém da equipe");
  }

  const podeEditar = papel === "administrador" || papel === "editor";
  const podeApagar = papel === "administrador";
  const podeAprovar = papel === "administrador" || papel === "aprovador";

  const ultimaReprovacao = (aprovacoes ?? []).find((a) => a.decisao === "reprovado");

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 md:py-6">
      <Link href="/" className="text-sm text-apoio font-medium">
        ← Voltar para a semana
      </Link>

      <div className="flex items-start justify-between gap-3 mt-2 mb-4">
        <h1 className="font-title font-900 text-2xl text-principal">
          {conteudo.titulo}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={statusParaLabel[conteudo.status] as Status} />
          {podeEditar && (
            <Link
              href={`/conteudo/${conteudo.id}/editar`}
              className="text-xs font-semibold text-principal underline whitespace-nowrap"
            >
              editar
            </Link>
          )}
          {podeApagar && (
            <DeleteContentButton
              contentId={conteudo.id}
              titulo={conteudo.titulo}
              redirecionarPara={
                conteudo.tipo === "criativo" ? "/criativos" : "/"
              }
            />
          )}
        </div>
      </div>

      {/* Prévia dos arquivos */}
      {assetsComUrl.length > 0 ? (
        <div
          className={`mb-4 ${
            assetsComUrl.length > 1
              ? "grid grid-cols-2 sm:grid-cols-3 gap-2"
              : ""
          }`}
        >
          {assetsComUrl.map((a) => (
            <div key={a.id} className="rounded-xl overflow-hidden bg-black/5 relative">
              {a.tipo === "video" ? (
                <video src={a.url ?? undefined} controls className="w-full h-full object-cover" />
              ) : a.tipo === "pdf" ? (
                <a
                  href={a.url ?? undefined}
                  target="_blank"
                  className="flex items-center justify-center h-40 text-sm font-medium text-principal underline"
                >
                  Abrir PDF
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.url ?? undefined}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    aspectRatio: conteudo.formato === "story" ? "9/16" : "4/5",
                  }}
                />
              )}
              {a.e_capa && (
                <span className="absolute top-1.5 left-1.5 bg-principal text-branco text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  capa
                </span>
              )}
              <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-branco text-[10px] font-semibold px-2 py-0.5 rounded-full">
                v{a.versao} (atual)
              </span>
              {podeEditar && (
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <ReplaceAssetButton
                    projectId={conteudo.project_id}
                    contentId={conteudo.id}
                    assetId={a.id}
                  />
                  <form action={excluirAsset}>
                    <input type="hidden" name="assetId" value={a.id} />
                    <input type="hidden" name="contentId" value={conteudo.id} />
                    <button
                      type="submit"
                      aria-label="Apagar arquivo"
                      className="h-6 w-6 rounded-full bg-black/60 text-branco text-xs flex items-center justify-center hover:bg-[var(--status-reprovado)]"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl mb-4 flex items-center justify-center text-branco/70 text-sm font-medium"
          style={{
            background: "#0B3D23",
            aspectRatio: conteudo.formato === "story" ? "9/16" : "4/5",
            maxHeight: 420,
          }}
        >
          Sem arquivo enviado ainda
        </div>
      )}

      {podeEditar && (
        <div className="mb-4">
          <AssetUploader
            projectId={conteudo.project_id}
            contentId={conteudo.id}
            proximaOrdem={assetsComUrl.length}
          />
        </div>
      )}

      {versoesAnterioresComUrl.length > 0 && (
        <details className="mb-4">
          <summary className="cursor-pointer text-xs font-semibold text-texto/60">
            Ver {versoesAnterioresComUrl.length} versão(ões) anterior(es)
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {versoesAnterioresComUrl.map((a) => (
              <div
                key={a.id}
                className="rounded-xl overflow-hidden bg-black/5 relative opacity-80"
              >
                {a.tipo === "video" ? (
                  <video src={a.url ?? undefined} controls className="w-full h-full object-cover" />
                ) : a.tipo === "pdf" ? (
                  <a
                    href={a.url ?? undefined}
                    target="_blank"
                    className="flex items-center justify-center h-32 text-sm font-medium text-principal underline"
                  >
                    Abrir PDF
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url ?? undefined} alt="" className="w-full h-full object-cover" />
                )}
                <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-branco text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  v{a.versao}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {conteudo.status === "reprovado" && ultimaReprovacao && (
        <div className="rounded-lg bg-[var(--status-reprovado-bg)] border border-[var(--status-reprovado)]/30 p-3 mb-4">
          <p className="text-xs font-semibold text-[var(--status-reprovado)] mb-1">
            Motivo da reprovação
          </p>
          <p className="text-sm text-texto">{ultimaReprovacao.comentario}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
        <InfoPill label="Rede" valor={redeParaLabel[conteudo.rede]} />
        <InfoPill label="Formato" valor={formatoParaLabel[conteudo.formato]} />
        <InfoPill label="Tipo" valor={tipoParaLabel[conteudo.tipo]} />
        <InfoPill
          label="Data"
          valor={new Date(conteudo.data_hora).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {conteudo.objetivo && (
          <Bloco titulo="Objetivo" texto={conteudo.objetivo} />
        )}
        {conteudo.legenda && (
          <Bloco titulo="Legenda" texto={conteudo.legenda} />
        )}
        {conteudo.cta && <Bloco titulo="CTA" texto={conteudo.cta} />}
        {conteudo.copy_link && (
          <div>
            <p className="text-xs font-semibold text-texto/50 mb-0.5">
              Arquivo/link da copy
            </p>
            <a
              href={conteudo.copy_link}
              target="_blank"
              className="text-sm text-apoio underline break-all"
            >
              {conteudo.copy_link}
            </a>
          </div>
        )}
      </div>

      {(itensChecklist ?? []).length > 0 && (
        <Checklist
          contentId={conteudo.id}
          itens={itensChecklist ?? []}
          respostas={mapaRespostasChecklist}
          somenteLeitura={
            !podeEditar ||
            !(conteudo.status === "rascunho" || conteudo.status === "reprovado")
          }
        />
      )}

      {/* Ações */}
      <div className="flex flex-col gap-3 mb-8">
        {conteudo.status === "rascunho" && podeEditar && (
          <EnviarAprovacaoButton
            contentId={conteudo.id}
            checklistCompleto={checklistCompleto}
            temChecklist={(itensChecklist ?? []).length > 0}
            texto="Enviar para aprovação"
          />
        )}

        {conteudo.status === "reprovado" && podeEditar && (
          <EnviarAprovacaoButton
            contentId={conteudo.id}
            checklistCompleto={checklistCompleto}
            temChecklist={(itensChecklist ?? []).length > 0}
            texto="Reenviar para aprovação"
          />
        )}

        {conteudo.status === "em_aprovacao" && podeAprovar && (
          <div className="grid grid-cols-2 gap-3">
            <form action={aprovarConteudo}>
              <input type="hidden" name="contentId" value={conteudo.id} />
              <button className="w-full rounded-full bg-[var(--status-aprovado)] text-branco font-semibold text-sm py-3 min-h-[44px]">
                ✅ Aprovar
              </button>
            </form>
            <details className="col-span-2 sm:col-span-1">
              <summary className="cursor-pointer w-full text-center rounded-full border border-[var(--status-reprovado)] text-[var(--status-reprovado)] font-semibold text-sm py-3 min-h-[44px] list-none">
                ❌ Reprovar
              </summary>
              <form action={reprovarConteudo} className="flex flex-col gap-2 mt-2">
                <input type="hidden" name="contentId" value={conteudo.id} />
                <textarea
                  name="comentario"
                  required
                  rows={3}
                  placeholder="Motivo da reprovação (obrigatório)"
                  className="campo-input"
                />
                <button className="rounded-full bg-[var(--status-reprovado)] text-branco font-semibold text-sm py-2.5 min-h-[44px]">
                  Confirmar reprovação
                </button>
              </form>
            </details>
          </div>
        )}

        {conteudo.status === "aprovado" && podeEditar && (
          <form
            action={marcarComoPublicado}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input type="hidden" name="contentId" value={conteudo.id} />
            <input
              name="linkPublicado"
              placeholder="Link do post (opcional)"
              className="campo-input flex-1"
            />
            <button className="rounded-full bg-[var(--status-publicado)] text-branco font-semibold text-sm px-4 py-2.5 min-h-[44px] whitespace-nowrap">
              ✓ Marcar como publicado
            </button>
          </form>
        )}
      </div>

      {/* Comentários */}
      <section className="mb-8">
        <h2 className="font-title font-800 text-lg text-principal mb-3">
          Comentários
        </h2>
        <div className="flex flex-col gap-3 mb-3">
          {(comentarios ?? []).length === 0 && (
            <p className="text-sm text-texto/50 italic">
              Nenhum comentário ainda.
            </p>
          )}
          {(comentarios ?? []).map((c) => (
            <div key={c.id} className="rounded-lg bg-cartao border border-black/5 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-texto">
                  {nomePorUsuario.get(c.autor_id) ?? "Alguém da equipe"}
                  {c.slide != null && (
                    <span className="text-apoio"> · slide {c.slide}</span>
                  )}
                </span>
                <span className="text-[11px] text-texto/40">
                  {new Date(c.criado_em).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="text-sm text-texto">{c.texto}</p>
            </div>
          ))}
        </div>
        <form action={adicionarComentario} className="flex gap-2">
          <input type="hidden" name="contentId" value={conteudo.id} />
          <input
            name="texto"
            required
            placeholder="Escreva um comentário..."
            className="campo-input flex-1"
          />
          <button className="rounded-full bg-principal/10 text-principal font-semibold text-sm px-4 py-2.5 min-h-[44px]">
            Enviar
          </button>
        </form>
      </section>

      {/* Histórico */}
      <section>
        <h2 className="font-title font-800 text-lg text-principal mb-3">
          Histórico
        </h2>
        <ol className="flex flex-col gap-2 border-l-2 border-apoio/20 pl-4">
          {(historico ?? []).map((h) => (
            <li key={h.id} className="text-sm">
              <span className="font-medium text-texto">
                {rotuloEvento[h.tipo_evento] ?? h.tipo_evento}
              </span>{" "}
              <span className="text-texto/50">
                · {nomePorUsuario.get(h.autor_id ?? "") ?? "sistema"} ·{" "}
                {new Date(h.criado_em).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function InfoPill({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg bg-apoio/10 px-2.5 py-2">
      <p className="text-[10px] font-semibold text-apoio uppercase">{label}</p>
      <p className="text-texto font-medium">{valor}</p>
    </div>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-texto/50 mb-0.5">{titulo}</p>
      <p className="text-sm text-texto whitespace-pre-wrap">{texto}</p>
    </div>
  );
}
