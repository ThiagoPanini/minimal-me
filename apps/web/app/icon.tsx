import { readFile } from "node:fs/promises";
import path from "node:path";
import designTokens from "@design-system/tokens.json";
import { ImageResponse } from "next/og";

// O ícone da aba, gerado no build a partir da marca: a variante sobre `ground` (anel em `mist`,
// ponto em `light`), sem mudar o desenho, num quadrado `ground`. Assim ele aparece em aba clara
// e em aba escura. A marca ocupa 26 de cada 32px, como os 26px dela na abertura.

// O export estático pede que a rota diga que é gerada uma vez, no build.
export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// O `next build` roda em `apps/web`.
const markFile = path.join(process.cwd(), "../../docs/design/system/assets/Brand/mark-light.svg");
const markSize = (size.width * 26) / 32;
// Do tokens.json direto: a ponte dos tokens carrega as fontes, que uma rota de imagem não lê.
const ground = designTokens.color.tokens.find(({ name }) => name === "ground")?.value;

export default async function MarkIcon() {
  const mark = `data:image/svg+xml;base64,${await readFile(markFile, "base64")}`;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: ground,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: o next/og desenha a imagem a partir do <img>. */}
      <img src={mark} alt="" width={markSize} height={markSize} />
    </div>,
    size,
  );
}
