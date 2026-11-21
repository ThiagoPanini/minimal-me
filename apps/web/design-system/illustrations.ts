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

// O grão que cobre toda imagem: o ladrilho de `assets/Texture`, com o tamanho, a opacidade
// e a mistura de `illustrations.json`.
export const grainStyle: CSSProperties = {
  backgroundImage: `url(${grainTile.src})`,
  backgroundSize: `${illustrationsData.grain.tile} ${illustrationsData.grain.tile}`,
  opacity: illustrationsData.grain.opacity,
  mixBlendMode: illustrationsData.grain.blend as CSSProperties["mixBlendMode"],
};
