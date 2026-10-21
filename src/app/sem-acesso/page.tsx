import Image from "next/image";

export default function SemAcessoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fundo px-4">
      <div className="w-full max-w-sm bg-cartao rounded-2xl shadow-sm border border-black/5 p-6 text-center">
        <Image
          src="/logo-simbolo.png"
          alt="Kruger Toledo Consultoria"
          width={48}
          height={48}
          className="h-12 w-12 rounded-full mb-4 mx-auto"
        />
        <h1 className="font-title font-900 text-xl text-principal mb-2">
          Login feito, mas falta um passo
        </h1>
        <p className="text-sm text-texto/70">
          Seu login funcionou, mas você ainda não foi adicionado a nenhum
          projeto neste sistema. Avise um administrador para liberar seu
          acesso.
        </p>
      </div>
    </div>
  );
}
