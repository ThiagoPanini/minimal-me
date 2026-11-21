import localFont from "next/font/local";

// As fontes vêm direto de `docs/design/system/fonts/`, servidas pela própria Home.
// O `next/font/local` só aceita caminhos literais: faltar um arquivo quebra o build com um
// pânico do Turbopack, sem dizer que é a fonte. A família ganha o nome da constante que a
// carrega (`jost`), não o do `tokens.json`: por isso o mapa `loadedFamilies` no fim.

export const jost = localFont({
  src: [
    { path: "../../../docs/design/system/fonts/Jost-300.woff2", weight: "300", style: "normal" },
    { path: "../../../docs/design/system/fonts/Jost-400.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
});

export const ibmPlexMono = localFont({
  src: [
    {
      path: "../../../docs/design/system/fonts/IBMPlexMono-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../docs/design/system/fonts/IBMPlexMono-400.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
});

// Cada família do `tokens.json` que a Home carrega, com o nome que o `next/font` deu a ela.
export const loadedFamilies: Record<string, string> = {
  Jost: jost.style.fontFamily,
  "IBM Plex Mono": ibmPlexMono.style.fontFamily,
};
