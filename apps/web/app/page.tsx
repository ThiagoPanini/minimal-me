import { Footer } from "@/components/Footer";
import { Masthead } from "@/components/Masthead";
import { OpeningIllustration } from "@/components/OpeningIllustration";

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
      <Footer year={2026} />
    </>
  );
}
