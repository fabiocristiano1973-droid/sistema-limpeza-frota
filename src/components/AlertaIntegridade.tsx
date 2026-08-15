import { AlertaAtivo } from "@/lib/db/integrity-guard";

export default function AlertaIntegridade({ motivo, detectadoEm, detalhes }: AlertaAtivo) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-red-950 px-4 text-center text-white">
      <div className="w-full max-w-lg rounded-2xl bg-red-900 p-6 shadow-xl ring-1 ring-red-700">
        <p className="text-4xl">⛔</p>
        <h1 className="mt-3 text-xl font-bold">Sistema bloqueado por segurança</h1>
        <p className="mt-2 text-sm text-red-100">
          O banco de dados perdeu tabelas ou dados essenciais e o sistema recusou continuar
          normalmente para não recriar cadastros com dados fictícios por cima do que já foi
          perdido.
        </p>

        <div className="mt-4 rounded-lg bg-red-950/60 p-3 text-left text-xs text-red-100 ring-1 ring-red-800">
          <p>
            <span className="font-semibold">Detectado em:</span>{" "}
            {new Date(detectadoEm).toLocaleString("pt-BR")}
          </p>
          <p className="mt-1">
            <span className="font-semibold">Motivo:</span> {motivo}
          </p>
          {detalhes && (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(detalhes, null, 2)}</pre>
          )}
        </div>

        <p className="mt-4 text-xs text-red-200">
          Restaure o backup íntegro mais recente e reinicie o servidor. O sistema volta a
          funcionar normalmente assim que a verificação de inicialização passar.
        </p>
      </div>
    </div>
  );
}
