"use client";

import { useEffect } from "react";
import { useMedia } from "@/app/use-media";

// A profundidade da página (módulo 6 da spec #57), como no protótipo: com o ponteiro, as
// camadas da abertura (`data-opening-layer`) se deslocam, o céu contra ele e as dunas com ele;
// com o ponteiro e com a rolagem, a foto de cada space (`data-picture-depth`).
//
// O ponteiro conta de -1 a 1 em cada direção da tela, e a página o segue aos poucos: a cada
// quadro de 1/60s, anda 4,5% do que falta. Só conta o ponteiro de mouse ou de caneta. A foto de
// um space desce metade do percurso da rolagem quando a fresta entra pelo pé da tela e sobe
// metade quando ela sai pelo topo; com o ponteiro, vai contra ele, um terço menos na vertical.
//
// O laço só pede quadros enquanto a página ainda segue o ponteiro; a rolagem pede um quadro de
// cada vez; em repouso, nenhum. Com movimento reduzido, nada se desloca, inclusive se a
// preferência mudar com a página aberta.

type Point = { x: number; y: number };

export type DepthLayer = {
  id: string;
  // O deslocamento máximo com o ponteiro, em px; negativo vai contra ele.
  pointer: Point;
};

type PageDepthProps = {
  layers: DepthLayer[];
  // A profundidade da foto de um space, em px: o percurso com a rolagem e o máximo com o ponteiro.
  picture: { scroll: number; pointer: number };
};

// Quanto do que falta a página anda a cada quadro de 1/60s, atrás do ponteiro.
const follow = 0.045;
// Abaixo disso, a página alcançou o ponteiro.
const settled = 0.0005;
// Com profundidade, as camadas da abertura chegam 2% mais perto (presas a 50% 90%).
const layerScale = 1.02;
// A foto de um space a até 60px da tela ainda se desloca.
const margin = 60;
// Na vertical, o ponteiro desloca a foto um terço menos.
const pointerVertical = 0.66;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function PageDepth({ layers, picture }: PageDepthProps) {
  const motion = useMedia("motion");

  useEffect(() => {
    if (!motion) return;
    const opening = layers.flatMap(({ id, pointer }) => {
      const element = document.querySelector<HTMLElement>(`[data-opening-layer="${id}"]`);
      return element ? [{ element, pointer }] : [];
    });
    const pictures = Array.from(document.querySelectorAll<HTMLElement>("[data-picture-depth]"));
    const target: Point = { x: 0, y: 0 };
    const current: Point = { x: 0, y: 0 };
    let frame = 0;
    let last = 0;

    const draw = (time: number) => {
      frame = 0;
      const seconds = last ? Math.min(0.12, Math.max(0, (time - last) / 1000)) : 1 / 60;
      const step = 1 - (1 - follow) ** (seconds * 60);
      current.x += (target.x - current.x) * step;
      current.y += (target.y - current.y) * step;
      const following =
        Math.abs(target.x - current.x) > settled || Math.abs(target.y - current.y) > settled;
      const height = window.innerHeight;

      const area = opening[0]?.element.parentElement?.getBoundingClientRect();
      if (area && area.bottom > 0 && area.top < height) {
        for (const { element, pointer } of opening) {
          const x = (current.x * pointer.x).toFixed(2);
          const y = (current.y * pointer.y).toFixed(2);
          element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${layerScale})`;
        }
      }
      for (const element of pictures) {
        const slit = (element.closest("[data-space]") ?? element).getBoundingClientRect();
        if (!slit.width || slit.bottom < -margin || slit.top > height + margin) continue;
        // De -0,5, com a fresta entrando pelo pé da tela, a 0,5, com ela saindo pelo topo.
        const scrolled = clamp((height - slit.top) / (height + slit.height)) - 0.5;
        const x = (-current.x * picture.pointer).toFixed(2);
        const y = (
          -scrolled * picture.scroll -
          current.y * picture.pointer * pointerVertical
        ).toFixed(2);
        element.style.translate = `${x}px ${y}px`;
      }

      if (following) {
        last = time;
        frame = requestAnimationFrame(draw);
      } else last = 0;
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = (event.clientY / window.innerHeight) * 2 - 1;
      request();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    request();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      for (const { element } of opening) element.style.removeProperty("transform");
      for (const element of pictures) element.style.removeProperty("translate");
    };
  }, [motion, layers, picture]);

  return null;
}
