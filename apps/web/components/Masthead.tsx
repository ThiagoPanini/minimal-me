// O nome em `wordmark`, com o sobretítulo e a frase ao lado (docs/design/system/components/Masthead),
// logo abaixo da ilustração da abertura.
// O nome ocupa as colunas 1 a 8 e nunca quebra; o bloco de texto, as colunas 9 a 12. As
// maiúsculas do sobretítulo começam no topo das maiúsculas do nome e a última linha da frase
// pousa na linha de base dele: o `text-box` apara os três ao topo das maiúsculas e à linha de
// base, sem script. Até 900px, o nome ocupa a largura toda, sobe sobre o pé escuro das dunas,
// e o bloco de texto desce para baixo dele.
//
// Aparado, o nome perde o espaço acima das maiúsculas e abaixo da linha de base; ele volta
// como `--cap-gap` e `--base-gap`, para a caixa do nome ter a altura de antes (.82em: a linha
// de .76em mais a folga de .06em). Com Jost (ascendente 1,07, descendente .375 e altura das
// maiúsculas de .7), a linha de base fica a .06 + (.76 - 1,445) / 2 + 1,07 = .7875em do topo da
// caixa: as maiúsculas começam a .0875em, e a caixa termina .0325em abaixo da linha de base.

type MastheadProps = {
  kicker: string;
  tagline: string;
};

export function Masthead({ kicker, tagline }: MastheadProps) {
  return (
    <div className="relative z-4 pt-[clamp(6px,1vw,16px)] pb-[clamp(30px,3.4vw,54px)] max-[900px]:-mt-[clamp(40px,7vw,64px)] max-[900px]:pb-[clamp(36px,6vw,52px)]">
      <div className="@container page-inner page-grid items-start [--base-gap:.0325] [--cap-gap:.0875] [--name-size:calc(100cqw/6.099)] min-[901px]:[--name-size:calc((200cqw_-_var(--grid-gap))/18.297)]">
        <h1 className="col-span-12 -mr-[.06em] -ml-[.04em] self-end whitespace-nowrap pt-[.06em] font-light font-sans text-(length:--name-size) text-light uppercase leading-[.76] tracking-[.06em] min-[901px]:col-span-8 min-[901px]:pt-[calc(var(--cap-gap)*1em)] min-[901px]:pb-[calc(var(--base-gap)*1em)] min-[901px]:[text-box:trim-both_cap_alphabetic]">
          Minimal Me
        </h1>
        <div className="col-span-12 flex min-w-0 flex-col items-start justify-start gap-3 pt-[clamp(18px,3vw,26px)] min-[901px]:col-span-4 min-[901px]:mt-[calc(var(--cap-gap)*var(--name-size))] min-[901px]:mb-[calc(var(--base-gap)*var(--name-size))] min-[901px]:self-stretch min-[901px]:justify-between min-[901px]:pt-0">
          <p className="font-normal font-sans text-[11px] text-mist uppercase leading-[1.4] tracking-[.3em] min-[901px]:[text-box:trim-start_cap_alphabetic]">
            {kicker}
          </p>
          <p className="max-w-[34ch] text-pretty font-light font-mono text-[length:clamp(14px,1.1vw,16px)] text-body leading-[1.62] max-[760px]:text-[14px] min-[901px]:[text-box:trim-end_cap_alphabetic]">
            {tagline}
          </p>
        </div>
      </div>
    </div>
  );
}
