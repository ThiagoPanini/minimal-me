import { entranceScript } from "@/motion/entrance";

// O movimento da página (módulo 6 da spec #57), no começo da Home: a entrada da abertura e a
// revelação ao rolar, num script em linha que roda antes de a abertura ser desenhada.
export function PageMotion() {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: o script vem do próprio código (motion/entrance.ts), montado no build.
    <script dangerouslySetInnerHTML={{ __html: entranceScript }} />
  );
}
