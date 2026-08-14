"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function sair() {
    setEnviando(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      disabled={enviando}
      className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
    >
      Sair
    </button>
  );
}
