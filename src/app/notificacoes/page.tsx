import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { marcarTodasComoLidas } from "@/app/actions/notifications";

const rotuloTipo: Record<string, string> = {
  aguardando_aprovacao: "Novo conteúdo aguardando sua aprovação",
  aprovado: "Seu conteúdo foi aprovado",
  reprovado: "Seu conteúdo foi reprovado",
  comentario: "Novo comentário no seu conteúdo",
};

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notificacoes } = user
    ? await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("criado_em", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-title font-900 text-2xl text-principal">
          Notificações
        </h1>
        <form action={marcarTodasComoLidas}>
          <button className="text-xs font-semibold text-apoio underline">
            Marcar todas como lidas
          </button>
        </form>
      </div>

      {(notificacoes ?? []).length === 0 && (
        <p className="text-sm text-texto/50 italic">
          Nenhuma notificação por aqui.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {(notificacoes ?? []).map((n) => (
          <Link
            key={n.id}
            href={n.link ?? "/"}
            className={`rounded-lg border p-3 text-sm ${
              n.lida
                ? "border-black/5 bg-cartao text-texto/60"
                : "border-apoio/30 bg-apoio/5 text-texto font-medium"
            }`}
          >
            <p>{rotuloTipo[n.tipo] ?? n.tipo}</p>
            <p className="text-[11px] text-texto/40 mt-0.5">
              {new Date(n.criado_em).toLocaleString("pt-BR")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
