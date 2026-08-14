import { TipoEvidencia } from "@/types/inspection";

export default function EvidenciaPreview({
  url,
  tipo,
  className,
}: {
  url: string;
  tipo?: TipoEvidencia;
  className?: string;
}) {
  if (tipo === "VIDEO") {
    return <video src={url} controls className={className} />;
  }
  // Registros antigos não têm evidenciaTipo e sempre eram foto.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Evidência da não conformidade" className={className} />;
}
