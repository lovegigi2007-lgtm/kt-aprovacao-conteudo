import { createClient } from "@/lib/supabase/server";
import { getUsuarioEProjetoAtual } from "@/lib/data/current-project";
import { definirPastaRaizDrive } from "@/app/actions/drive-settings";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ drive?: string }>;
}) {
  const params = await searchParams;
  const { papel, project } = await getUsuarioEProjetoAtual();

  if (papel !== "administrador") {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-sm text-texto/60">
          Essa área é só para administradores do projeto.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: conexao } = await supabase
    .from("google_drive_connections")
    .select("*")
    .eq("project_id", project.id)
    .maybeSingle();

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="font-title font-900 text-2xl text-principal mb-5">
        Configurações
      </h1>

      <section className="rounded-xl border border-black/5 bg-cartao p-4 flex flex-col gap-3">
        <h2 className="font-title font-800 text-lg text-principal">
          Google Drive
        </h2>

        {params.drive === "conectado" && (
          <p className="text-sm text-[var(--status-aprovado)] font-medium">
            Conectado com sucesso!
          </p>
        )}
        {params.drive === "sem_refresh_token" && (
          <p className="text-sm text-[var(--status-reprovado)]">
            Não recebi permissão completa do Google. Acesse{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              className="underline"
            >
              myaccount.google.com/permissions
            </a>
            , remova o acesso do app "KT Aprovação de Conteúdo" e tente
            conectar de novo.
          </p>
        )}

        <p className="text-sm text-texto/70">
          {conexao
            ? "✅ Conectado. As pastas de conteúdo e criativos são criadas automaticamente no seu Drive."
            : "Ainda não conectado. Clique abaixo para autorizar o acesso ao seu Google Drive."}
        </p>

        <a
          href="/api/drive/connect"
          className="self-start rounded-full bg-principal text-branco text-sm font-semibold px-4 py-2.5 hover:bg-principal/90"
        >
          {conexao ? "Reconectar" : "Conectar Google Drive"}
        </a>

        {conexao && (
          <form action={definirPastaRaizDrive} className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-medium text-texto/70">
              Pasta raiz no Drive (onde ficam as pastas "Conteúdos" e
              "Criativos")
            </label>
            <input
              name="link"
              type="url"
              defaultValue={
                conexao.pasta_raiz_id
                  ? `https://drive.google.com/drive/folders/${conexao.pasta_raiz_id}`
                  : ""
              }
              placeholder="https://drive.google.com/drive/folders/..."
              className="campo-input"
              required
            />
            <button className="self-start rounded-full bg-principal/10 text-principal text-sm font-semibold px-4 py-2 hover:bg-principal/20">
              Salvar pasta raiz
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
