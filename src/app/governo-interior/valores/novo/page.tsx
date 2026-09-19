"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarValor } from "@/lib/governo-interior/db";
import { AreaTexto, BotaoPrimario, Cabecalho, Campo, ListaEditavel, Rotulo } from "@/components/governo-interior/ui";

export default function NovoValorPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [demonstram, setDemonstram] = useState<string[]>([]);
  const [contradizem, setContradizem] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const novo = await criarValor({
        nome: nome.trim(),
        objetivo,
        status: "EM_VALIDACAO",
        comportamentosQueDemonstram: demonstram,
        comportamentosQueContradizem: contradizem,
        conflitosComOutrosValores: "",
        aprendizados: "",
      });
      router.push(`/governo-interior/valores/${novo.id}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Novo valor" voltarPara="/governo-interior/valores" />
      <div className="mt-4 space-y-4">
        <div>
          <Rotulo>Valor</Rotulo>
          <Campo autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Coragem" />
        </div>
        <div>
          <Rotulo>Objetivo</Rotulo>
          <AreaTexto rows={2} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="O que esse valor busca na sua vida?" />
        </div>
        <div>
          <Rotulo>Comportamentos que demonstram este valor</Rotulo>
          <ListaEditavel itens={demonstram} onChange={setDemonstram} />
        </div>
        <div>
          <Rotulo>Comportamentos que contradizem este valor</Rotulo>
          <ListaEditavel itens={contradizem} onChange={setContradizem} />
        </div>
      </div>
      <div className="mt-6">
        <BotaoPrimario onClick={salvar} disabled={salvando || !nome.trim()}>
          {salvando ? "Salvando…" : "Criar valor"}
        </BotaoPrimario>
      </div>
    </div>
  );
}
