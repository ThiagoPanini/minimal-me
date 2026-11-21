import { depth, openingLayers } from "@/design-system/illustrations";
import { PageDepth } from "@/motion/depth";
import { entranceScript } from "@/motion/entrance";

// O movimento da página (módulo 6 da spec #57), no começo da Home: a entrada da abertura e a
// revelação ao rolar, num script em linha que roda antes de a abertura ser desenhada, e a
// profundidade, que o resto do script acrescenta. Os números da profundidade vêm de
// `illustrations.json`.
export function PageMotion() {
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: o script vem do próprio código (motion/entrance.ts), montado no build. */}
      <script dangerouslySetInnerHTML={{ __html: entranceScript }} />
      <PageDepth
        layers={openingLayers.map(({ id, depth }) => ({ id, pointer: depth.pointer }))}
        picture={depth}
      />
    </>
  );
}
