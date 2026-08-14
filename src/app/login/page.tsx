import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-1 text-center text-xl font-bold text-slate-900">
          Inspeção da Limpeza da Frota
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">Entre com seu login e senha</p>
        <LoginForm />
      </div>
    </div>
  );
}
