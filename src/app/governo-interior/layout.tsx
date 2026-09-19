import type { Metadata, Viewport } from "next";
import RegistrarServiceWorker from "@/components/governo-interior/RegistrarServiceWorker";
import LembretesLocais from "@/components/governo-interior/LembretesLocais";
import BottomNav from "@/components/governo-interior/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "Governo Interior",
    template: "%s · Governo Interior",
  },
  description:
    "Governo Interior — Princípios em Ação: uma ferramenta pessoal para descobrir, testar, praticar e incorporar valores e princípios no dia a dia.",
  manifest: "/governo-interior/manifest.webmanifest",
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

export default function GovernoInteriorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0b1220] text-[#f4ede0]">
      <RegistrarServiceWorker />
      <LembretesLocais />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      <BottomNav />
    </div>
  );
}
