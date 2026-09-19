"use client";

import { useEffect } from "react";

export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((erro) => {
        console.warn("Governo Interior: não foi possível registrar o service worker.", erro);
      });
  }, []);

  return null;
}
