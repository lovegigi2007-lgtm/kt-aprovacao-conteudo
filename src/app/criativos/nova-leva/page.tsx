import Link from "next/link";
import { criarLeva } from "@/app/actions/batches";

export default async function NovaLevaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const hoje = new Date();
  const mesInicial =
    params.mes ??
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link href="/criativos" className="text-sm text-apoio font-medium">
        ← Voltar para criativos
      </Link>
      <h1 className="font-title font-900 text-2xl text-principal mt-2 mb-5">
        Nova leva
      </h1>

      <form action={criarLeva} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-texto/70">Nome da leva</span>
          <input
            name="nome"
            required
            className="campo-input"
            placeholder="Ex.: Leva 03 · MP 1.376"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-texto/70">Mês de referência</span>
          <input
            name="mesReferencia"
            type="month"
            required
            defaultValue={mesInicial}
            className="campo-input"
          />
        </label>

        <button
          type="submit"
          className="rounded-full bg-principal text-branco font-semibold text-sm py-3 min-h-[44px] hover:bg-principal/90 mt-2"
        >
          Criar leva
        </button>
      </form>
    </div>
  );
}
