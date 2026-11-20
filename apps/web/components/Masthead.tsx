// O nome em `wordmark`, com o sobretítulo e a frase ao lado (docs/design/system/components/Masthead).
// O nome ocupa as colunas 1 a 8 e nunca quebra; até 900px, ocupa a largura toda
// e o bloco de texto desce para baixo dele.

type MastheadProps = {
  kicker: string;
  tagline: string;
};

export function Masthead({ kicker, tagline }: MastheadProps) {
  return (
    <header className="@container mx-auto w-full max-w-(--max-width) px-[clamp(var(--gutter-min),4.4vw,var(--gutter-max))] pt-11 pb-12">
      <div className="grid grid-cols-12 gap-x-(--grid-gap) gap-y-6 [--grid-gap:clamp(var(--gap-min),2vw,var(--gap-max))]">
        <h1 className="col-span-12 -mr-[.06em] -ml-[.04em] whitespace-nowrap pt-[.06em] font-light font-sans text-[length:calc(100cqw/6.099)] text-light uppercase leading-[.76] tracking-[.06em] min-[901px]:col-span-8 min-[901px]:text-[length:calc((200cqw_-_var(--grid-gap))/18.297)]">
          Minimal Me
        </h1>
        <div className="col-span-12 flex min-w-0 flex-col justify-between gap-3 min-[901px]:col-span-4">
          <p className="font-normal font-sans text-[11px] text-mist uppercase leading-[1.4] tracking-[.3em]">
            {kicker}
          </p>
          <p className="max-w-[34ch] text-pretty font-light font-mono text-[length:clamp(14px,1.2vw,16px)] text-body leading-[1.62]">
            {tagline}
          </p>
        </div>
      </div>
    </header>
  );
}
