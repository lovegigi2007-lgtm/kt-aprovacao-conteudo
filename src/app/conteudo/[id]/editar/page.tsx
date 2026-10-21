import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { editarConteudo } from "@/app/actions/contents";
import { redeParaLabel, formatoParaLabel, tipoParaLabel } from "@/lib/labels";

export default async function EditarConteudoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conteudo } = await supabase
    .from("contents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!conteudo) notFound();

  const dataHora = new Date(conteudo.data_hora);
  const dataValor = dataHora.toISOString().slice(0, 10);
  const horaValor = dataHora.toISOString().slice(11, 16);

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link href={`/conteudo/${id}`} className="text-sm text-apoio font-medium">
        ← Voltar para o conteúdo
      </Link>
      <h1 className="font-title font-900 text-2xl text-principal mt-2 mb-2">
        Editar conteúdo
      </h1>
      {conteudo.status === "aprovado" && (
        <p className="text-xs text-[var(--status-em-aprovacao)] bg-[var(--status-em-aprovacao-bg)] rounded-lg px-3 py-2 mb-4">
          Este conteúdo já está aprovado. Se você mudar qualquer coisa além
          da data, ele volta para "Em aprovação" automaticamente.
        </p>
      )}

      <form action={editarConteudo} className="flex flex-col gap-4">
        <input type="hidden" name="contentId" value={conteudo.id} />
        <Campo label="Título">
          <input
            name="titulo"
            required
            defaultValue={conteudo.titulo}
            className="campo-input"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Data">
            <input
              name="data"
              type="date"
              required
              defaultValue={dataValor}
              className="campo-input"
            />
          </Campo>
          <Campo label="Horário">
            <input
              name="hora"
              type="time"
              defaultValue={horaValor}
              className="campo-input"
            />
          </Campo>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Campo label="Rede">
            <select
              name="rede"
              defaultValue={redeParaLabel[conteudo.rede]}
              className="campo-input"
            >
              <option>Instagram</option>
              <option>LinkedIn</option>
              <option>TikTok</option>
            </select>
          </Campo>
          <Campo label="Formato">
            <select
              name="formato"
              defaultValue={formatoParaLabel[conteudo.formato]}
              className="campo-input"
            >
              <option>Estático</option>
              <option>Reels</option>
              <option>Carrossel</option>
              <option>Story</option>
            </select>
          </Campo>
          <Campo label="Tipo">
            <select
              name="tipo"
              defaultValue={tipoParaLabel[conteudo.tipo]}
              className="campo-input"
            >
              <option>Conteúdo</option>
              <option>Criativo</option>
            </select>
          </Campo>
        </div>

        <Campo label="Objetivo">
          <input
            name="objetivo"
            defaultValue={conteudo.objetivo ?? ""}
            className="campo-input"
          />
        </Campo>

        <Campo label="Legenda">
          <textarea
            name="legenda"
            rows={4}
            defaultValue={conteudo.legenda ?? ""}
            className="campo-input"
          />
        </Campo>

        <Campo label="CTA">
          <input
            name="cta"
            defaultValue={conteudo.cta ?? ""}
            className="campo-input"
          />
        </Campo>

        <Campo label="Link da copy (Google Drive)">
          <input
            name="copyLink"
            type="url"
            defaultValue={conteudo.copy_link ?? ""}
            className="campo-input"
          />
        </Campo>

        <button
          type="submit"
          className="rounded-full bg-principal text-branco font-semibold text-sm py-3 min-h-[44px] hover:bg-principal/90 mt-2"
        >
          Salvar alterações
        </button>
      </form>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-texto/70">{label}</span>
      {children}
    </label>
  );
}
