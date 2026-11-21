import { Mark } from "@/components/Mark";

// O fecho da página (docs/design/system/components/Footer): um fio, a marca com o nome nas
// colunas 1 a 8 e a linha de crédito a partir da coluna 9. Até 900px, um bloco abaixo do outro.
// A linha de crédito leva o ano e o "voltar ao início ↑"; numa página curta, como a 404, só o ano.
//
// Com movimento, na Home, ele entra uma vez, quando chega à tela (motion/entrance.ts): o fio
// cresce da esquerda em 1,2s, e o texto aparece 0,3s depois.

type FooterProps = {
  year: number;
  backToTop?: boolean;
};

export function Footer({ year, backToTop = true }: FooterProps) {
  return (
    <footer
      data-reveal
      className="pb-[calc(clamp(30px,3.6vw,52px)+env(safe-area-inset-bottom,0px))]"
    >
      <div className="page-inner page-grid relative items-center gap-y-4 pt-[clamp(26px,3vw,40px)] before:absolute before:inset-x-0 before:top-0 before:h-px before:origin-left before:bg-hairline unrevealed:before:[scale:0_1] revealed:before:[animation:grow-x_1.2s_var(--ease-out)_backwards]">
        <p className="col-span-12 flex items-center gap-[14px] font-normal font-sans text-[12px] uppercase leading-none tracking-[.34em] not-stacked:col-span-8 unrevealed:opacity-0 revealed:[animation:fade-in_1s_var(--ease)_.3s_backwards]">
          <Mark background="ground" />
          <span>Minimal Me</span>
        </p>
        <p className="col-span-12 font-light font-mono text-[12px] text-mist leading-[1.6] not-stacked:col-span-4 unrevealed:opacity-0 revealed:[animation:fade-in_1s_var(--ease)_.3s_backwards]">
          © {year}
          {backToTop && (
            <>
              {" "}
              <span aria-hidden="true">·</span>{" "}
              <a
                href="#top"
                className="text-body underline decoration-1 decoration-hairline underline-offset-[5px] hover:decoration-current"
              >
                voltar ao início ↑
              </a>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
