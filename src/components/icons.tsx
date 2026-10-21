type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function IconSemanal({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
      <rect x="6.5" y="12.3" width="3" height="3" rx="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconMensal({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
      <path d="M7.2 13h1.6M11.2 13h1.6M15.2 13h1.6M7.2 16.5h1.6M11.2 16.5h1.6" />
    </svg>
  );
}

export function IconCriativos({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="7" width="13" height="13" rx="2.2" />
      <path d="M8 7V5.2a2.2 2.2 0 0 1 2.2-2.2h8.6A2.2 2.2 0 0 1 21 5.2v8.6a2.2 2.2 0 0 1-2.2 2.2H17" />
    </svg>
  );
}

export function IconFeed({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.3" />
      <rect x="14" y="3" width="7" height="7" rx="1.3" />
      <rect x="3" y="14" width="7" height="7" rx="1.3" />
      <rect x="14" y="14" width="7" height="7" rx="1.3" />
    </svg>
  );
}

export function IconIdeias({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6.5 6.5 0 0 0-3.8 11.8c.6.45 1 1.2 1 2.2h5.6c0-1 .4-1.75 1-2.2A6.5 6.5 0 0 0 12 3Z" />
    </svg>
  );
}

export function IconSino({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4.2 1.4 5.6 2 6.5H4c.6-.9 2-2.3 2-6.5Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconEngrenagem({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
