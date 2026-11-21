import { Footer } from "@/components/Footer";
import { Masthead } from "@/components/Masthead";
import { OpeningIllustration } from "@/components/OpeningIllustration";
import { SectionHeader } from "@/components/SectionHeader";
import { SpaceSlit, SpaceSlitRow } from "@/components/SpaceSlit";
import { spaceCount, spaces } from "@/spaces/catalog";

export default function Home() {
  return (
    <>
      <header
        id="top"
        className="flex h-svh min-h-[600px] flex-col max-[900px]:h-auto max-[900px]:min-h-0"
      >
        <OpeningIllustration />
        <Masthead
          kicker="hub pessoal e minimalista"
          tagline="Uma dinâmica simples e moderna para consumir e gerar conteúdo."
        />
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
