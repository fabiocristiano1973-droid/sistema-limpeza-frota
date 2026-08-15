// Renderizada enquanto integrity-guard.ts ainda está tentando confirmar que
// o banco está íntegro (retry em andamento) — evita mostrar tela em branco
// ou, pior, deixar passar/travar em alarme prematuro nesse meio-tempo. O
// <meta refresh> atualiza a página sozinha até resolver (vira o app normal
// ou a tela de alerta, conforme o resultado).
export default function VerificandoIntegridade() {
  return (
    <>
      <meta httpEquiv="refresh" content="2" />
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center text-white">
        <div className="w-full max-w-md rounded-2xl bg-slate-800 p-6 shadow-xl ring-1 ring-slate-700">
          <p className="animate-pulse text-4xl">🔎</p>
          <h1 className="mt-3 text-xl font-bold">Verificando integridade dos dados...</h1>
          <p className="mt-2 text-sm text-slate-300">
            Confirmando que o banco de dados está íntegro após a inicialização do sistema. Isso leva só
            alguns segundos — esta página atualiza sozinha.
          </p>
        </div>
      </div>
    </>
  );
}
