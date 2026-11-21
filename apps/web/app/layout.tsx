import type { Metadata } from "next";
import type { ReactNode } from "react";
import { rootTokensCss } from "@/design-system/tokens";
import "./globals.css";

// O título de cada página termina no nome: a 404 é "Página não encontrada · Minimal Me".
export const metadata: Metadata = {
  title: { default: "Minimal Me", template: "%s · Minimal Me" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: CSS gerado no build a partir do tokens.json, com nomes e valores validados pela ponte. */}
        <style dangerouslySetInnerHTML={{ __html: rootTokensCss }} />
      </head>
      <body className="bg-ground font-sans text-light">{children}</body>
    </html>
  );
}
