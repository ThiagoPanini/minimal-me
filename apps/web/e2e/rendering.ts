import type { Locator } from "@playwright/test";

// A opacidade que chega à tela: o produto da opacidade do elemento e de cada ancestral.
export function renderedOpacity(element: Locator): Promise<number> {
  return element.evaluate((node) => {
    let opacity = 1;
    for (let current: Element | null = node; current; current = current.parentElement) {
      opacity *= Number(getComputedStyle(current).opacity);
    }
    return opacity;
  });
}
