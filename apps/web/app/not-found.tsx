import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { OpeningIllustration } from "@/opening/illustration";

// A página de quem erra o endereço: o export a grava como `404.html`, e o nginx a serve, com
// status 404, a qualquer rota que não existe. Só peças do sistema: o céu da abertura, sem as
// dunas e sem a figura, com o grão e a marca que leva à Home; abaixo, o sobretítulo em
// `kicker` (o título da página), a frase em `tagline` e o link de volta em `link`, com o traço;
// por fim, o rodapé só com o ano, porque a página é curta. Tudo cabe numa tela: o céu fica com
// a altura que o texto e o rodapé deixam.
//
// O Next põe esta página no payload de toda página, não só no `404.html`: nada de componente
// de cliente aqui.

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex flex-auto flex-col">
        <OpeningIllustration page="not-found" />
      </header>
      <main className="pt-[clamp(30px,3.4vw,54px)] pb-[clamp(44px,5vw,80px)]">
        <div className="page-inner page-grid">
          <div className="col-span-12 flex flex-col items-start gap-3">
            <h1 className="font-normal font-sans text-[11px] text-mist uppercase leading-[1.4] tracking-[.3em]">
              página não encontrada
            </h1>
            <p className="max-w-[34ch] text-pretty font-light font-mono text-[length:clamp(14px,1.1vw,16px)] text-body leading-[1.62] narrow:text-[14px]">
              Este endereço não leva a nenhum lugar do Minimal Me.
            </p>
            <a
              href="/"
              className="action-link group relative mt-[clamp(12px,1.6vw,20px)] after:absolute after:-inset-2.5"
            >
              voltar ao início
              <span
                aria-hidden="true"
                className="link-dash group-hover:w-10 group-focus-visible:w-10"
              />
            </a>
          </div>
        </div>
      </main>
      <Footer year={2026} backToTop={false} />
    </div>
  );
}
