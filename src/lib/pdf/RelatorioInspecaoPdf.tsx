import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { Inspecao, ItemResultado, StatusItem } from "@/types/inspection";
import { categoriasDoCatalogo } from "@/lib/checklist-catalog";

// Usa a fonte padrão (Helvetica, uma das 14 fontes-base do PDF, embutida no
// leitor) em vez de registrar uma fonte externa via URL — evita depender de
// uma busca de rede (Google Fonts) toda vez que um PDF é gerado, o que seria
// um ponto de falha extra num ambiente serverless. Helvetica usa WinAnsi por
// padrão no @react-pdf/renderer, que já cobre os acentos do português.
const CORES: Record<StatusItem, string> = {
  CONFORME: "#059669",
  NAO_CONFORME: "#dc2626",
  NA: "#64748b",
};

const LABEL_STATUS: Record<StatusItem, string> = {
  CONFORME: "Conforme",
  NAO_CONFORME: "Não Conforme",
  NA: "N/A",
};

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#0f172a" },
  tituloDoc: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitulo: { fontSize: 10, color: "#64748b", marginBottom: 14 },
  faixaResultado: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
    textAlign: "center",
  },
  faixaResultadoTexto: { fontSize: 14, fontWeight: 700, color: "#ffffff" },
  infoBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
  },
  infoLinha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  infoLabel: { color: "#64748b" },
  infoValor: { fontWeight: 700 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14, gap: 8 },
  statCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: "31%",
  },
  statLabel: { fontSize: 8, color: "#64748b" },
  statValor: { fontSize: 13, fontWeight: 700 },
  categoriaTitulo: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 6 },
  item: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 6,
    paddingBottom: 6,
  },
  itemLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemLabel: { flex: 1, paddingRight: 6 },
  itemStatus: { fontSize: 9, fontWeight: 700 },
  observacao: { marginTop: 3, color: "#334155", fontSize: 9 },
  foto: { marginTop: 4, width: 90, height: 90, borderRadius: 4, objectFit: "cover" },
  rodape: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

function ItemLinha({ item }: { item: ItemResultado }) {
  return (
    <View style={s.item} wrap={false}>
      <View style={s.itemLinha}>
        <Text style={s.itemLabel}>{item.label}</Text>
        <Text style={{ ...s.itemStatus, color: CORES[item.status] }}>{LABEL_STATUS[item.status]}</Text>
      </View>
      {item.respostaSelecao && <Text style={s.observacao}>Resposta: {item.respostaSelecao}</Text>}
      {item.status === "NAO_CONFORME" && (
        <Text style={s.observacao}>
          {item.criticidade === "CRITICA" ? "[CRÍTICA] " : "[NÃO CRÍTICA] "}
          {item.observacao}
        </Text>
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- Image aqui é do @react-pdf/renderer (PDF), não HTML; não tem prop alt */}
      {item.fotoDataUrl && <Image src={item.fotoDataUrl} style={s.foto} />}
    </View>
  );
}

export function RelatorioInspecaoPdf({ inspecao }: { inspecao: Inspecao }) {
  const categorias = categoriasDoCatalogo(inspecao.itens);

  return (
    <Document title={`Relatorio - Inspecao ${inspecao.prefixo}`}>
      <Page size="A4" style={s.page} wrap>
        <Text style={s.tituloDoc}>Relatório de Inspeção da Limpeza da Frota</Text>
        <Text style={s.subtitulo}>
          {inspecao.prefixo} · {inspecao.placa} — Inspeção #{inspecao.id.slice(0, 8)}
        </Text>

        <View
          style={{
            ...s.faixaResultado,
            backgroundColor: inspecao.resumo.resultado === "APROVADO" ? "#059669" : "#dc2626",
          }}
        >
          <Text style={s.faixaResultadoTexto}>{inspecao.resumo.resultado}</Text>
        </View>

        <View style={s.infoBox}>
          <InfoLinha label="Data/Hora" valor={new Date(inspecao.criadoEm).toLocaleString("pt-BR")} />
          <InfoLinha label="Garagem/Unidade" valor={inspecao.garagem} />
          <InfoLinha label="Turno" valor={inspecao.turno} />
          <InfoLinha label="Tipo de limpeza" valor={inspecao.tipoLimpeza} />
          <InfoLinha label="Inspetor" valor={inspecao.inspetor} />
          <InfoLinha label="Equipe" valor={inspecao.equipe} />
          {inspecao.criadoPorNome && <InfoLinha label="Registrado por" valor={inspecao.criadoPorNome} />}
        </View>

        <View style={s.statsRow}>
          <StatCard label="Itens avaliados" valor={inspecao.resumo.totalItens} />
          <StatCard label="% Conformidade" valor={`${inspecao.resumo.percentualConformidade}%`} />
          <StatCard label="Conformes" valor={inspecao.resumo.conformes} />
          <StatCard label="Não Conformes" valor={inspecao.resumo.naoConformes} />
          <StatCard label="N/A" valor={inspecao.resumo.naCount} />
          <StatCard label="NC Críticas" valor={inspecao.resumo.ncCriticas} />
        </View>

        {categorias.map((cat) => {
          const itensCat = inspecao.itens.filter((i) => i.categoria === cat.id);
          if (itensCat.length === 0) return null;
          return (
            <View key={cat.id}>
              <Text style={s.categoriaTitulo}>{cat.label}</Text>
              {itensCat.map((item) => (
                <ItemLinha key={item.itemId} item={item} />
              ))}
            </View>
          );
        })}

        <Text
          style={s.rodape}
          render={({ pageNumber, totalPages }) =>
            `Gerado em ${new Date().toLocaleString("pt-BR")} — página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

function InfoLinha({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={s.infoLinha}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValor}>{valor}</Text>
    </View>
  );
}

function StatCard({ label, valor }: { label: string; valor: string | number }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValor}>{valor}</Text>
    </View>
  );
}
