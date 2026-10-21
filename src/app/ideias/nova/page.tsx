import Link from "next/link";
import { criarIdeia } from "@/app/actions/ideas";

export default function NovaIdeiaPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link href="/ideias" className="text-sm text-apoio font-medium">
        ← Voltar para ideias
      </Link>
      <h1 className="font-title font-900 text-2xl text-principal mt-2 mb-5">
        Nova ideia
      </h1>

      <form action={criarIdeia} className="flex flex-col gap-4">
        <Campo label="Título / resumo da ideia">
          <input
            name="titulo"
            required
            className="campo-input"
            placeholder="Ex.: Reels sobre perda por granizo"
          />
        </Campo>

        <Campo label="Link de referência (opcional)">
          <input
            name="link"
            type="url"
            className="campo-input"
            placeholder="Post que você viu em outra rede, por exemplo"
          />
        </Campo>

        <Campo label="Link da copy/roteiro (Google Drive, opcional)">
          <input
            name="copyLink"
            type="url"
            className="campo-input"
            placeholder="https://drive.google.com/..."
          />
        </Campo>

        <Campo label="Nota">
          <textarea
            name="nota"
            rows={3}
            className="campo-input"
            placeholder="Por que essa ideia é boa, o que precisa pra gravar, etc."
          />
        </Campo>

        <button
          type="submit"
          className="rounded-full bg-principal text-branco font-semibold text-sm py-3 min-h-[44px] hover:bg-principal/90 mt-2"
        >
          Salvar ideia
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
