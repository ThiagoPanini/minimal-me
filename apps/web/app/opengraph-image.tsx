import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { grain, openingLayers } from "@/design-system/illustrations";

// A imagem de compartilhamento, gerada no build: a abertura recortada em 1200 × 630, com o céu
// e as dunas presos no ponto da tela larga, como a Home os mostra, e o grão por cima. O
// `next/og` compõe as camadas a partir das cópias em PNG que o passo das ilustrações grava,
// porque ele não desenha WebP. O PNG que ele devolve passa de 900 KB; a imagem sai em JPEG,
// com cerca de 100 KB, para a prévia não esbarrar no limite de tamanho de quem a mostra.

// O export estático pede que a rota diga que é gerada uma vez, no build.
export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
// O texto alternativo da camada que tem figura: as dunas. O céu é fundo.
export const alt = openingLayers
  .map((layer) => layer.alt)
  .filter(Boolean)
  .join(" ");

// O `next build` roda em `apps/web`.
const openingPngDir = path.join(process.cwd(), "design-system/generated/opening");
const illustrationsDir = path.join(process.cwd(), "../../docs/design/system/assets/Illustrations");

async function pngDataUrl(file: string): Promise<string> {
  return `data:image/png;base64,${await readFile(file, "base64")}`;
}

// Onde a camada fica no recorte: cobre o quadro inteiro, presa no ponto da tela larga.
function cover({ image, position }: (typeof openingLayers)[number]) {
  const scale = Math.max(size.width / image.width, size.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    position: "absolute",
    left: (size.width - width) * position.wide.x,
    top: (size.height - height) * position.wide.y,
    width,
    height,
  } as const;
}

export default async function OpeningShareImage() {
  const layers = await Promise.all(
    openingLayers.map(async (layer) => ({
      id: layer.id,
      src: await pngDataUrl(path.join(openingPngDir, `${layer.id}.png`)),
      style: cover(layer),
    })),
  );
  const grainTile = await pngDataUrl(path.join(illustrationsDir, grain.file));

  const png = new ImageResponse(
    <div style={{ display: "flex", position: "relative", width: "100%", height: "100%" }}>
      {layers.map(({ id, src, style }) => (
        // biome-ignore lint/performance/noImgElement: o next/og desenha a imagem a partir do <img>.
        <img key={id} src={src} alt="" width={style.width} height={style.height} style={style} />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${grainTile})`,
          backgroundSize: `${grain.tile} ${grain.tile}`,
          opacity: grain.opacity,
          mixBlendMode: grain.blend as "multiply",
        }}
      />
    </div>,
    size,
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": contentType } });
}
