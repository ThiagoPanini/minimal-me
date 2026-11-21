import illustrationsData from "@design-system/assets/Illustrations/illustrations.json";

// Ponte do sistema de design para a foto viva: os dados de `illustrations.json` que o desenho
// lê (o tamanho do arquivo, a luz e o movimento de cada ilustração de space, e o despertar),
// sem as imagens. Fica fora de `illustrations.ts` para entrar só no código que a foto viva
// carrega depois da primeira pintura.

// As ilustrações dos spaces, pela chave em `illustrations.json`: `frames`, `music`, `tech`, `ai`.
export type SpaceIllustrationKey = keyof typeof illustrationsData.illustrations;

// Um ponto do arquivo, de 0 a 1 sobre a largura (`u`) e a altura (`v`).
type FilePoint = { u: number; v: number };

// A luz atrás da figura, que respira com a foto acordada: o raio em fração da largura, a
// opacidade no pico e o ritmo em radianos por segundo.
export type Glow = FilePoint & { radius: number; alpha: number; rate: number };

// O movimento feito do que está pintado em cada ilustração. `x`, `y`, `w`, `h` e `r` são px
// do arquivo; `from` e `to`, ângulos em múltiplos de π; `period`, segundos.
export type SpaceMotion =
  | { kind: "shutter"; period: number; shots: (FilePoint & { width: number })[] }
  | { kind: "waves"; source: FilePoint; arcs: number; period: number; from: number; to: number }
  | { kind: "leds"; lights: (FilePoint & { r: number; rack: number })[] }
  | {
      kind: "sheets";
      atlas: string;
      atlasSize: [number, number];
      sheets: {
        x: number;
        y: number;
        w: number;
        h: number;
        patch: [number, number];
        sheet: [number, number];
      }[];
    };

const motionKinds: readonly string[] = [
  "shutter",
  "waves",
  "leds",
  "sheets",
] satisfies SpaceMotion["kind"][];

// O que a foto viva de uma ilustração desenha: o tamanho do arquivo em px, a luz e o movimento.
export type LivingPictureData = { size: [number, number]; glow: Glow; motion: SpaceMotion };

export function livingPictureData(key: SpaceIllustrationKey): LivingPictureData {
  const { size, glow, motion } = illustrationsData.illustrations[key];
  if (!motionKinds.includes(motion.kind)) {
    throw new Error(`illustrations.json: movimento "${motion.kind}" desconhecido em "${key}"`);
  }
  return { size: size as [number, number], glow, motion: motion as SpaceMotion };
}

// Quanto a foto acorda com o foco: a escala e os ritmos de entrada e de saída. A cada quadro,
// o quanto ela está acordada anda `1 − e^(−dt·rate)` do que falta (`dt` em segundos), como no
// protótipo.
export const wake: { scale: number; rateIn: number; rateOut: number } = illustrationsData.wake;
