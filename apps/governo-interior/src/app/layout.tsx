import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import LembretesLocais from "@/components/LembretesLocais";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "Governo Interior",
    template: "%s · Governo Interior",
  },
  description:
    "Governo Interior — Princípios em Ação: uma ferramenta pessoal para descobrir, testar, praticar e incorporar valores e princípios no dia a dia.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Governo Interior",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="h-full font-sans">
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0b1220] text-[#f4ede0]">
          <RegistrarServiceWorker />
          <LembretesLocais />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
