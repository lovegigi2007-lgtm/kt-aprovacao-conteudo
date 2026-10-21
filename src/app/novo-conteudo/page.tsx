import { criarConteudo } from "@/app/actions/contents";
import Link from "next/link";

export default async function NovoConteudoPage({
  searchParams,
}: {
  searchParams: Promise<{
    data?: string;
    titulo?: string;
    copyLink?: string;
    ideaId?: string;
  }>;
}) {
  const params = await searchParams;
  const dataInicial = params.data ?? "";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link href="/" className="text-sm text-apoio font-medium">
        ← Voltar para a semana
      </Link>
      <h1 className="font-title font-900 text-2xl text-principal mt-2 mb-5">
        Novo conteúdo
      </h1>

      <form action={criarConteudo} className="flex flex-col gap-4">
        {params.ideaId && (
          <input type="hidden" name="ideaId" value={params.ideaId} />
        )}
        <Campo label="Título">
          <input
            name="titulo"
            required
            defaultValue={params.titulo ?? ""}
            className="campo-input"
            placeholder="Ex.: Mito ou Verdade: Proagro cobre tudo?"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Data">
            <input
              name="data"
              type="date"
              required
              defaultValue={dataInicial}
              className="campo-input"
            />
          </Campo>
          <Campo label="Horário">
            <input
              name="hora"
              type="time"
              defaultValue="09:00"
              className="campo-input"
            />
          </Campo>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Campo label="Rede">
            <select name="rede" className="campo-input">
              <option>Instagram</option>
              <option>LinkedIn</option>
              <option>TikTok</option>
            </select>
          </Campo>
          <Campo label="Formato">
            <select name="formato" className="campo-input">
              <option>Estático</option>
              <option>Reels</option>
              <option>Carrossel</option>
              <option>Story</option>
            </select>
          </Campo>
          <Campo label="Tipo">
            <select name="tipo" className="campo-input">
              <option>Conteúdo</option>
              <option>Criativo</option>
            </select>
          </Campo>
        </div>

        <Campo label="Objetivo">
          <input
            name="objetivo"
            className="campo-input"
            placeholder="O que esse post precisa gerar"
          />
        </Campo>

        <Campo label="Legenda">
          <textarea name="legenda" rows={4} className="campo-input" />
        </Campo>

        <Campo label="CTA">
          <input name="cta" className="campo-input" placeholder="Chamada para ação" />
        </Campo>

        <Campo label="Link da copy (Google Drive)">
          <input
            name="copyLink"
            type="url"
            defaultValue={params.copyLink ?? ""}
            className="campo-input"
            placeholder="https://drive.google.com/..."
          />
        </Campo>

        <button
          type="submit"
          className="rounded-full bg-principal text-branco font-semibold text-sm py-3 min-h-[44px] hover:bg-principal/90 mt-2"
        >
          Salvar como rascunho
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
