import { EvolucaoPeriodo } from "@/lib/dashboard";
import { formatarDiaMes } from "@/lib/date";

export default function EvolucaoChart({ dados }: { dados: EvolucaoPeriodo[] }) {
  if (dados.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>;
  }

  const largura = Math.max(280, dados.length * 50);
  const altura = 160;
  const areaGrafico = 120;
  const paddingX = 20;

  const passoX = dados.length > 1 ? (largura - paddingX * 2) / (dados.length - 1) : 0;

  const pontos = dados.map((d, idx) => {
    const x = paddingX + idx * passoX;
    const y = areaGrafico - (d.percentualAprovacao / 100) * areaGrafico;
    return { x, y, d };
  });

  const path = pontos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg width={largura} height={altura} className="mx-auto">
        <line x1={paddingX} x2={largura - paddingX} y1={areaGrafico} y2={areaGrafico} stroke="#e2e8f0" />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth={2} />
        {pontos.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="#2563eb" />
            <text x={p.x} y={p.y - 8} fontSize={9} textAnchor="middle" fill="#1e293b" fontWeight={700}>
              {p.d.percentualAprovacao}%
            </text>
            <text x={p.x} y={altura - 4} fontSize={8} textAnchor="middle" fill="#64748b">
              {formatarDiaMes(p.d.data)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
