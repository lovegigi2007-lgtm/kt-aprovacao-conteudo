import Link from "next/link";
import Image from "next/image";
import {
  IconSemanal,
  IconMensal,
  IconCriativos,
  IconFeed,
  IconIdeias,
  IconSino,
  IconEngrenagem,
} from "./icons";

const abas = [
  { href: "/", label: "Semanal", Icone: IconSemanal, pendenciaChave: "conteudo" },
  { href: "/mensal", label: "Mensal", Icone: IconMensal, pendenciaChave: "conteudo" },
  { href: "/criativos", label: "Criativos", Icone: IconCriativos, pendenciaChave: "criativos" },
  { href: "/feed", label: "Feed", Icone: IconFeed, pendenciaChave: "conteudo" },
  { href: "/ideias", label: "Ideias", Icone: IconIdeias, pendenciaChave: null },
] as const;

export function TopNav({
  aguardandoAprovacao = 0,
  notificacoesNaoLidas = 0,
  pendenciasPorAba = { conteudo: 0, criativos: 0 },
}: {
  aguardandoAprovacao?: number;
  notificacoesNaoLidas?: number;
  pendenciasPorAba?: { conteudo: number; criativos: number };
}) {
  return (
    <header className="hidden md:flex items-center justify-between bg-principal text-branco px-6 py-3">
      <div className="flex items-center gap-3">
        <Image
          src="/logo-simbolo.png"
          alt="Kruger Toledo Consultoria"
          width={36}
          height={36}
          className="h-9 w-9 rounded-full"
          priority
        />
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
        {abas.map((aba) => {
          const pendencia = aba.pendenciaChave
            ? pendenciasPorAba[aba.pendenciaChave]
            : 0;
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className="relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-branco/85 hover:bg-branco/10 hover:text-branco transition-colors"
            >
              <aba.Icone className="h-4 w-4" />
              {aba.label}
              {pendencia > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-destaque" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3">
        {aguardandoAprovacao > 0 && (
          <Link
            href="/aprovacao"
            className="flex items-center gap-1.5 rounded-full bg-destaque text-principal text-xs font-bold px-3 py-1.5 transition-all hover:brightness-95 hover:shadow-md"
          >
            <IconSino className="h-3.5 w-3.5" />
            {aguardandoAprovacao} aguardando sua aprovação
          </Link>
        )}
        <Link
          href="/notificacoes"
          className="relative text-branco/85 hover:text-branco transition-colors"
          aria-label="Notificações"
        >
          <IconSino className="h-5 w-5" />
          {notificacoesNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-destaque text-principal text-[10px] font-bold flex items-center justify-center">
              {notificacoesNaoLidas}
            </span>
          )}
        </Link>
        <Link
          href="/configuracoes"
          aria-label="Configurações"
          className="text-branco/85 hover:text-branco transition-colors"
        >
          <IconEngrenagem className="h-5 w-5" />
        </Link>
        <div className="h-8 w-8 rounded-full bg-branco/20" />
      </div>
    </header>
  );
}
