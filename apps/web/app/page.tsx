import { Footer } from "@/components/Footer";
import { Masthead } from "@/components/Masthead";
import { OpeningIllustration } from "@/components/OpeningIllustration";
import { SectionHeader } from "@/components/SectionHeader";
import { SpaceSlit, SpaceSlitRow } from "@/components/SpaceSlit";
import { Toast, ToastProvider } from "@/components/Toast";
import { spaceCount, spaces } from "@/spaces/catalog";

export default function Home() {
  return (
    <ToastProvider>
      <header id="top" className="flex h-svh min-h-[600px] flex-col stacked:h-auto stacked:min-h-0">
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
            <SpaceSlitRow kept={spaces[0].id}>
              {spaces.map((space) => (
                <SpaceSlit key={space.id} space={space} />
              ))}
            </SpaceSlitRow>
          </div>
        </section>
      </main>
      <Footer year={2026} />
      <Toast />
    </ToastProvider>
  );
}
