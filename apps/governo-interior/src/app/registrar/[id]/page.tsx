"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  excluirSituacao,
  listarPrincipios,
  listarValores,
  obterSituacao,
  salvarSituacao,
} from "@/lib/db";
import { dataInputParaIso, isoParaDataInput } from "@/lib/date";
import type { ClassificacaoEvidencia, Principio, Situacao, Valor } from "@/lib/types";
import { LABEL_CLASSIFICACAO } from "@/lib/types";
import {
  AreaTexto,
  BotaoPrimario,
  BotaoSecundario,
  Cabecalho,
  Campo,
  Chip,
  Carregando,
  Rotulo,
  Selecao,
} from "@/components/ui";

export default function DetalheSituacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [situacao, setSituacao] = useState<Situacao | null | undefined>(undefined);
  const [valores, setValores] = useState<Valor[]>([]);
  const [principios, setPrincipios] = useState<Principio[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, v, p] = await Promise.all([obterSituacao(id), listarValores(), listarPrincipios()]);
      setSituacao(s ?? null);
      setValores(v);
      setPrincipios(p);
    })();
  }, [id]);

  if (situacao === undefined) return <Carregando />;
  if (situacao === null) {
    return (
      <div className="px-4 py-10 text-center text-sm text-[#8892a8]">
        Situação não encontrada.
        <div className="mt-4">
          <BotaoSecundario onClick={() => router.push("/")}>Voltar ao início</BotaoSecundario>
        </div>
      </div>
    );
  }

  function atualizar<K extends keyof Situacao>(chave: K, valor: Situacao[K]) {
    setSituacao((s) => (s ? { ...s, [chave]: valor } : s));
  }

  function alternarClassificacao(c: ClassificacaoEvidencia) {
    if (!situacao) return;
    const atuais = situacao.classificacoes.includes(c)
      ? situacao.classificacoes.filter((x) => x !== c)
      : [...situacao.classificacoes, c];
    atualizar("classificacoes", atuais);
  }

  async function salvar() {
    if (!situacao) return;
    setSalvando(true);
    try {
      await salvarSituacao(situacao);
      router.push("/");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!situacao) return;
    if (!confirm("Excluir esta situação registrada? Essa ação não pode ser desfeita.")) return;
    await excluirSituacao(situacao.id);
    router.push("/");
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Cabecalho titulo="Situação registrada" subtitulo="Reveja e ajuste sempre que precisar" voltarPara="/" />

      <div className="mt-4 space-y-4">
        <div>
          <Rotulo>Data do fato</Rotulo>
          <Campo type="date" value={isoParaDataInput(situacao.data)} onChange={(e) => atualizar("data", dataInputParaIso(e.target.value))} />
        </div>

        <div>
          <Rotulo>Fato — o que realmente aconteceu?</Rotulo>
          <AreaTexto rows={3} value={situacao.fato} onChange={(e) => atualizar("fato", e.target.value)} />
        </div>

        <div>
          <Rotulo>Emoção — o que pensei e senti?</Rotulo>
          <AreaTexto rows={2} value={situacao.emocao} onChange={(e) => atualizar("emocao", e.target.value)} />
        </div>

        <div>
          <Rotulo>Valor envolvido</Rotulo>
          <Selecao value={situacao.valorId ?? ""} onChange={(e) => atualizar("valorId", e.target.value || null)}>
            <option value="">Nenhum / não se aplica</option>
            {valores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Selecao>
        </div>

        <div>
          <Rotulo>Princípio envolvido</Rotulo>
          <Selecao value={situacao.principioId ?? ""} onChange={(e) => atualizar("principioId", e.target.value || null)}>
            <option value="">Nenhum / não se aplica</option>
            {principios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icone} {p.nome}
              </option>
            ))}
          </Selecao>
        </div>

        <div>
          <Rotulo>Decisão — o que decidi?</Rotulo>
          <AreaTexto rows={2} value={situacao.decisao} onChange={(e) => atualizar("decisao", e.target.value)} />
        </div>

        <div>
          <Rotulo>Ação — o que realmente fiz?</Rotulo>
          <AreaTexto rows={2} value={situacao.acao} onChange={(e) => atualizar("acao", e.target.value)} />
        </div>

        <div>
          <Rotulo>Resultado — o que aconteceu?</Rotulo>
          <AreaTexto rows={2} value={situacao.resultado} onChange={(e) => atualizar("resultado", e.target.value)} />
        </div>

        <div>
          <Rotulo>Autoavaliação</Rotulo>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => atualizar("coerente", true)}
              className={`min-h-11 rounded-xl border px-4 text-left text-sm ${situacao.coerente === true ? "border-[#7a8c5f] bg-[#7a8c5f]/20 text-[#b7c79c]" : "border-white/15 text-[#cdd5e3]"}`}
            >
              Fui coerente com o que acredito
            </button>
            <button
              onClick={() => atualizar("coerente", false)}
              className={`min-h-11 rounded-xl border px-4 text-left text-sm ${situacao.coerente === false ? "border-[#c17a5a] bg-[#c17a5a]/20 text-[#e0a98a]" : "border-white/15 text-[#cdd5e3]"}`}
            >
              Agi diferente do que acredito
            </button>
            <button
              onClick={() => atualizar("coerente", null)}
              className={`min-h-11 rounded-xl border px-4 text-left text-sm ${situacao.coerente === null ? "border-[#c8a24d] bg-[#c8a24d]/15 text-[#e8c877]" : "border-white/15 text-[#cdd5e3]"}`}
            >
              Não avaliado
            </button>
          </div>
        </div>

        <div>
          <Rotulo>Aprendizado — o que essa situação revelou sobre mim?</Rotulo>
          <AreaTexto rows={2} value={situacao.aprendizado} onChange={(e) => atualizar("aprendizado", e.target.value)} />
        </div>

        <div>
          <Rotulo>Correção — o que farei diferente da próxima vez?</Rotulo>
          <AreaTexto rows={2} value={situacao.correcao} onChange={(e) => atualizar("correcao", e.target.value)} />
        </div>

        <div>
          <Rotulo>Ambiente</Rotulo>
          <Campo value={situacao.ambiente} onChange={(e) => atualizar("ambiente", e.target.value)} />
        </div>

        <div>
          <Rotulo>Classificações (revise sempre que quiser)</Rotulo>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LABEL_CLASSIFICACAO) as ClassificacaoEvidencia[]).map((c) => (
              <button key={c} onClick={() => alternarClassificacao(c)}>
                <Chip tom={situacao.classificacoes.includes(c) ? (c === "CONTRADICAO" ? "terracota" : c === "EVOLUCAO" ? "verde" : "ouro") : "neutro"}>
                  {situacao.classificacoes.includes(c) ? "✓ " : ""}
                  {LABEL_CLASSIFICACAO[c]}
                </Chip>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <BotaoPrimario onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </BotaoPrimario>
        <button onClick={excluir} className="min-h-11 w-full text-center text-sm text-[#c17a5a]">
          Excluir situação
        </button>
      </div>
    </div>
  );
}
