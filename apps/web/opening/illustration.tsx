import type { CSSProperties } from "react";
import { mediaQueries } from "@/app/media";
import { Mark } from "@/components/Mark";
import { grainStyle, type OpeningLayer, openingLayers } from "@/design-system/illustrations";

// A ilustração da abertura: o céu e as dunas em duas camadas, a descida para `ground`
// no pé, o grão por cima e a marca em `ink` no canto superior esquerdo, como link para
// o início. Os dados de cada camada (posição e texto alternativo) vêm de `illustrations.json`.
// Não é componente do sistema de design: é a abertura da Home, que a 404 reaproveita só com o
// céu, e por isso mora em `opening/`, fora de `components/`.
//
// Na Home, a abertura ocupa a altura da tela que o Masthead deixa (até 900px, uma altura
// própria), e a marca leva ao topo. Na 404, só o céu, sem as dunas e sem a figura: a abertura
// ocupa a altura que a página deixa em qualquer largura, e a marca leva à Home.
//
// Com movimento, na Home, a ilustração espera as duas camadas (`data-opening-layer`), por no
// máximo 5s, e entra como no protótipo (motion/entrance.ts): o céu se aproxima em 2,4s, e as
// dunas sobem em 1,9s, 150ms depois; a marca aparece por último. Com o ponteiro, cada camada
// se desloca (motion/depth.tsx), presa a 50% 90% quando chega 2% mais perto.

const layerEntrances: Record<string, string> = {
  sky: "opening-arrived:[animation:sky-in_2.4s_var(--ease-out)_backwards]",
  dunes: "opening-arrived:[animation:dunes-in_1.9s_var(--ease-out)_.15s_backwards]",
};

const percent = ({ x, y }: { x: number; y: number }) => `${x * 100}% ${y * 100}%`;

function positionStyle({ position }: OpeningLayer): CSSProperties {
  return {
    "--position-wide": percent(position.wide),
    "--position-narrow": percent(position.narrow),
  } as CSSProperties;
}

const pages = {
  home: {
    layers: openingLayers,
    markHref: "#top",
    height: "stacked:h-[min(66svh,720px)] stacked:min-h-[360px] stacked:flex-none",
  },
  "not-found": {
    layers: openingLayers.filter(({ id }) => id === "sky"),
    markHref: "/",
    height: "",
  },
} as const;

type OpeningIllustrationProps = {
  page: keyof typeof pages;
};

export function OpeningIllustration({ page }: OpeningIllustrationProps) {
  const { layers, markHref, height } = pages[page];
  return (
    <div className={`relative min-h-[300px] flex-auto overflow-hidden bg-sky ${height}`}>
      <div className="absolute inset-x-0 top-0 z-5 pt-[calc(clamp(18px,3.2vw,40px)+env(safe-area-inset-top,0px))]">
        <div className="page-inner">
          <a
            href={markHref}
            aria-label="Minimal Me, início"
            className="inline-flex focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-4 entering:[animation:fade-in_1.2s_var(--ease)_1.2s_backwards]"
          >
            <Mark background="sky" />
          </a>
        </div>
      </div>
      {layers.map((layer) => (
        <div
          key={layer.id}
          data-opening-layer={layer.id}
          className="absolute inset-[-3%] origin-[50%_90%]"
        >
          {/* biome-ignore lint/performance/noImgElement: export estático; as larguras responsivas vêm de design-system/generate-illustrations.ts. */}
          <img
            src={layer.image.src}
            srcSet={layer.image.srcSet}
            sizes={`${mediaQueries.stacked} 150vw, 106vw`}
            width={layer.image.width}
            height={layer.image.height}
            alt={layer.alt}
            fetchPriority="high"
            decoding="async"
            style={positionStyle(layer)}
            className={`block size-full max-w-none object-cover object-(--position-wide) narrow:object-(--position-narrow) opening-waiting:opacity-0 ${layerEntrances[layer.id] ?? ""}`}
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-3 h-[13%] bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--ground)_70%,transparent)_60%,var(--ground))]" />
      <div className="pointer-events-none absolute inset-0 z-4" style={grainStyle} />
    </div>
  );
}
