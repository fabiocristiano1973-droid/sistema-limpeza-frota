"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarPrincipio, listarValores } from "@/lib/governo-interior/db";
import { PALETA_PRINCIPIOS } from "@/lib/governo-interior/tema";
import { PILARES_CODIGO, type PilarCodigo } from "@/lib/governo-interior/types";
import type { Valor } from "@/lib/governo-interior/types";
import { AreaTexto, BotaoPrimario, Cabecalho, Campo, ListaEditavel, Rotulo, Selecao } from "@/components/governo-interior/ui";

const ICONES_SUGERIDOS = ["🧭", "⚓", "🛡️", "🔥", "🌱", "⚖️", "🗝️", "🏔️", "🕊️", "☀️"];

export default function NovoPrincipioPage() {
  const router = useRouter();
  const [valores, setValores] = useState<Valor[]>([]);
  const [nome, setNome] = useState("");
  const [fraseCentral, setFraseCentral] = useState("");
  const [icone, setIcone] = useState(ICONES_SUGERIDOS[0]);
  const [cor, setCor] = useState(PALETA_PRINCIPIOS[0].valor);
  const [pilar, setPilar] = useState<PilarCodigo>("NO_QUE_EU_ACREDITO");
  const [valorSustentaId, setValorSustentaId] = useState("");
  const [significado, setSignificado] = useState("");
  const [fortalecem, setFortalecem] = useState<string[]>([]);
  const [violam, setViolam] = useState<string[]>([]);
  const [ambiente, setAmbiente] = useState("");
  const [limites, setLimites] = useState("");
  const [regraDecisao, setRegraDecisao] = useState("");
  const [acaoPratica, setAcaoPratica] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarValores().then(setValores);
  }, []);

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const novo = await criarPrincipio({
        nome: nome.trim(),
        fraseCentral,
        icone,
        cor,
        pilar,
        valorSustentaId: valorSustentaId || null,
        significado,
        comportamentosQueFortalecem: fortalecem,
        comportamentosQueViolam: violam,
        ambienteQuePrecisoConstruir: ambiente,
        limites,
        regraDecisao,
        acaoPratica,
      });
      router.push(`/governo-interior/principios/${novo.id}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Novo princípio" voltarPara="/governo-interior/principios" />

      <div className="mt-4 space-y-4">
        <div>
          <Rotulo>Princípio</Rotulo>
          <Campo autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: A verdade em primeiro lugar" />
        </div>

        <div>
          <Rotulo>Frase central</Rotulo>
          <Campo value={fraseCentral} onChange={(e) => setFraseCentral(e.target.value)} placeholder="Uma frase curta e memorável" />
        </div>

        <div>
          <Rotulo>Ícone</Rotulo>
          <div className="flex flex-wrap gap-2">
            {ICONES_SUGERIDOS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcone(ic)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl ${icone === ic ? "border-[#c8a24d] bg-[#c8a24d]/15" : "border-white/15"}`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Rotulo>Cor de identificação</Rotulo>
          <div className="flex flex-wrap gap-2">
            {PALETA_PRINCIPIOS.map((p) => (
              <button
                key={p.valor}
                onClick={() => setCor(p.valor)}
                title={p.nome}
                className={`h-9 w-9 rounded-full border-2 ${cor === p.valor ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: p.valor }}
              />
            ))}
          </div>
        </div>

        <div>
          <Rotulo>Pilar do código pessoal</Rotulo>
          <Selecao value={pilar} onChange={(e) => setPilar(e.target.value as PilarCodigo)}>
            {PILARES_CODIGO.map((p) => (
              <option key={p.chave} value={p.chave}>
                {p.titulo}
              </option>
            ))}
          </Selecao>
        </div>

        <div>
          <Rotulo>Valor que sustenta este princípio</Rotulo>
          <Selecao value={valorSustentaId} onChange={(e) => setValorSustentaId(e.target.value)}>
            <option value="">Nenhum / não se aplica</option>
            {valores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Selecao>
        </div>

        <div>
          <Rotulo>O que significa para mim</Rotulo>
          <AreaTexto rows={2} value={significado} onChange={(e) => setSignificado(e.target.value)} />
        </div>

        <div>
          <Rotulo>Comportamentos que fortalecem</Rotulo>
          <ListaEditavel itens={fortalecem} onChange={setFortalecem} />
        </div>

        <div>
          <Rotulo>Comportamentos que violam</Rotulo>
          <ListaEditavel itens={violam} onChange={setViolam} />
        </div>

        <div>
          <Rotulo>Ambiente que preciso construir</Rotulo>
          <AreaTexto rows={2} value={ambiente} onChange={(e) => setAmbiente(e.target.value)} />
        </div>

        <div>
          <Rotulo>Limites</Rotulo>
          <AreaTexto rows={2} value={limites} onChange={(e) => setLimites(e.target.value)} />
        </div>

        <div>
          <Rotulo>Regra de decisão</Rotulo>
          <AreaTexto rows={2} value={regraDecisao} onChange={(e) => setRegraDecisao(e.target.value)} placeholder="Quando X acontecer, eu…" />
        </div>

        <div>
          <Rotulo>Ação prática</Rotulo>
          <AreaTexto rows={2} value={acaoPratica} onChange={(e) => setAcaoPratica(e.target.value)} />
        </div>
      </div>

      <div className="mt-6">
        <BotaoPrimario onClick={salvar} disabled={salvando || !nome.trim()}>
          {salvando ? "Salvando…" : "Criar princípio"}
        </BotaoPrimario>
      </div>
    </div>
  );
}
