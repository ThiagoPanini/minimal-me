import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A Home vai ao ar como arquivos estáticos servidos pelo nginx (ADR 0005).
  output: "export",
  reactCompiler: true,
  typedRoutes: true,
  // O Cache Components não funciona com export estático; fica desligado de propósito.
  cacheComponents: false,
  turbopack: {
    // A raiz do monorepo, para a web ler `docs/design/system/` sem copiar nada.
    root: fileURLToPath(new URL("../..", import.meta.url)),
  },
  // O cache em disco do Turbopack (dev e build) já vem ligado por padrão desde o Next 16.3.
};

export default nextConfig;
