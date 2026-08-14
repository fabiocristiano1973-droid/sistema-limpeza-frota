import { RankingNC } from "@/lib/dashboard";

export default function ParetoChart({ dados }: { dados: RankingNC[] }) {
  if (dados.length === 0) {
    return <p className="text-sm text-slate-400">Sem não conformidades registradas ainda.</p>;
  }

  const larguraBarra = 56;
  const gap = 14;
  const paddingX = 8;
  const largura = dados.length * (larguraBarra + gap) + paddingX * 2;
  const altura = 220;
  const areaGrafico = 160;
  const maxOcorrencias = Math.max(...dados.map((d) => d.ocorrencias));

  const pontosLinha = dados.map((d, idx) => {
    const x = paddingX + idx * (larguraBarra + gap) + larguraBarra / 2;
    const y = areaGrafico - (d.percentualAcumulado / 100) * areaGrafico;
    return { x, y };
  });

  const pathLinha = pontosLinha.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg width={largura} height={altura} className="mx-auto">
        {/* Linha guia 80% */}
        <line
          x1={0}
          x2={largura}
          y1={areaGrafico - 0.8 * areaGrafico}
          y2={areaGrafico - 0.8 * areaGrafico}
          stroke="#cbd5e1"
          strokeDasharray="4 4"
        />
        <text x={largura - 4} y={areaGrafico - 0.8 * areaGrafico - 4} fontSize={9} textAnchor="end" fill="#94a3b8">
          80%
        </text>

        {dados.map((d, idx) => {
          const x = paddingX + idx * (larguraBarra + gap);
          const alturaBarra = (d.ocorrencias / maxOcorrencias) * areaGrafico;
          const y = areaGrafico - alturaBarra;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={larguraBarra} height={alturaBarra} rx={4} fill="#2563eb" />
              <text x={x + larguraBarra / 2} y={y - 5} fontSize={10} textAnchor="middle" fill="#1e293b" fontWeight={700}>
                {d.ocorrencias}
              </text>
            </g>
          );
        })}

        <path d={pathLinha} fill="none" stroke="#f59e0b" strokeWidth={2} />
        {pontosLinha.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r={3} fill="#f59e0b" />
        ))}

        {dados.map((d, idx) => {
          const x = paddingX + idx * (larguraBarra + gap) + larguraBarra / 2;
          return (
            <text
              key={d.label}
              x={x}
              y={altura - 6}
              fontSize={9}
              textAnchor="middle"
              fill="#475569"
            >
              {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
