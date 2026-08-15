import { verificarSessao } from "@/lib/auth/dal";
import TrocarSenhaForm from "@/components/auth/TrocarSenhaForm";

export const dynamic = "force-dynamic";

export default async function TrocarSenhaPage() {
  const sessao = await verificarSessao();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-1 text-center text-xl font-bold text-slate-900">Trocar senha</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          {sessao.deveTrocarSenha
            ? "Sua senha é provisória. Defina uma nova senha para continuar."
            : "Defina uma nova senha para sua conta."}
        </p>
        <TrocarSenhaForm obrigatoria={sessao.deveTrocarSenha} />
      </div>
    </div>
  );
}
