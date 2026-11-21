import { Fragment } from "react";

// O nome em `wordmark`, com o sobretítulo e a frase ao lado (docs/design/system/components/Masthead),
// logo abaixo da ilustração da abertura.
// O nome ocupa as colunas 1 a 8 e nunca quebra; o bloco de texto, as colunas 9 a 12. As
// maiúsculas do sobretítulo começam no topo das maiúsculas do nome e a última linha da frase
// pousa na linha de base dele, sem script: o nome e o bloco se alinham pela última linha de base
// (`self-baseline-last`), o `text-box` apara o nome e o sobretítulo ao topo das maiúsculas, e o
// bloco se estica até o topo das maiúsculas do nome. A frase não é aparada no pé: como no
// protótipo, a sobra da última linha abaixo da linha de base entra na altura do Masthead. Onde o
// bloco não cabe na altura das maiúsculas, a fileira cresce e o nome desce até a linha de base
// da frase. Até 900px, o nome ocupa a largura toda, sobe sobre o pé escuro das dunas, e o bloco
// de texto desce para baixo dele.
//
// Aparado, o nome perde o espaço acima das maiúsculas e abaixo da linha de base; ele volta
// como `--cap-gap` e `--base-gap`, para a caixa do nome ter a altura de antes (.82em: a linha
// de .76em mais a folga de .06em). Com Jost (ascendente 1,07, descendente .375 e altura das
// maiúsculas de .7), a linha de base fica a .06 + (.76 - 1,445) / 2 + 1,07 = .7875em do topo da
// caixa: as maiúsculas começam a .0875em, e a caixa termina .0325em abaixo da linha de base. O
// bloco de texto tem, no mínimo, a altura da fileira menos o `--cap-gap`.
//
// Com movimento, a página entra como no protótipo (motion/entrance.ts): cada palavra do nome
// sobe 105% da própria altura em 1,25s, por trás de uma máscara no pé da linha, a segunda 150ms
// depois da primeira; o sobretítulo aparece e a frase sobe 12px por último. A máscara só
// recorta abaixo da linha, onde as maiúsculas nunca chegam, então em repouso nada muda.

// As palavras do nome, cada uma com a própria entrada.
const nameWords = [
  {
    word: "Minimal",
    entrance: "entering:[animation:line-up_1.25s_var(--ease-out)_.45s_backwards]",
  },
  { word: "Me", entrance: "entering:[animation:line-up_1.25s_var(--ease-out)_.6s_backwards]" },
];

type MastheadProps = {
  kicker: string;
  tagline: string;
};

export function Masthead({ kicker, tagline }: MastheadProps) {
  return (
    <div className="relative z-4 pt-[clamp(6px,1vw,16px)] pb-[clamp(30px,3.4vw,54px)] stacked:-mt-[clamp(40px,7vw,64px)] stacked:pb-[clamp(36px,6vw,52px)]">
      <div className="@container page-inner page-grid items-start [--base-gap:.0325] [--cap-gap:.0875] [--name-size:calc(100cqw/6.099)] not-stacked:[--name-size:calc((200cqw_-_var(--grid-gap))/18.297)]">
        <h1 className="col-span-12 -mr-[.06em] -ml-[.04em] self-end whitespace-nowrap not-stacked:self-baseline-last pt-[.06em] font-light font-sans text-(length:--name-size) text-light uppercase leading-[.76] tracking-[.06em] not-stacked:col-span-8 not-stacked:pt-[calc(var(--cap-gap)*1em)] not-stacked:pb-[calc(var(--base-gap)*1em)] not-stacked:[text-box:trim-both_cap_alphabetic]">
          {nameWords.map(({ word, entrance }, index) => (
            <Fragment key={word}>
              {index > 0 && " "}
              <span className="inline-block entering:[clip-path:inset(-1em_-1em_0_-1em)]">
                <span className={`inline-block ${entrance}`}>{word}</span>
              </span>
            </Fragment>
          ))}
        </h1>
        <div className="col-span-12 flex min-w-0 flex-col items-start justify-start gap-3 pt-[clamp(18px,3vw,26px)] not-stacked:col-span-4 not-stacked:min-h-[calc(100%_-_var(--cap-gap)*var(--name-size))] not-stacked:self-baseline-last not-stacked:justify-between not-stacked:pt-0">
          <p className="font-normal font-sans text-[11px] text-mist uppercase leading-[1.4] tracking-[.3em] not-stacked:[text-box:trim-start_cap_alphabetic] entering:[animation:fade-in_1s_var(--ease)_.95s_backwards]">
            {kicker}
          </p>
          <p className="max-w-[34ch] text-pretty font-light font-mono text-[length:clamp(14px,1.1vw,16px)] text-body leading-[1.62] narrow:text-[14px] entering:[animation:fade-up_1s_var(--ease-out)_1.05s_backwards]">
            {tagline}
          </p>
        </div>
      </div>
    </div>
  );
}
