// A linha que abre uma seção (docs/design/system/components/SectionHeader): o rótulo à
// esquerda, como título de nível 2, a contagem à direita e um fio de 1px em `hairline` abaixo,
// a `section-rule-gap` do texto, de margem a margem. Sem contagem, o lado direito fica vazio.
//
// Com movimento, ela entra uma vez, quando chega à tela (motion/entrance.ts): o fio cresce da
// esquerda em 1,2s, o rótulo aparece, e a contagem 0,25s depois.

type SectionHeaderProps = {
  // O `id` do título, para a seção se nomear por ele.
  id: string;
  label: string;
  count?: string;
};

export function SectionHeader({ id, label, count }: SectionHeaderProps) {
  return (
    <header
      data-reveal
      className="hairline-rule mb-[clamp(30px,3.2vw,48px)] flex items-baseline justify-between gap-6 pb-(--section-rule-gap) after:bottom-0"
    >
      <h2
        id={id}
        className="m-0 font-normal font-sans text-[12px] text-light uppercase leading-[1.4] tracking-[.34em] unrevealed:opacity-0 revealed:[animation:fade-in_.9s_var(--ease)_backwards]"
      >
        {label}
      </h2>
      {count && (
        <span className="font-mono font-normal text-[11px] text-mist tabular-nums leading-[1.4] tracking-[.16em] unrevealed:opacity-0 revealed:[animation:fade-in_.9s_var(--ease)_.25s_backwards]">
          {count}
        </span>
      )}
    </header>
  );
}
