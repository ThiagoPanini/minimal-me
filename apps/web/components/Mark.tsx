import markInk from "@design-system/assets/Brand/mark-ink.svg";
import markLight from "@design-system/assets/Brand/mark-light.svg";

// O símbolo do Minimal Me (docs/design/system/components/Mark), como imagem do sistema:
// sobre `sky`, em `ink` e com 26px; sobre `ground`, com anel em `mist` e ponto em `light`,
// com 18px. É decorativo: quem o usa como link dá o nome ao link.

const variants = {
  sky: { image: markInk, size: 26 },
  ground: { image: markLight, size: 18 },
} as const;

type MarkProps = {
  background: keyof typeof variants;
};

export function Mark({ background }: MarkProps) {
  const { image, size } = variants[background];
  return (
    // biome-ignore lint/performance/noImgElement: export estático, sem a otimização de imagem do Next; o SVG vem do sistema.
    <img src={image.src} alt="" width={size} height={size} className="block shrink-0" />
  );
}
