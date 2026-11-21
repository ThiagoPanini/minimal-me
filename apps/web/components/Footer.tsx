import { Mark } from "@/components/Mark";

// O fecho da página (docs/design/system/components/Footer): um fio, a marca com o nome nas
// colunas 1 a 8 e a linha de crédito a partir da coluna 9. Até 900px, um bloco abaixo do outro.
// A linha de crédito leva o ano e o "voltar ao início ↑"; numa página curta, como a 404, só o ano.

type FooterProps = {
  year: number;
  backToTop?: boolean;
};

export function Footer({ year, backToTop = true }: FooterProps) {
  return (
    <footer className="pb-[calc(clamp(30px,3.6vw,52px)+env(safe-area-inset-bottom,0px))]">
      <div className="page-inner page-grid relative items-center gap-y-4 pt-[clamp(26px,3vw,40px)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-hairline">
        <p className="col-span-12 flex items-center gap-[14px] font-normal font-sans text-[12px] uppercase leading-none tracking-[.34em] not-stacked:col-span-8">
          <Mark background="ground" />
          <span>Minimal Me</span>
        </p>
        <p className="col-span-12 font-light font-mono text-[12px] text-mist leading-[1.6] not-stacked:col-span-4">
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
