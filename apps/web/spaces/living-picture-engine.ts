import {
  livingPictureData,
  type SpaceIllustrationKey,
  wake,
} from "@/design-system/living-pictures";
import {
  coverMap,
  type PictureCrop,
  type PictureMap,
  pictureDrawing,
} from "@/spaces/living-picture-motions";

// O laço de uma foto viva: o quanto ela está acordada segue o foco da fresta, suave na ida e
// na volta, e o canvas é redesenhado a cada quadro enquanto ela está acordada e à vista. Em
// repouso o canvas fica limpo e o laço para. Este módulo só é carregado quando uma foto
// acorda pela primeira vez (`living-picture.tsx`).

export type LivingPictureEngine = {
  // Acorda a foto (`awake`) ou a leva de volta ao repouso, suave; `visible` diz se ela está à
  // vista: fora da vista nada se move, e a que perdeu o foco já fica em repouso.
  update: (state: { awake: boolean; visible: boolean }) => void;
  // Para na hora e limpa o canvas, como pede o movimento reduzido.
  still: () => void;
};

// A cor de um token em hexadecimal (`#E9E9E6`) como "233,233,230", para os fios do desenho.
function channelsOf(hex: string): string {
  const digits = hex.trim().replace("#", "");
  return [0, 2, 4].map((at) => Number.parseInt(digits.slice(at, at + 2), 16)).join(",");
}

// O recorte da foto como a página o desenha (`slit-crop`, em `app/globals.css`), lido do
// estilo computado dela, para a página e o canvas concordarem em qualquer largura.
function cropOf(picture: Element | null): PictureCrop {
  if (!picture) return { x: 0.5, y: 0.5, zoom: 1 };
  const style = getComputedStyle(picture);
  const read = (name: string, fallback: number) => {
    const value = Number.parseFloat(style.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  return { x: read("--crop-x", 0.5), y: read("--crop-y", 0.5), zoom: read("--crop-zoom", 1) };
}

// Começa a foto viva de uma ilustração no canvas, que fica sobre a foto, no mesmo quadro.
export function startLivingPicture(
  canvas: HTMLCanvasElement,
  key: SpaceIllustrationKey,
): LivingPictureEngine {
  const context = canvas.getContext("2d");
  const data = livingPictureData(key);
  const draw = pictureDrawing(
    key,
    data,
    channelsOf(getComputedStyle(canvas).getPropertyValue("--light")),
  );
  const picture = canvas.parentElement?.querySelector("img") ?? null;

  let awake = 0;
  let target = 0;
  let visible = false;
  let frame = 0;
  let last = 0;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let map: PictureMap | null = null;

  // O canvas acompanha o tamanho do quadro, que muda enquanto a fresta abre.
  function fit(): void {
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.clientWidth === width && canvas.clientHeight === height && nextRatio === ratio) {
      return;
    }
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    ratio = nextRatio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    map = width && height ? coverMap(width, height, data.size, cropOf(picture)) : null;
  }

  function paint(time: number): void {
    if (!context) return;
    fit();
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (awake > 0 && map) draw(context, map, time / 1000, awake);
  }

  function tick(time: number): void {
    frame = 0;
    const seconds = last ? Math.min(0.12, Math.max(0, (time - last) / 1000)) : 0.016;
    last = time;
    if (awake !== target) {
      const rate = target ? wake.rateIn : wake.rateOut;
      awake += (target - awake) * (1 - Math.exp(-seconds * rate));
      if (Math.abs(target - awake) < 0.004) awake = target;
    }
    paint(time);
    if (awake > 0 && visible) frame = requestAnimationFrame(tick);
    else last = 0;
  }

  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }

  function rest(): void {
    stop();
    awake = 0;
    paint(0);
  }

  return {
    update(state) {
      target = state.awake ? 1 : 0;
      visible = state.visible;
      if (!visible) {
        // Fora da vista, nada se move; a foto que perdeu o foco já fica em repouso.
        if (target === 0) rest();
        else stop();
        return;
      }
      if (!frame && (awake > 0 || target > 0)) frame = requestAnimationFrame(tick);
    },
    still() {
      target = 0;
      rest();
    },
  };
}
