"use client";

/**
 * Redimensiona e recomprime uma imagem no próprio navegador antes de anexar
 * à inspeção. Necessário porque a evidência é guardada como base64 dentro do
 * JSON da inspeção (não em armazenamento de arquivo separado) — uma foto
 * direto da câmera de um celular moderno (3-8MB) vira um payload maior
 * ainda em base64, e passa do limite de tamanho de corpo de requisição da
 * Vercel (~4.5MB) somado a duas ou três fotos na mesma inspeção. Foi a causa
 * real do bug relatado em campo "se inserir mais de 3 fotos não salva a
 * inspeção" (checklist 21-25/08/2026): a inspeção inteira era perdida
 * silenciosamente, sem nenhum aviso claro do motivo.
 */
export function comprimirImagem(
  file: File,
  opts: { maxDim?: number; qualidade?: number } = {}
): Promise<string> {
  const maxDim = opts.maxDim ?? 1600;
  const qualidade = opts.qualidade ?? 0.72;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const maior = Math.max(width, height);
      if (maior > maxDim) {
        const escala = maxDim / maior;
        width = Math.round(width * escala);
        height = Math.round(height * escala);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível processar a imagem neste navegador."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", qualidade));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler o arquivo de imagem."));
    };

    img.src = url;
  });
}
