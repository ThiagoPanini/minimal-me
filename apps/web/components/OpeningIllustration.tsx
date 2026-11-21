import type { CSSProperties } from "react";
import { Mark } from "@/components/Mark";
import { grainStyle, type OpeningLayer, openingLayers } from "@/design-system/illustrations";

// A ilustração da abertura: o céu e as dunas em duas camadas, a descida para `ground`
// no pé, o grão por cima e a marca em `ink` no canto superior esquerdo, como link para
// o topo. Ocupa a altura da tela que o Masthead deixa; até 900px, uma altura própria.
// Os dados de cada camada (posição e texto alternativo) vêm de `illustrations.json`.

const percent = ({ x, y }: { x: number; y: number }) => `${x * 100}% ${y * 100}%`;

function positionStyle({ position }: OpeningLayer): CSSProperties {
  return {
    "--position-wide": percent(position.wide),
    "--position-narrow": percent(position.narrow),
  } as CSSProperties;
}

export function OpeningIllustration() {
  return (
    <div className="relative min-h-[300px] flex-auto overflow-hidden bg-sky max-[900px]:h-[min(66svh,720px)] max-[900px]:min-h-[360px] max-[900px]:flex-none">
      <div className="absolute inset-x-0 top-0 z-5 pt-[calc(clamp(18px,3.2vw,40px)+env(safe-area-inset-top,0px))]">
        <div className="page-inner">
          <a
            href="#top"
            aria-label="Minimal Me, início"
            className="inline-flex focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-4"
          >
            <Mark background="sky" />
          </a>
        </div>
      </div>
      {openingLayers.map((layer) => (
        <div key={layer.id} className="absolute inset-[-3%]">
          {/* biome-ignore lint/performance/noImgElement: export estático; as larguras responsivas vêm de design-system/generate-illustrations.ts. */}
          <img
            src={layer.image.src}
            srcSet={layer.image.srcSet}
            sizes="(max-width: 900px) 150vw, 106vw"
            width={layer.image.width}
            height={layer.image.height}
            alt={layer.alt}
            fetchPriority="high"
            decoding="async"
            style={positionStyle(layer)}
            className="block size-full max-w-none object-cover object-(--position-wide) max-[760px]:object-(--position-narrow)"
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-3 h-[13%] bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--ground)_70%,transparent)_60%,var(--ground))]" />
      <div className="pointer-events-none absolute inset-0 z-4" style={grainStyle} />
    </div>
  );
}
