export default function ErrorBanner({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null;
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
      {mensagem}
    </div>
  );
}
