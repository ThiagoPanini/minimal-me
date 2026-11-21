import { expect, type Page } from "@playwright/test";
import sharp from "sharp";

// O contraste no pior ponto (spec #57, Testing Decisions), pelo método da medição do #40:
// 1. acha cada texto que a página desenha sobre uma ilustração: todo texto à vista cujas
//    linhas (os retângulos de `Range.getClientRects()`) cruzam a parte visível de uma imagem
//    com texto alternativo;
// 2. deixa esses textos transparentes e captura a tela: o que sobra atrás de cada um é o fundo;
// 3. em cada pixel das linhas do texto, calcula a razão WCAG entre a cor do texto (com a
//    opacidade que chega à tela) e o fundo. O pior pixel é o contraste do texto.
// Cada linha conta na largura que o retângulo dela dá e na altura que a tinta das letras ocupa.
// O retângulo vai da ascendente à descendente da fonte: no nome do Masthead, em maiúsculas e
// com entrelinha de .76, ele sobra 16px acima das letras e alcança a crista clara da duna, a
// 390, onde não há texto nenhum.
// A captura é da tela, sem mudar o tamanho dela: a página é rolada até cada grupo de textos.

// O que a medição diz de um texto.
export type TextContrast = {
  // O texto e, numa fresta, o space dela: `"Acessar" em Code & Share`.
  text: string;
  fontSize: number;
  // A razão no pior pixel, e onde ele fica na página.
  ratio: number;
  at: { x: number; y: number };
  // O mínimo do sistema de design: 4,5:1, ou 3:1 para texto de 24px ou mais.
  minimum: number;
};

type Rect = { left: number; top: number; right: number; bottom: number };

// Um texto sobre ilustração como a página o desenha: a cor em sRGB (0 a 255), a opacidade que
// chega à tela (a da cor vezes a de cada ancestral) e as linhas, em coordenadas da página.
type TextOverIllustration = {
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number; alpha: number };
  rects: Rect[];
};

// Roda na página. Devolve os textos sobre ilustração e os deixa transparentes, para a captura
// mostrar só o fundo.
function takeTextsOverIllustrations(): TextOverIllustration[] {
  const fromDom = ({ left, top, right, bottom }: DOMRect): Rect => ({ left, top, right, bottom });
  const intersection = (a: Rect, b: Rect): Rect => ({
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  });
  const isEmpty = ({ left, top, right, bottom }: Rect) => right - left < 1 || bottom - top < 1;

  // A parte de uma caixa que os ancestrais com `overflow` deixam à vista. Um `clip-path` num
  // ancestral esconde tudo: na página, ele só aparece no texto que fica para o leitor de tela.
  function visiblePart(rect: Rect, from: Element | null): Rect | null {
    let visible = rect;
    for (let element = from; element; element = element.parentElement) {
      const style = getComputedStyle(element);
      if (style.clipPath !== "none") return null;
      if (style.overflowX !== "visible" || style.overflowY !== "visible") {
        visible = intersection(visible, fromDom(element.getBoundingClientRect()));
      }
    }
    return isEmpty(visible) ? null : visible;
  }

  // As medidas da fonte do texto e da tinta das letras dele, como a página as mostra.
  const canvas = document.createElement("canvas").getContext("2d");
  function inkOf(content: string, style: CSSStyleDeclaration): TextMetrics | null {
    if (!canvas) return null;
    canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return canvas.measureText(
      style.textTransform === "uppercase" ? content.toLocaleUpperCase("pt-BR") : content,
    );
  }

  // A caixa de uma linha vai da ascendente à descendente da fonte; ela fica com a altura que a
  // tinta das letras ocupa, a partir da linha de base. Se a caixa não tem a altura da fonte
  // (outra fonte entrou na linha), fica inteira.
  function trimmedToInk(rect: Rect, ink: TextMetrics | null): Rect {
    if (!ink) return rect;
    const { fontBoundingBoxAscent, fontBoundingBoxDescent } = ink;
    if (Math.abs(rect.bottom - rect.top - fontBoundingBoxAscent - fontBoundingBoxDescent) > 1) {
      return rect;
    }
    const baseline = rect.top + fontBoundingBoxAscent;
    return {
      ...rect,
      top: baseline - ink.actualBoundingBoxAscent,
      bottom: baseline + ink.actualBoundingBoxDescent,
    };
  }

  const illustrations = [...document.images]
    .filter((image) => image.alt.trim() !== "")
    .map((image) => visiblePart(fromDom(image.getBoundingClientRect()), image.parentElement))
    .filter((rect) => rect !== null);

  const found: { element: HTMLElement; text: TextOverIllustration }[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const content = node.textContent?.replace(/\s+/g, " ").trim();
    const element = node.parentElement;
    if (!content || !element) continue;
    if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const style = getComputedStyle(element);
    const ink = inkOf(content, style);
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()]
      .map((rect) => visiblePart(trimmedToInk(fromDom(rect), ink), element))
      .filter((rect) => rect !== null);
    const overIllustration = rects.some((rect) =>
      illustrations.some((illustration) => !isEmpty(intersection(rect, illustration))),
    );
    if (!overIllustration) continue;

    const channels = style.color.match(/[\d.]+/g)?.map(Number) ?? [];
    if (!style.color.startsWith("rgb") || channels.length < 3) {
      throw new Error(`cor de texto inesperada: ${style.color}`);
    }
    let alpha = channels[3] ?? 1;
    for (let current: Element | null = element; current; current = current.parentElement) {
      alpha *= Number(getComputedStyle(current).opacity);
    }
    const space = element.closest("li")?.querySelector("h3")?.textContent?.trim();
    found.push({
      element,
      text: {
        text: space && space !== content ? `"${content}" em ${space}` : `"${content}"`,
        fontSize: Number.parseFloat(style.fontSize),
        color: { r: channels[0], g: channels[1], b: channels[2], alpha },
        rects: rects.map(({ left, top, right, bottom }) => ({
          left: left + window.scrollX,
          top: top + window.scrollY,
          right: right + window.scrollX,
          bottom: bottom + window.scrollY,
        })),
      },
    });
  }
  // Só depois de ler todas as cores: um texto pode herdar a cor de outro.
  for (const { element } of found) element.style.setProperty("color", "transparent", "important");
  return found.map(({ text }) => text);
}

// As imagens que estão na tela já carregadas e decodificadas, como o Visitante as vê.
async function imagesInViewReady(page: Page): Promise<void> {
  const loaded = () =>
    page.evaluate(async () => {
      const inView = [...document.images].filter((image) => {
        const { top, bottom, left, right } = image.getBoundingClientRect();
        return bottom > 0 && top < innerHeight && right > 0 && left < innerWidth;
      });
      if (!inView.every((image) => image.complete && image.naturalWidth > 0)) return false;
      await Promise.all(inView.map((image) => image.decode()));
      return true;
    });
  await expect.poll(loaded, { message: "as imagens na tela não carregaram" }).toBe(true);
}

// A luminância relativa da WCAG de cada valor de canal sRGB.
const linear = Array.from({ length: 256 }, (_, value) => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
});

const luminance = (r: number, g: number, b: number) =>
  0.2126 * linear[r] + 0.7152 * linear[g] + 0.0722 * linear[b];

type Capture = { data: Buffer; width: number; height: number; channels: number };

// O pior pixel atrás de um texto, numa captura feita com a página rolada até `scroll`.
function worstPoint(
  { text, fontSize, color, rects }: TextOverIllustration,
  capture: Capture,
  scroll: { x: number; y: number },
): TextContrast {
  let worst = { ratio: Number.POSITIVE_INFINITY, at: { x: 0, y: 0 } };
  for (const rect of rects) {
    const left = Math.max(0, Math.floor(rect.left - scroll.x));
    const right = Math.min(capture.width, Math.ceil(rect.right - scroll.x));
    const top = Math.max(0, Math.floor(rect.top - scroll.y));
    const bottom = Math.min(capture.height, Math.ceil(rect.bottom - scroll.y));
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        const index = (y * capture.width + x) * capture.channels;
        const background = [
          capture.data[index],
          capture.data[index + 1],
          capture.data[index + 2],
        ] as const;
        // O texto como ele chega à tela: a cor dele sobre o fundo, na opacidade dele.
        const [r, g, b] = [color.r, color.g, color.b].map((channel, i) =>
          Math.round(color.alpha * channel + (1 - color.alpha) * background[i]),
        );
        const foreground = luminance(r, g, b);
        const behind = luminance(...background);
        const ratio = (Math.max(foreground, behind) + 0.05) / (Math.min(foreground, behind) + 0.05);
        if (ratio < worst.ratio) worst = { ratio, at: { x: x + scroll.x, y: y + scroll.y } };
      }
    }
  }
  return { text, fontSize, ...worst, minimum: fontSize >= 24 ? 3 : 4.5 };
}

// Mede cada texto sobre uma ilustração no estado em que a página está agora. Depois da medição
// os textos ficam transparentes: quem precisa de outro estado abre a página de novo.
export async function measureTextsOverIllustrations(page: Page): Promise<TextContrast[]> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const texts = await page.evaluate(takeTextsOverIllustrations);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("página sem tamanho de tela");

  // Os textos em grupos que cabem numa tela, com 16px de folga, de cima para baixo.
  const margin = 16;
  const extent = (text: TextOverIllustration) => ({
    top: Math.min(...text.rects.map(({ top }) => top)),
    bottom: Math.max(...text.rects.map(({ bottom }) => bottom)),
  });
  const pending = [...texts].sort((a, b) => extent(a).top - extent(b).top);
  const results: TextContrast[] = [];
  while (pending.length > 0) {
    const group = [pending.shift() as TextOverIllustration];
    const top = extent(group[0]).top;
    let bottom = extent(group[0]).bottom;
    while (
      pending.length > 0 &&
      Math.max(bottom, extent(pending[0]).bottom) - top <= viewport.height - 2 * margin
    ) {
      const next = pending.shift() as TextOverIllustration;
      bottom = Math.max(bottom, extent(next).bottom);
      group.push(next);
    }

    const scroll = await page.evaluate(
      ({ top, bottom }) => {
        window.scrollTo({ top: (top + bottom - innerHeight) / 2, behavior: "instant" });
        return { x: window.scrollX, y: window.scrollY };
      },
      { top, bottom },
    );
    if (top < scroll.y || bottom > scroll.y + viewport.height) {
      throw new Error("um grupo de textos não coube na tela");
    }
    await imagesInViewReady(page);
    const png = await page.screenshot({ animations: "disabled", caret: "hide", scale: "css" });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const capture = { data, width: info.width, height: info.height, channels: info.channels };
    for (const text of group) results.push(worstPoint(text, capture, scroll));
  }
  return results;
}
