"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviarLinkMagico(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setCarregando(false);
    if (error) {
      setErro("Não deu certo enviar o link. Confira o e-mail e tente de novo.");
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-fundo px-4">
      <div className="w-full max-w-sm bg-cartao rounded-2xl shadow-sm border border-black/5 p-6">
        <Image
          src="/logo-simbolo.png"
          alt="Kruger Toledo Consultoria"
          width={48}
          height={48}
          className="h-12 w-12 rounded-full mb-4"
          priority
        />
        <h1 className="font-title font-900 text-xl text-principal mb-1">
          Entrar
        </h1>
        <p className="text-sm text-texto/60 mb-5">
          Digite seu e-mail e enviamos um link para entrar, sem senha.
        </p>

        {enviado ? (
          <p className="text-sm text-apoio font-medium">
            Link enviado! Confira seu e-mail ({email}) e clique no link para
            entrar.
          </p>
        ) : (
          <form onSubmit={enviarLinkMagico} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-principal/40"
            />
            {erro && <p className="text-xs text-[var(--status-reprovado)]">{erro}</p>}
            <button
              type="submit"
              disabled={carregando}
              className="rounded-full bg-principal text-branco font-semibold text-sm py-2.5 min-h-[44px] hover:bg-principal/90 disabled:opacity-60"
            >
              {carregando ? "Enviando..." : "Enviar link mágico"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
