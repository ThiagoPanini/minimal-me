// A linha que abre uma seção (docs/design/system/components/SectionHeader): o rótulo à
// esquerda, como título de nível 2, a contagem à direita e um fio de 1px em `hairline` abaixo,
// a `section-rule-gap` do texto, de margem a margem. Sem contagem, o lado direito fica vazio.

type SectionHeaderProps = {
  // O `id` do título, para a seção se nomear por ele.
  id: string;
  label: string;
  count?: string;
};

export function SectionHeader({ id, label, count }: SectionHeaderProps) {
  return (
    <header className="relative mb-[clamp(30px,3.2vw,48px)] flex items-baseline justify-between gap-6 pb-(--section-rule-gap) after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-hairline">
      <h2
        id={id}
        className="m-0 font-normal font-sans text-[12px] text-light uppercase leading-[1.4] tracking-[.34em]"
      >
        {label}
      </h2>
      {count && (
        <span className="font-mono font-normal text-[11px] text-mist tabular-nums leading-[1.4] tracking-[.16em]">
          {count}
        </span>
      )}
    </header>
  );
}
