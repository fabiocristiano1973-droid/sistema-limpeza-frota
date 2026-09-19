"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  criarSituacao,
  listarPrincipios,
  listarSituacoesPorPrincipio,
  listarValores,
} from "@/lib/db";
import { sugerirClassificacoes } from "@/lib/classificacao";
import { dataInputParaIso, isoParaDataInput } from "@/lib/date";
import type { ClassificacaoEvidencia, Principio, Valor } from "@/lib/types";
import { LABEL_CLASSIFICACAO } from "@/lib/types";
import {
  AreaTexto,
  BotaoPrimario,
  BotaoSecundario,
  Cabecalho,
  Campo,
  Cartao,
  Chip,
  PontosProgresso,
  Rotulo,
  Selecao,
} from "@/components/ui";

interface RascunhoSituacao {
  data: string; // AAAA-MM-DD (input date)
  fato: string;
  emocao: string;
  valorId: string;
  principioId: string;
  decisao: string;
  acao: string;
  resultado: string;
  coerente: boolean | null;
  aprendizado: string;
  correcao: string;
  ambiente: string;
}

const RASCUNHO_INICIAL: RascunhoSituacao = {
  data: isoParaDataInput(new Date().toISOString()),
  fato: "",
  emocao: "",
  valorId: "",
  principioId: "",
  decisao: "",
  acao: "",
  resultado: "",
  coerente: null,
  aprendizado: "",
  correcao: "",
  ambiente: "",
};

type TipoPasso = "texto" | "valor" | "principio" | "coerencia" | "ambiente" | "revisao";

interface Passo {
  chave: keyof RascunhoSituacao | "revisao";
  tipo: TipoPasso;
  titulo: string;
  pergunta: string;
  ajuda?: string;
  opcional?: boolean;
  multilinha?: boolean;
}

const PASSOS: Passo[] = [
  { chave: "fato", tipo: "texto", titulo: "Fato", pergunta: "O que realmente aconteceu?", multilinha: true },
  { chave: "emocao", tipo: "texto", titulo: "Emoção", pergunta: "O que pensei e senti?", multilinha: true, opcional: true },
  { chave: "valorId", tipo: "valor", titulo: "Valor envolvido", pergunta: "Qual valor estava sendo colocado à prova?", opcional: true },
  { chave: "principioId", tipo: "principio", titulo: "Princípio", pergunta: "Qual princípio deveria governar minha decisão?", opcional: true },
  { chave: "decisao", tipo: "texto", titulo: "Decisão", pergunta: "O que decidi?", multilinha: true, opcional: true },
  { chave: "acao", tipo: "texto", titulo: "Ação", pergunta: "O que realmente fiz?", multilinha: true, opcional: true },
  { chave: "resultado", tipo: "texto", titulo: "Resultado", pergunta: "O que aconteceu?", multilinha: true, opcional: true },
  {
    chave: "coerente",
    tipo: "coerencia",
    titulo: "Autoavaliação",
    pergunta: "Sua decisão e ação foram coerentes com o valor/princípio, ou você agiu diferente do que acredita?",
    opcional: true,
  },
  { chave: "aprendizado", tipo: "texto", titulo: "Aprendizado", pergunta: "O que essa situação revelou sobre mim?", multilinha: true, opcional: true },
  {
    chave: "correcao",
    tipo: "texto",
    titulo: "Correção",
    pergunta: "O que farei diferente quando algo semelhante acontecer novamente?",
    multilinha: true,
    opcional: true,
  },
  { chave: "ambiente", tipo: "ambiente", titulo: "Ambiente", pergunta: "Em que ambiente isso aconteceu?", opcional: true },
  { chave: "revisao", tipo: "revisao", titulo: "Revisão", pergunta: "Confira antes de salvar" },
];

export default function RegistrarSituacaoPage() {
  const router = useRouter();
  const [passoAtual, setPassoAtual] = useState(0);
  const [rascunho, setRascunho] = useState<RascunhoSituacao>(RASCUNHO_INICIAL);
  const [valores, setValores] = useState<Valor[]>([]);
  const [principios, setPrincipios] = useState<Principio[]>([]);
  const [classificacoes, setClassificacoes] = useState<ClassificacaoEvidencia[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const [v, p] = await Promise.all([listarValores(), listarPrincipios()]);
      setValores(v);
      setPrincipios(p);
    })();
  }, []);

  const passo = PASSOS[passoAtual];

  useEffect(() => {
    if (passo.tipo !== "revisao") return;
    (async () => {
      const historico = rascunho.principioId ? await listarSituacoesPorPrincipio(rascunho.principioId) : [];
      const sugeridas = sugerirClassificacoes(
        { coerente: rascunho.coerente, valorId: rascunho.valorId || null, principioId: rascunho.principioId || null },
        historico.map((s) => ({ coerente: s.coerente, data: s.data })),
      );
      setClassificacoes(sugeridas);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo.tipo]);

  function atualizar<K extends keyof RascunhoSituacao>(chave: K, valor: RascunhoSituacao[K]) {
    setRascunho((r) => ({ ...r, [chave]: valor }));
  }

  function podeAvancar(): boolean {
    if (passo.opcional) return true;
    if (passo.tipo === "texto") return rascunho[passo.chave as keyof RascunhoSituacao] !== "";
    return true;
  }

  function avancar() {
    if (passoAtual < PASSOS.length - 1) setPassoAtual((i) => i + 1);
  }
  function voltar() {
    if (passoAtual > 0) setPassoAtual((i) => i - 1);
  }

  function alternarClassificacao(c: ClassificacaoEvidencia) {
    setClassificacoes((atual) => (atual.includes(c) ? atual.filter((x) => x !== c) : [...atual, c]));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const nova = await criarSituacao({
        data: dataInputParaIso(rascunho.data),
        fato: rascunho.fato,
        emocao: rascunho.emocao,
        valorId: rascunho.valorId || null,
        principioId: rascunho.principioId || null,
        decisao: rascunho.decisao,
        acao: rascunho.acao,
        resultado: rascunho.resultado,
        aprendizado: rascunho.aprendizado,
        correcao: rascunho.correcao,
        ambiente: rascunho.ambiente,
        coerente: rascunho.coerente,
        classificacoes,
      });
      router.push(`/registrar/${nova.id}`);
    } finally {
      setSalvando(false);
    }
  }

  const principioSelecionado = useMemo(
    () => principios.find((p) => p.id === rascunho.principioId),
    [principios, rascunho.principioId],
  );
  const valorSelecionado = useMemo(() => valores.find((v) => v.id === rascunho.valorId), [valores, rascunho.valorId]);

  return (
    <div className="flex min-h-full flex-col px-4 pb-8 pt-4">
      <Cabecalho titulo="Registrar situação" voltarPara="/" />
      <div className="mt-4 mb-1">
        <PontosProgresso total={PASSOS.length} atual={passoAtual} />
      </div>
      <p className="mb-4 text-center text-[11px] uppercase tracking-widest text-[#8892a8]">{passo.titulo}</p>

      <div className="flex-1">
        {passo.tipo === "texto" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#f4ede0]">{passo.pergunta}</h2>
            {passo.multilinha ? (
              <AreaTexto
                autoFocus
                rows={5}
                value={rascunho[passo.chave as keyof RascunhoSituacao] as string}
                onChange={(e) => atualizar(passo.chave as keyof RascunhoSituacao, e.target.value as never)}
                placeholder="Escreva livremente…"
              />
            ) : (
              <Campo
                autoFocus
                value={rascunho[passo.chave as keyof RascunhoSituacao] as string}
                onChange={(e) => atualizar(passo.chave as keyof RascunhoSituacao, e.target.value as never)}
              />
            )}
            {passo.chave === "fato" && (
              <div className="mt-4">
                <Rotulo>Data do fato</Rotulo>
                <Campo type="date" value={rascunho.data} onChange={(e) => atualizar("data", e.target.value)} />
              </div>
            )}
          </div>
        )}

        {passo.tipo === "valor" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#f4ede0]">{passo.pergunta}</h2>
            <Selecao value={rascunho.valorId} onChange={(e) => atualizar("valorId", e.target.value)}>
              <option value="">Nenhum / não se aplica</option>
              {valores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </Selecao>
          </div>
        )}

        {passo.tipo === "principio" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#f4ede0]">{passo.pergunta}</h2>
            {principios.length === 0 ? (
              <p className="text-sm text-[#8892a8]">Nenhum princípio cadastrado ainda — pode pular esta etapa.</p>
            ) : (
              <Selecao value={rascunho.principioId} onChange={(e) => atualizar("principioId", e.target.value)}>
                <option value="">Nenhum / não se aplica</option>
                {principios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icone} {p.nome}
                  </option>
                ))}
              </Selecao>
            )}
          </div>
        )}

        {passo.tipo === "coerencia" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#f4ede0]">{passo.pergunta}</h2>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => atualizar("coerente", true)}
                className={`min-h-12 rounded-xl border px-4 text-left text-sm font-medium ${
                  rascunho.coerente === true
                    ? "border-[#7a8c5f] bg-[#7a8c5f]/20 text-[#b7c79c]"
                    : "border-white/15 text-[#cdd5e3]"
                }`}
              >
                Fui coerente com o que acredito
              </button>
              <button
                onClick={() => atualizar("coerente", false)}
                className={`min-h-12 rounded-xl border px-4 text-left text-sm font-medium ${
                  rascunho.coerente === false
                    ? "border-[#c17a5a] bg-[#c17a5a]/20 text-[#e0a98a]"
                    : "border-white/15 text-[#cdd5e3]"
                }`}
              >
                Agi diferente do que acredito
              </button>
              <button
                onClick={() => atualizar("coerente", null)}
                className={`min-h-12 rounded-xl border px-4 text-left text-sm font-medium ${
                  rascunho.coerente === null ? "border-[#c8a24d] bg-[#c8a24d]/15 text-[#e8c877]" : "border-white/15 text-[#cdd5e3]"
                }`}
              >
                Prefiro não avaliar agora
              </button>
            </div>
          </div>
        )}

        {passo.tipo === "ambiente" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#f4ede0]">{passo.pergunta}</h2>
            <Campo
              autoFocus
              value={rascunho.ambiente}
              onChange={(e) => atualizar("ambiente", e.target.value)}
              placeholder="Ex.: trabalho, casa, trânsito, redes sociais…"
            />
          </div>
        )}

        {passo.tipo === "revisao" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#f4ede0]">{passo.pergunta}</h2>
            <Cartao className="space-y-2 text-sm">
              <p>
                <span className="text-[#8892a8]">Fato: </span>
                {rascunho.fato || "—"}
              </p>
              {valorSelecionado && (
                <p>
                  <span className="text-[#8892a8]">Valor: </span>
                  {valorSelecionado.nome}
                </p>
              )}
              {principioSelecionado && (
                <p>
                  <span className="text-[#8892a8]">Princípio: </span>
                  {principioSelecionado.nome}
                </p>
              )}
            </Cartao>

            <p className="mb-2 mt-4 text-sm font-medium text-[#cdd5e3]">
              Classificação sugerida (toque para ajustar):
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LABEL_CLASSIFICACAO) as ClassificacaoEvidencia[]).map((c) => (
                <button key={c} onClick={() => alternarClassificacao(c)}>
                  <Chip tom={classificacoes.includes(c) ? (c === "CONTRADICAO" ? "terracota" : c === "EVOLUCAO" ? "verde" : "ouro") : "neutro"}>
                    {classificacoes.includes(c) ? "✓ " : ""}
                    {LABEL_CLASSIFICACAO[c]}
                  </Chip>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#8892a8]">
              Uma contradição é informação para correção — não é um julgamento sobre quem você é. Você pode rever
              essas classificações a qualquer momento.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {passoAtual > 0 && <BotaoSecundario onClick={voltar}>Voltar</BotaoSecundario>}
        {passo.tipo === "revisao" ? (
          <BotaoPrimario onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar situação"}
          </BotaoPrimario>
        ) : (
          <BotaoPrimario onClick={avancar} disabled={!podeAvancar()}>
            {passo.opcional && !rascunho[passo.chave as keyof RascunhoSituacao] ? "Pular" : "Continuar"}
          </BotaoPrimario>
        )}
      </div>
    </div>
  );
}
