import illustrationsData from "@design-system/assets/Illustrations/illustrations.json";
import grainTile from "@design-system/assets/Texture/grain.png";
import type { CSSProperties } from "react";
import { illustrationSources } from "./generated/illustrations";

// Ponte do sistema de design: o `illustrations.json` chega tipado a quem desenha, e cada
// ilustração chega com as larguras responsivas que `generate-illustrations.ts` gerou.

type IllustrationId = keyof typeof illustrationSources;

export type ResponsiveImage = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
};

function isShown(id: string): id is IllustrationId {
  return Object.hasOwn(illustrationSources, id);
}

// As larguras de uma ilustração que passou pelo passo do build: o `src` é a maior, o próprio
// arquivo do sistema; o `srcSet` lista todas.
export function responsiveImage(id: string): ResponsiveImage {
  if (!isShown(id)) {
    throw new Error(`A ilustração "${id}" não passou por design-system/generate-illustrations.ts`);
  }
  const sources = illustrationSources[id];
  const largest = sources[sources.length - 1];
  return {
    src: largest.src,
    srcSet: sources.map(({ src, width }) => `${src} ${width}w`).join(", "),
    width: largest.width,
    height: largest.height,
  };
}

type Point = { x: number; y: number };

export type OpeningLayer = {
  id: string;
  alt: string;
  // Onde a camada fica presa, de 0 a 1: na tela larga e até 760px.
  position: { wide: Point; narrow: Point };
  image: ResponsiveImage;
};

// As camadas da abertura, de trás para a frente: o céu e as dunas.
export const openingLayers: OpeningLayer[] = illustrationsData.opening.layers.map(
  ({ id, alt, position }) => ({ id, alt, position, image: responsiveImage(id) }),
);

// As ilustrações dos spaces, pela chave em `illustrations.json`: `frames`, `music`, `tech`, `ai`.
export type SpaceIllustrationKey = keyof typeof illustrationsData.illustrations;

// Onde a imagem fica presa no quadro, de 0 a 1 (`y: 1` a prende pelo pé), e o zoom, a partir de 1.
export type Crop = { x: number; y: number; zoom: number };

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

export type SpaceIllustration = {
  key: SpaceIllustrationKey;
  alt: string;
  // O recorte na fresta: na fileira larga e na empilhada, até 900px.
  crop: { wide: Crop; stacked: Crop };
  glow: Glow;
  motion: SpaceMotion;
  image: ResponsiveImage;
};

const motionKinds: readonly string[] = [
  "shutter",
  "waves",
  "leds",
  "sheets",
] satisfies SpaceMotion["kind"][];

// A ilustração de um space, com o texto alternativo, o recorte por largura, a luz, o
// movimento e as larguras responsivas.
export function spaceIllustration(key: SpaceIllustrationKey): SpaceIllustration {
  const { alt, crop, glow, motion } = illustrationsData.illustrations[key];
  if (!motionKinds.includes(motion.kind)) {
    throw new Error(`illustrations.json: movimento "${motion.kind}" desconhecido em "${key}"`);
  }
  return {
    key,
    alt,
    crop: crop.slit,
    glow,
    motion: motion as SpaceMotion,
    image: responsiveImage(key),
  };
}

// A chave de luz das fotos dos spaces: o filtro em repouso e com foco.
export const grade: { rest: string; focus: string } = illustrationsData.grade;

// Quanto a foto acorda com o foco (escala e ritmos de entrada e saída) e a profundidade com a
// rolagem e com o ponteiro, em px.
export const wake: { scale: number; rateIn: number; rateOut: number } = illustrationsData.wake;
export const depth: { scroll: number; pointer: number } = illustrationsData.depth;

// O grão que cobre toda imagem, como `illustrations.json` o descreve: o arquivo do ladrilho
// (relativo a `assets/Illustrations`), o tamanho, a opacidade e a mistura.
export const grain: { file: string; tile: string; opacity: number; blend: string } =
  illustrationsData.grain;

// O grão como estilo: o ladrilho de `assets/Texture`, servido pela Home.
export const grainStyle: CSSProperties = {
  backgroundImage: `url(${grainTile.src})`,
  backgroundSize: `${grain.tile} ${grain.tile}`,
  opacity: grain.opacity,
  mixBlendMode: grain.blend as CSSProperties["mixBlendMode"],
};
