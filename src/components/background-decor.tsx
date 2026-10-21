// Folhas decorativas bem sutis no fundo, fixas atrás do conteúdo, iguais
// em todas as abas. Vêm do símbolo da marca (círculo com folhas).
export function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <svg
        className="absolute -top-16 -right-24 h-[420px] w-[420px] opacity-[0.06]"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 2C78 18 96 44 50 98C4 44 22 18 50 2Z"
          fill="var(--color-principal)"
        />
      </svg>
      <svg
        className="absolute top-1/3 -left-28 h-[360px] w-[360px] opacity-[0.05] rotate-[25deg]"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 2C78 18 96 44 50 98C4 44 22 18 50 2Z"
          fill="var(--color-apoio)"
        />
      </svg>
      <svg
        className="absolute -bottom-20 -right-16 h-[320px] w-[320px] opacity-[0.07] rotate-[-18deg]"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 2C78 18 96 44 50 98C4 44 22 18 50 2Z"
          fill="var(--color-destaque)"
        />
      </svg>
      <svg
        className="absolute bottom-10 -left-16 h-[260px] w-[260px] opacity-[0.05] rotate-[60deg]"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 2C78 18 96 44 50 98C4 44 22 18 50 2Z"
          fill="var(--color-principal)"
        />
      </svg>
    </div>
  );
}
