import type { Metadata, Viewport } from "next";
import { Archivo, Lato } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { BottomNav } from "@/components/bottom-nav";
import { getFilaAprovacaoCount } from "@/lib/data/fila-aprovacao";
import { getNotificacoesNaoLidasCount } from "@/lib/data/notifications";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["300", "800", "900"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "KT Consultoria · Conteúdo",
  description: "Calendário e aprovação de conteúdo da Kruger Toledo Consultoria",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3D23",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [aguardandoAprovacao, notificacoesNaoLidas] = await Promise.all([
    getFilaAprovacaoCount(),
    getNotificacoesNaoLidasCount(),
  ]);

  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-fundo text-texto">
        <TopNav
          aguardandoAprovacao={aguardandoAprovacao}
          notificacoesNaoLidas={notificacoesNaoLidas}
        />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav
          aguardandoAprovacao={aguardandoAprovacao}
          notificacoesNaoLidas={notificacoesNaoLidas}
        />
      </body>
    </html>
  );
}
