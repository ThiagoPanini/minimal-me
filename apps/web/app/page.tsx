import type { Metadata } from "next";
import { siteName } from "@/app/site";
import { Footer } from "@/components/Footer";
import { Masthead } from "@/components/Masthead";
import { OpeningIllustration } from "@/components/OpeningIllustration";
import { SectionHeader } from "@/components/SectionHeader";
import { SpaceSlit, SpaceSlitRow } from "@/components/SpaceSlit";
import { spaceCount, spaces } from "@/spaces/catalog";

// A frase da abertura, que é também a descrição da Home para buscadores e na prévia de
// compartilhamento. A imagem da prévia vem de `opengraph-image.tsx`.
const tagline = "Uma dinâmica simples e moderna para consumir e gerar conteúdo.";

export const metadata: Metadata = {
  description: tagline,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    locale: "pt_BR",
    title: siteName,
    description: tagline,
  },
  twitter: { card: "summary_large_image" },
};

export default function Home() {
  return (
    <>
      <header
        id="top"
        className="flex h-svh min-h-[600px] flex-col max-[900px]:h-auto max-[900px]:min-h-0"
      >
        <OpeningIllustration page="home" />
        <Masthead kicker="hub pessoal e minimalista" tagline={tagline} />
      </header>
      <main>
        <section
          aria-labelledby="spaces-title"
          className="pt-[clamp(84px,9vw,140px)] pb-[clamp(104px,11vw,168px)]"
        >
          <div className="page-inner">
            <SectionHeader id="spaces-title" label="Spaces" count={spaceCount} />
            <SpaceSlitRow>
              {spaces.map((space, index) => (
                <SpaceSlit key={space.id} space={space} kept={index === 0} />
              ))}
            </SpaceSlitRow>
          </div>
        </section>
      </main>
      <Footer year={2026} />
    </>
  );
}
