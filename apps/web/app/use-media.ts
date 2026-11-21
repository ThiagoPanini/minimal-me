import { useSyncExternalStore } from "react";
import { type MediaQueryName, mediaQueries } from "@/app/media";

// O gancho de mídia dos componentes de cliente: diz se uma consulta de `app/media.ts` vale e
// acompanha a mudança com a página aberta (a largura da janela ou a preferência de movimento).
// Antes da hidratação, toda consulta conta como falsa: sem o script nada se move, e a fileira
// fica como no HTML exportado. Fica fora de `app/media.ts` porque o servidor não pode importar
// um gancho.

export function matchesMedia(name: MediaQueryName): boolean {
  return window.matchMedia(mediaQueries[name]).matches;
}

function subscribeTo(name: MediaQueryName): (onChange: () => void) => () => void {
  return (onChange) => {
    const query = window.matchMedia(mediaQueries[name]);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  };
}

// Uma inscrição por consulta, sempre a mesma, para o React não se inscrever de novo a cada desenho.
const subscriptions = Object.fromEntries(
  Object.keys(mediaQueries).map((name) => [name, subscribeTo(name as MediaQueryName)]),
) as Record<MediaQueryName, (onChange: () => void) => () => void>;

export function useMedia(name: MediaQueryName): boolean {
  return useSyncExternalStore(
    subscriptions[name],
    () => matchesMedia(name),
    () => false,
  );
}
