"use client";

import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SpaceIllustrationKey } from "@/design-system/living-pictures";
import type { SpaceId } from "@/spaces/catalog";
import { useSlitFocus } from "@/spaces/focus";
import type { LivingPictureEngine } from "@/spaces/living-picture-engine";

// A foto viva de um space (módulo 5 da spec #57): um canvas sobre a foto, no mesmo quadro, em
// que a ilustração acorda com um movimento feito do que está pintado nela e com a luz que
// respira. Acorda quando a fresta abre (com foco ou, até 900px, guardada) e está à vista, e
// volta ao repouso, sem nada desenhado, em cerca de um segundo. Com movimento reduzido nada
// roda, inclusive se a preferência mudar com a página aberta.
//
// Aqui fica só o que decide quando acordar. O desenho e o laço (`living-picture-engine.ts`)
// são pedidos na primeira vez que uma foto acorda, depois de a página carregar, para não
// atrasar a primeira pintura; o atlas das folhas de Write & Learn, só quando ela acorda.

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Antes da hidratação, conta como reduzido: nada roda sem o script.
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => true,
  );
}

// A foto conta como à vista quando ao menos um décimo dela está na tela.
const visibleShare = 0.1;

function useVisible(element: RefObject<Element | null>): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = element.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.intersectionRatio >= visibleShare),
      { threshold: visibleShare },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [element]);
  return visible;
}

// Resolve quando a página terminou de carregar, com as camadas da abertura.
function pageLoaded(): Promise<void> {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
}

type LivingPictureProps = {
  id: SpaceId;
  illustration: SpaceIllustrationKey;
};

export function LivingPicture({ id, illustration }: LivingPictureProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Promise<LivingPictureEngine> | null>(null);
  const { open } = useSlitFocus(id);
  const reducedMotion = useReducedMotion();
  const visible = useVisible(canvas);

  // Cada mudança chega ao laço depois do mesmo começo, na ordem em que aconteceu.
  useEffect(() => {
    if (reducedMotion) {
      engine.current?.then((started) => started.still());
      return;
    }
    if (!engine.current) {
      const element = canvas.current;
      if (!(open && visible && element)) return;
      engine.current = pageLoaded()
        .then(() => import("@/spaces/living-picture-engine"))
        .then(({ startLivingPicture }) => startLivingPicture(element, illustration));
    }
    engine.current.then((started) => started.update({ awake: open, visible }));
  }, [open, visible, reducedMotion, illustration]);

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: o canvas não recebe foco; só desenha sobre a foto, que já tem o texto alternativo.
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
