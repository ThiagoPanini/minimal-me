// As consultas de mídia da Home no JavaScript, num lugar só: as quebras `stacked` (até 900px) e
// `narrow` (até 760px), as mesmas das variantes de `app/globals.css`, que repetem o número
// porque o CSS não importa daqui, e o movimento (`motion`), que vale quando a pessoa não pediu
// movimento reduzido. Servem ao servidor (os `sizes` das imagens), ao script em linha da
// entrada (`motion/entrance.ts`) e, no cliente, ao gancho `useMedia` (`app/use-media.ts`).

export const mediaQueries = {
  stacked: "(max-width: 900px)",
  narrow: "(max-width: 760px)",
  motion: "(prefers-reduced-motion: no-preference)",
} as const;

export type MediaQueryName = keyof typeof mediaQueries;
