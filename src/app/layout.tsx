import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { obterSessao } from "@/lib/auth/session";
import LogoutButton from "@/components/auth/LogoutButton";
import { lerAlertaAtivo } from "@/lib/db/integrity-guard";
import AlertaIntegridade from "@/components/AlertaIntegridade";

const LABEL_PERFIL: Record<string, string> = {
  INSPETOR: "Inspetor/Encarregado",
  GESTOR: "Gestor",
  ADMIN: "Administrador",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inspeção da Limpeza da Frota",
  description: "Sistema de Inspeção e Liberação da Limpeza da Frota",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const alerta = lerAlertaAtivo();
  const sessao = alerta ? null : await obterSessao();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900">
        {alerta ? (
          <AlertaIntegridade {...alerta} />
        ) : (
          <>
            {sessao && (
              <div className="flex items-center justify-between bg-slate-900 px-4 py-1.5 text-xs text-slate-200">
                <span className="truncate">
                  {sessao.nome} · {LABEL_PERFIL[sessao.perfil] ?? sessao.perfil}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href="/trocar-senha"
                    className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    Trocar senha
                  </Link>
                  <LogoutButton />
                </div>
              </div>
            )}
            {children}
          </>
        )}
      </body>
    </html>
  );
}
