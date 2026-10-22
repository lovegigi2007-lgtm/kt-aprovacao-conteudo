import Link from "next/link";
import {
  IconSemanal,
  IconMensal,
  IconCriativos,
  IconFeed,
  IconIdeias,
} from "./icons";

const abas = [
  { href: "/", label: "Semanal", Icone: IconSemanal, pendenciaChave: "conteudo" },
  { href: "/mensal", label: "Mensal", Icone: IconMensal, pendenciaChave: "conteudo" },
  { href: "/criativos", label: "Criativos", Icone: IconCriativos, pendenciaChave: "criativos" },
  { href: "/feed", label: "Feed", Icone: IconFeed, pendenciaChave: "conteudo" },
  { href: "/ideias", label: "Ideias", Icone: IconIdeias, pendenciaChave: null },
] as const;

export function BottomNav({
  aguardandoAprovacao = 0,
  notificacoesNaoLidas = 0,
  pendenciasPorAba = { conteudo: 0, criativos: 0 },
}: {
  aguardandoAprovacao?: number;
  notificacoesNaoLidas?: number;
  pendenciasPorAba?: { conteudo: number; criativos: number };
}) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
      {aguardandoAprovacao > 0 && (
        <Link
          href="/aprovacao"
          className="flex items-center justify-center gap-1.5 bg-destaque text-principal text-xs font-bold py-2"
        >
          🔔 {aguardandoAprovacao} aguardando sua aprovação
        </Link>
      )}
      {notificacoesNaoLidas > 0 && (
        <Link
          href="/notificacoes"
          className="flex items-center justify-center gap-1.5 bg-apoio text-branco text-xs font-bold py-1.5"
        >
          {notificacoesNaoLidas} notificação(ões) nova(s)
        </Link>
      )}
      <nav className="bg-principal text-branco flex items-stretch justify-around pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.15)]">
        {abas.map((aba) => {
          const pendencia = aba.pendenciaChave
            ? pendenciasPorAba[aba.pendenciaChave]
            : 0;
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 min-h-[52px] text-branco/80 hover:text-branco active:bg-branco/10 transition-colors"
            >
              <span className="relative">
                <aba.Icone className="h-5 w-5" />
                {pendencia > 0 && (
                  <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-destaque" />
                )}
              </span>
              <span className="text-[11px] font-medium">{aba.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
