import type { CSSProperties, ReactNode } from "react";
import { StatusLine } from "@/components/StatusLine";
import {
  grade,
  grainStyle,
  type SpaceIllustration,
  spaceIllustration,
  wake,
} from "@/design-system/illustrations";
import type { Space, SpaceId } from "@/spaces/catalog";
import { FocusableSlit, SpaceFocusProvider } from "@/spaces/focus";
import { LivingPicture } from "@/spaces/living-picture";

// A fresta de um space (docs/design/system/components/SpaceSlit): uma abertura na fileira dos
// quatro, com a ilustração inteira em repouso e tudo o que nomeia o space escrito dentro dela.
// No topo, sob um véu, o número, a StatusLine e o nome; no pé, a descrição (ou só a primeira
// frase, numa fileira com menos de 1120px) e o "Acessar", preso ao pé.
//
// A fileira divide a largura por igual e tem um terço dela de altura, descontados os vãos,
// entre 280px e 62% da tela. Até 900px continua uma fileira, com uma fresta sempre aberta a
// cinco vezes a largura das outras; as fechadas mostram a tira da imagem, o número e o ponto,
// e o resto continua para o leitor de tela e na tabulação. O estado de cada fresta mora no
// atributo `data-focus`, que o foco da fileira (`spaces/focus.tsx`) troca; as variantes
// `slit-*` de `app/globals.css` desenham a partir dele. No HTML exportado, a primeira fica
// guardada aberta.
//
// Abrir e fechar tem transições (`motion-safe:`): com movimento reduzido, a fresta abre sem
// transição, inclusive se a preferência mudar com a página aberta.

type SpaceSlitRowProps = {
  // A fresta guardada no começo, aberta até 900px.
  kept: SpaceId;
  children: ReactNode;
};

// A fileira das frestas. As medidas que as frestas usam vêm daqui: o vão, a folga das bordas,
// a largura de uma fresta fechada (`--slit-unit`) e quantas vezes a aberta é maior que ela.
export function SpaceSlitRow({ kept, children }: SpaceSlitRowProps) {
  return (
    <div className="@container">
      <ol
        data-spaces
        className="flex h-[clamp(280px,calc((100cqw_-_3*var(--slit-gap))/3),62svh)] gap-(--slit-gap) [--slit-gap:clamp(var(--gap-min),2vw,var(--gap-max))] [--slit-open-grow:1.9] [--slit-pad:clamp(var(--slit-inset-min),1.5vw,var(--slit-inset-max))] [--slit-unit:calc((100cqw_-_3*var(--slit-gap))/4.9)] stacked:h-[clamp(280px,50svh,440px)] stacked:[--slit-gap:8px] stacked:[--slit-open-grow:5] stacked:[--slit-pad:var(--slit-inset-min)] stacked:[--slit-unit:calc((100cqw_-_3*var(--slit-gap))/8)]"
      >
        <SpaceFocusProvider kept={kept}>{children}</SpaceFocusProvider>
      </ol>
    </div>
  );
}

// Quanto tempo a foto leva para chegar 3% mais perto com o foco, ou para voltar. No protótipo,
// a cada segundo ela anda a fração `rate` (de `wake`) do que falta e para quando falta 0,4%;
// a curva `ease-out` acompanha essa aproximação (medido: a 0,5s e a 1s, menos de 0,2% de
// escala de diferença). Com movimento reduzido, a foto não se aproxima.
const wakeSeconds = (rate: number) => `${(Math.log(1 / 0.004) / rate).toFixed(2)}s`;

// O recorte por largura, a chave de luz e a aproximação da foto, como variáveis para
// `slit-crop`, o filtro e a escala.
function pictureVariables({ crop }: SpaceIllustration): CSSProperties {
  return {
    "--crop-wide-x": crop.wide.x,
    "--crop-wide-y": crop.wide.y,
    "--crop-wide-zoom": crop.wide.zoom,
    "--crop-stacked-x": crop.stacked.x,
    "--crop-stacked-y": crop.stacked.y,
    "--crop-stacked-zoom": crop.stacked.zoom,
    "--grade-rest": grade.rest,
    "--grade-focus": grade.focus,
    "--wake-scale": wake.scale,
    "--wake-in": wakeSeconds(wake.rateIn),
    "--wake-out": wakeSeconds(wake.rateOut),
  } as CSSProperties;
}

type SpaceSlitProps = {
  space: Space;
};

export function SpaceSlit({ space }: SpaceSlitProps) {
  const illustration = spaceIllustration(space.illustration);
  const { image } = illustration;
  return (
    <FocusableSlit
      id={space.id}
      anchor={space.anchor}
      notice={space.notice}
      className="relative isolate h-full min-w-0 shrink grow basis-0 overflow-hidden has-[a:focus-visible]:outline-1 has-[a:focus-visible]:outline-mist has-[a:focus-visible]:-outline-offset-1 motion-safe:[transition:flex-grow_.9s_var(--ease)] slit-open:grow-(--slit-open-grow)"
    >
      <div className="absolute top-(--slit-pad) left-(--slit-pad) z-1 w-[calc(var(--slit-unit)_-_2*var(--slit-pad))] stacked:w-[calc(var(--slit-unit)*5_-_2*var(--slit-pad))] in-slit-closed:left-0 in-slit-closed:w-(--slit-unit)">
        <p className="flex items-center gap-[14px] whitespace-nowrap @max-[1240px]:flex-col @max-[1240px]:items-start @max-[1240px]:gap-[9px] stacked:gap-[10px] in-slit-closed:gap-[9px]">
          <span className="font-mono font-normal text-[11px] text-mist tabular-nums leading-none tracking-[.16em]">
            {space.number}
          </span>{" "}
          <StatusLine
            status={space.status}
            word={space.statusWord}
            wordClassName="in-slit-closed:sr-only"
          />
        </p>
        <h3 className="text-nowrap pt-3 font-light font-sans text-[length:clamp(15px,calc((var(--slit-unit)_-_2*var(--slit-pad))/8.4),27px)] text-light leading-[1.08] tracking-[-.005em] stacked:text-balance stacked:text-[length:clamp(21px,5.8vw,25px)] motion-safe:stacked:[transition:opacity_.5s_var(--ease)_.3s] in-slit-closed:pointer-events-none in-slit-closed:opacity-0 motion-safe:in-slit-closed:[transition:none]">
          {space.name}
        </h3>
      </div>

      <div className="absolute inset-0 -z-2" style={pictureVariables(illustration)}>
        <div className="slit-feather absolute inset-0 overflow-hidden motion-safe:[transition:opacity_.8s_var(--ease)] in-slit-receded:opacity-60">
          <div className="absolute inset-0 filter-(--grade-rest) motion-safe:[transition:filter_1.2s_var(--ease)] in-slit-open:filter-(--grade-focus)">
            <div className="absolute inset-[-3%] motion-safe:[transition:scale_var(--wake-out)_var(--ease-out)] motion-safe:in-slit-open:scale-(--wake-scale) motion-safe:in-slit-open:[transition:scale_var(--wake-in)_var(--ease-out)]">
              {/* biome-ignore lint/performance/noImgElement: export estático; as larguras responsivas vêm de design-system/generate-illustrations.ts. */}
              <img
                src={image.src}
                srcSet={image.srcSet}
                sizes="(max-width: 900px) 350px, 35vw"
                width={image.width}
                height={image.height}
                alt={illustration.alt}
                loading="lazy"
                decoding="async"
                className="slit-crop block"
              />
              <LivingPicture id={space.id} illustration={space.illustration} />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0" style={grainStyle} />
        </div>
        <div className="slit-veil-top pointer-events-none absolute inset-0 z-2" />
        <div className="slit-veil-focus pointer-events-none absolute inset-0 z-2 opacity-0 motion-safe:[transition:opacity_.7s_var(--ease)] in-slit-open:opacity-100 motion-safe:in-slit-open:[transition:opacity_.9s_var(--ease)_.15s]" />
      </div>

      <div className="absolute bottom-(--slit-pad) left-(--slit-pad) z-1 w-[calc(var(--slit-unit)*1.9_-_2*var(--slit-pad))] stacked:w-[calc(var(--slit-unit)*5_-_2*var(--slit-pad))] in-slit-closed:pointer-events-none in-slit-closed:opacity-0">
        <span className="block h-px w-6 bg-mist opacity-0 motion-safe:[transition:width_.5s_var(--ease),opacity_.4s_var(--ease)] in-slit-open:w-full in-slit-open:opacity-55 motion-safe:in-slit-open:[transition:width_1.1s_var(--ease-out)_.2s,opacity_.5s_var(--ease)_.2s]" />
        <p className="translate-y-2 text-pretty pt-4 font-light font-mono text-[14px] text-body leading-[1.72] opacity-0 motion-safe:[transition:opacity_.4s_var(--ease),translate_.5s_var(--ease)] @max-[1120px]:hidden motion-reduce:translate-y-0 in-slit-open:translate-y-0 in-slit-open:opacity-100 motion-safe:in-slit-open:[transition:opacity_.7s_var(--ease)_.38s,translate_.9s_var(--ease-out)_.38s]">
          {space.description}
        </p>
        <p className="hidden translate-y-2 text-pretty pt-[14px] font-light font-mono text-[13px] text-body leading-[1.62] opacity-0 motion-safe:[transition:opacity_.4s_var(--ease),translate_.5s_var(--ease)] @max-[1120px]:block stacked:pt-[13px] motion-reduce:translate-y-0 in-slit-open:translate-y-0 in-slit-open:opacity-100 motion-safe:in-slit-open:[transition:opacity_.7s_var(--ease)_.38s,translate_.9s_var(--ease-out)_.38s]">
          {space.lead}
        </p>
        <div className="flex items-end pt-[18px] stacked:pt-[14px]">
          <a
            href={`#${space.anchor}`}
            className="inline-flex items-center gap-3 font-mono font-normal text-[11px] text-light uppercase leading-[1.4] tracking-[.16em] no-underline focus-visible:outline-none"
          >
            Acessar<span className="sr-only"> {space.name}</span>
            <span className="block h-px w-[22px] bg-current motion-safe:[transition:width_.6s_var(--ease-out)] in-slit-open:w-10" />
          </a>
        </div>
      </div>
    </FocusableSlit>
  );
}
