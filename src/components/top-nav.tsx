import Link from "next/link";

const abas = [
  { href: "/", label: "Semanal" },
  { href: "/mensal", label: "Mensal" },
  { href: "/criativos", label: "Criativos" },
  { href: "/feed", label: "Feed" },
  { href: "/ideias", label: "Ideias" },
];

export function TopNav({
  aguardandoAprovacao = 0,
  notificacoesNaoLidas = 0,
}: {
  aguardandoAprovacao?: number;
  notificacoesNaoLidas?: number;
}) {
  return (
    <header className="hidden md:flex items-center justify-between bg-principal text-branco px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-destaque/90 flex items-center justify-center font-title font-900 text-principal text-sm">
          KT
        </div>
        <div>
          <p className="font-title font-800 text-sm leading-tight">
            Kruger Toledo Consultoria
          </p>
          <p className="text-[11px] text-branco/70 leading-tight">
            trocar de projeto
          </p>
        </div>
      </div>
      <nav className="flex items-center gap-1">
        {abas.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className="px-4 py-2 rounded-full text-sm font-medium text-branco/85 hover:bg-branco/10 hover:text-branco transition-colors"
          >
            {aba.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {aguardandoAprovacao > 0 && (
          <Link
            href="/aprovacao"
            className="flex items-center gap-1.5 rounded-full bg-destaque text-principal text-xs font-bold px-3 py-1.5 hover:brightness-95"
          >
            🔔 {aguardandoAprovacao} aguardando sua aprovação
          </Link>
        )}
        <Link href="/notificacoes" className="relative" aria-label="Notificações">
          <span className="text-xl">🔔</span>
          {notificacoesNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-destaque text-principal text-[10px] font-bold flex items-center justify-center">
              {notificacoesNaoLidas}
            </span>
          )}
        </Link>
        <div className="h-8 w-8 rounded-full bg-branco/20" />
      </div>
    </header>
  );
}
