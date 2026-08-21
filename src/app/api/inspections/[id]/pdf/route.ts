import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { sessaoDaApi } from "@/lib/auth/dal";
import { getRepository } from "@/lib/repository";
import { RelatorioInspecaoPdf } from "@/lib/pdf/RelatorioInspecaoPdf";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sessao = await sessaoDaApi();
  if (!sessao) {
    return NextResponse.json({ erro: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const repo = getRepository();
  const inspecao = await repo.getById(id);
  if (!inspecao) {
    return NextResponse.json({ erro: "Inspeção não encontrada." }, { status: 404 });
  }

  const buffer = await renderToBuffer(RelatorioInspecaoPdf({ inspecao }));

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="inspecao-${inspecao.prefixo}-${inspecao.id.slice(0, 8)}.pdf"`,
    },
  });
}
