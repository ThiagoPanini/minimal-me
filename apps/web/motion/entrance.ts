// A entrada da abertura e a revelação ao rolar (módulo 6 da spec #57). Roda como script em
// linha no começo da Home, antes de o navegador desenhar a abertura: só ele esconde alguma
// coisa, e é ele mesmo que a revela, sem esperar o resto do JavaScript da página. Sem script
// ou com movimento reduzido, nada se esconde e a página fica no estado final.
//
// O estado mora no atributo `data-motion` do `html`, que as variantes `entering`,
// `opening-waiting`, `opening-arrived`, `unrevealed` e `revealed` de `app/globals.css` leem:
// - `waiting`: com movimento, à espera das duas camadas da abertura (`data-opening-layer`);
// - `arrived`: as duas chegaram, ou passaram 5s, e a ilustração entra;
// - sem o atributo: sem movimento, tudo no estado final.
// Cada bloco marcado com `data-reveal` ganha `data-revealed` quando entra na tela, uma vez só.
// Se a preferência passar a movimento reduzido com a página aberta, o atributo sai na hora, e
// tudo fica no estado final até o fim da visita, sem repetir nenhuma entrada.

type EntranceOptions = {
  // Quanto a abertura espera as camadas, em ms.
  arrivalMs: number;
  // Quanto de um bloco precisa estar na tela para ele entrar, e a margem da tela.
  threshold: number;
  rootMargin: string;
};

// Autocontida: vai para a página como texto (`entranceScript`), sem nada de fora dela.
function enterPage({ arrivalMs, threshold, rootMargin }: EntranceOptions): void {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches || !("IntersectionObserver" in window)) return;
  root.dataset.motion = "waiting";

  const arrive = () => {
    if (root.dataset.motion === "waiting") root.dataset.motion = "arrived";
  };
  const timer = window.setTimeout(arrive, arrivalMs);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        entry.target.setAttribute("data-revealed", "");
      }
    },
    { threshold, rootMargin },
  );
  const stop = () => {
    if (!reduced.matches) return;
    reduced.removeEventListener("change", stop);
    window.clearTimeout(timer);
    observer.disconnect();
    delete root.dataset.motion;
  };
  reduced.addEventListener("change", stop);

  const start = () => {
    if (!root.dataset.motion) return;
    const layers = Array.from(document.querySelectorAll("[data-opening-layer] img"));
    let pending = layers.length;
    const layerArrived = () => {
      pending -= 1;
      if (pending === 0) arrive();
    };
    if (pending === 0) arrive();
    for (const layer of layers) {
      if (!(layer instanceof HTMLImageElement) || layer.complete) layerArrived();
      else {
        layer.addEventListener("load", layerArrived, { once: true });
        layer.addEventListener("error", layerArrived, { once: true });
      }
    }
    for (const block of Array.from(document.querySelectorAll("[data-reveal]"))) {
      observer.observe(block);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else start();
}

// Os números do protótipo: a abertura espera até 5s; um bloco entra com 12% dele na tela,
// descontados 6% do pé dela.
const options: EntranceOptions = {
  arrivalMs: 5000,
  threshold: 0.12,
  rootMargin: "0px 0px -6% 0px",
};

// O script em linha, para o começo da Home.
export const entranceScript = `(${enterPage.toString()})(${JSON.stringify(options)});`;
