import { atlasSources } from "@/design-system/generated/atlases";
import type {
  Glow,
  LivingPictureData,
  SpaceIllustrationKey,
  SpaceMotion,
} from "@/design-system/living-pictures";

// O desenho de cada foto viva, portado do script do protótipo (`docs/design/prototype/mvp/`),
// o único lugar onde ele existia. Os dados vêm de `illustrations.json`; as constantes do
// desenho (amplitudes, sementes, as fases do disparo, os 22 segmentos dos arcos, os limiares
// das luzes e a cintilação da tela de Code & Share) estão só aqui. Trocar uma ilustração
// obriga a refazer os dados dela e a conferir estas constantes.

// Onde a imagem do arquivo cai no canvas, recortada como `object-fit: cover` e com o zoom.
export type PictureMap = {
  // A largura da imagem desenhada, em px do canvas.
  width: number;
  // Quantos px do canvas vale um px do arquivo.
  scale: number;
  // Um ponto do arquivo, de 0 a 1 sobre a largura e a altura, em px do canvas.
  at: (u: number, v: number) => [number, number];
};

// O recorte na fresta: onde a imagem fica presa (x, y de 0 a 1) e o zoom.
export type PictureCrop = { x: number; y: number; zoom: number };

export function coverMap(
  frameWidth: number,
  frameHeight: number,
  [fileWidth, fileHeight]: [number, number],
  crop: PictureCrop,
): PictureMap {
  const scale = Math.max(frameWidth / fileWidth, frameHeight / fileHeight) * crop.zoom;
  const width = fileWidth * scale;
  const height = fileHeight * scale;
  const left = (frameWidth - width) * crop.x;
  const top = (frameHeight - height) * crop.y;
  return { width, scale, at: (u, v) => [left + u * width, top + v * height] };
}

// Desenha a foto `awake` acordada (de 0 a 1; em 0 nada é desenhado) no instante `seconds`.
export type PictureDrawing = (
  context: CanvasRenderingContext2D,
  map: PictureMap,
  seconds: number,
  awake: number,
) => void;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (x: number) => 1 - (1 - clamp(x)) ** 3;
// Um número pseudoaleatório de 0 a 1, sempre o mesmo para o mesmo `n`.
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// Uma sequência pseudoaleatória de 0 a 1 a partir de uma semente.
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

// Frames & Songs · um disparo: os cantos de um quadro assentam sobre o horizonte, o
// obturador pisca, e o quadro tirado fica um instante. Três enquadramentos, um depois do outro.
function shutter(
  { period, shots }: Extract<SpaceMotion, { kind: "shutter" }>,
  lineRgb: string,
): PictureDrawing {
  return (context, map, seconds, awake) => {
    const turn = Math.floor(seconds / period);
    const phase = seconds / period - turn;
    const shot = shots[((turn % shots.length) + shots.length) % shots.length];
    if (phase > 0.92) return;
    const center = map.at(shot.u, shot.v);
    let scale = 1;
    let alpha = 1;
    let whole = false;
    let flash = 0;
    let drop = 0;
    if (phase < 0.16) {
      const eased = easeOut(phase / 0.16);
      scale = 1.14 - 0.14 * eased;
      alpha = eased;
    } else if (phase < 0.54) {
      scale = 1 + 0.016 * Math.cos((phase - 0.16) * 46) * Math.exp(-(phase - 0.16) * 12);
    } else if (phase < 0.6) {
      flash = 1 - (phase - 0.54) / 0.06;
      scale = 0.985;
      whole = true;
    } else {
      const progress = (phase - 0.6) / 0.32;
      whole = true;
      alpha = 1 - easeOut(progress);
      scale = 0.985 - 0.02 * progress;
      drop = 8 * map.scale * progress;
    }
    const width = shot.width * map.width * scale;
    const height = (width * 2) / 3;
    const left = center[0] - width / 2;
    const top = center[1] - height / 2 + drop;
    const corner = width * 0.16;
    if (flash > 0) {
      context.fillStyle = `rgba(255,255,255,${(awake * 0.2 * flash).toFixed(3)})`;
      context.fillRect(left, top, width, height);
    }
    context.strokeStyle = `rgba(${lineRgb},${(awake * 0.85 * alpha).toFixed(3)})`;
    context.lineWidth = Math.max(1, 1.5 * map.scale);
    context.lineCap = "butt";
    context.beginPath();
    if (whole) {
      context.rect(left, top, width, height);
    } else {
      for (const [x, y, dx, dy] of [
        [left, top, 1, 1],
        [left + width, top, -1, 1],
        [left, top + height, 1, -1],
        [left + width, top + height, -1, -1],
      ]) {
        context.moveTo(x + dx * corner, y);
        context.lineTo(x, y);
        context.lineTo(x, y + dy * corner);
      }
    }
    context.stroke();
    // A mira no meio, enquanto o quadro é enquadrado.
    if (!whole) {
      const reach = corner * 0.22;
      context.globalAlpha = 0.7;
      context.beginPath();
      context.moveTo(center[0] - reach, center[1]);
      context.lineTo(center[0] + reach, center[1]);
      context.moveTo(center[0], center[1] - reach);
      context.lineTo(center[0], center[1] + reach);
      context.stroke();
      context.globalAlpha = 1;
    }
  };
}

// Music & Feeling · o som, desenhado como as ilustrações desenham todo o resto: fios. Os
// arcos saem do amplificador, abrem para cima e para a esquerda, longe de quem toca, crescem
// e somem no ar sobre a duna.
function waves(
  { source, arcs, period, from, to }: Extract<SpaceMotion, { kind: "waves" }>,
  lineRgb: string,
): PictureDrawing {
  const start = Math.PI * from;
  const end = Math.PI * to;
  const segments = 22;
  return (context, map, seconds, awake) => {
    const center = map.at(source.u, source.v);
    context.lineWidth = Math.max(1, 1.5 * map.scale);
    context.lineCap = "butt";
    for (let arc = 0; arc < arcs; arc += 1) {
      const progress = (((seconds / period + arc / arcs) % 1) + 1) % 1;
      const radius = map.width * (0.035 + 0.46 * progress ** 0.85);
      const alpha = awake * 0.5 * (1 - progress) ** 1.5 * Math.min(1, progress / 0.07);
      if (alpha < 0.006) continue;
      // Cada arco esmaece para as duas pontas.
      for (let segment = 0; segment < segments; segment += 1) {
        const along = (segment + 0.5) / segments;
        const weight = Math.sin(Math.PI * along) ** 1.3;
        context.strokeStyle = `rgba(${lineRgb},${(alpha * weight).toFixed(3)})`;
        context.beginPath();
        context.arc(
          center[0],
          center[1],
          radius,
          start + ((end - start) * segment) / segments,
          start + ((end - start) * (segment + 1.08)) / segments,
        );
        context.stroke();
      }
    }
  };
}

// Code & Share · as luzes dos racks: umas ficam acesas, outras respiram, e em algumas
// fileiras a luz corre de uma ponta à outra. Uma luz apaga sob um ponto do cinza do rack em
// volta e volta mais clara do que foi pintada.
function leds(
  { lights }: Extract<SpaceMotion, { kind: "leds" }>,
  [fileWidth, fileHeight]: [number, number],
): PictureDrawing {
  const moving = lights.flatMap(({ u, v, r, rack }, index) => {
    const pick = hash(index * 3.1 + 1);
    const row = Math.round((v * fileHeight) / 14);
    // Abaixo de .26 a luz fica como foi pintada; até .56 respira; acima, corre na fileira.
    if (pick < 0.26) return [];
    return [
      {
        u,
        v,
        r,
        rack,
        breathes: pick < 0.56,
        phase: hash(row * 7.7) * 6.283,
        rate: 0.5 + hash(index + 9) * 1.3,
        run: 1.6 + hash(row + 2) * 2.2,
        direction: hash(row * 1.3) > 0.5 ? 1 : -1,
      },
    ];
  });
  return (context, map, seconds, awake) => {
    for (const light of moving) {
      const level = light.breathes
        ? 0.5 + 0.5 * Math.sin(seconds * light.rate + light.phase + light.u * 30)
        : Math.sin(
              seconds * light.run -
                ((light.direction * light.u * fileWidth) / 8.4) * 0.9 +
                light.phase,
            ) > 0.1
          ? 1
          : 0.06;
      const [x, y] = map.at(light.u, light.v);
      if (level < 0.97) {
        context.globalAlpha = awake * (1 - level) * 0.94;
        context.fillStyle = `rgb(${light.rack},${light.rack},${light.rack})`;
        context.beginPath();
        context.arc(x, y, (light.r + 1.7) * map.scale, 0, 6.2832);
        context.fill();
      }
      if (level > 0.8) {
        const radius = (light.r * 2.6 + 1.5) * map.scale;
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255,255,255,${(awake * (level - 0.8) * 3).toFixed(3)})`);
        gradient.addColorStop(
          0.32,
          `rgba(255,255,255,${(awake * (level - 0.8) * 0.7).toFixed(3)})`,
        );
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        context.globalAlpha = 1;
        context.fillStyle = gradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    }
    context.globalAlpha = 1;
  };
}

// Write & Learn · as folhas pintadas na ilustração são as que se movem: sob cada uma o canvas
// põe um remendo do fundo limpo e, por cima, a própria folha, recortada da ilustração, um
// pouco fora do lugar e um pouco girada. O atlas só é pedido aqui, quando a foto acorda.
function sheets({ atlas, sheets: list }: Extract<SpaceMotion, { kind: "sheets" }>): PictureDrawing {
  const source = atlasSources[atlas];
  if (!source) throw new Error(`O atlas "${atlas}" não passou por generate-illustrations.ts`);
  const image = new Image();
  let ready = false;
  image.onload = () => {
    ready = true;
  };
  image.src = source.src;
  const floating = list.map((sheet, index) => {
    const random = seeded(40 + index);
    // A folha que a borda da ilustração corta só balança, presa nessa borda.
    const cut = sheet.w > 300;
    return {
      sheet,
      cut,
      amplitude: cut ? 5 : 10 + random() * 9,
      turn: cut ? 0.01 : 0.05 + random() * 0.06,
      rate: 0.55 + random() * 0.4,
      phases: [random() * 6.283, random() * 6.283, random() * 6.283, random() * 6.283],
    };
  });
  return (context, map, seconds, awake) => {
    if (!ready) return;
    const { scale } = map;
    const [originX, originY] = map.at(0, 0);
    for (const { sheet } of floating) {
      const { x, y, w, h, patch } = sheet;
      context.drawImage(
        image,
        patch[0],
        patch[1],
        w,
        h,
        originX + x * scale,
        originY + y * scale,
        w * scale,
        h * scale,
      );
    }
    for (const { sheet, cut, amplitude, turn, rate, phases } of floating) {
      const { x, y, w, h } = sheet;
      const dx = cut
        ? 0
        : awake *
          amplitude *
          (Math.sin(seconds * rate * 0.55 + phases[0]) +
            0.35 * Math.sin(seconds * rate * 1.7 + phases[1]));
      const dy =
        awake *
        amplitude *
        (0.8 * Math.sin(seconds * rate * 0.42 + phases[2]) +
          0.3 * Math.sin(seconds * rate * 1.3 + phases[3]));
      const pivotX = cut ? x + w : x + w / 2;
      const pivotY = y + h / 2;
      context.save();
      context.translate(originX + (pivotX + dx) * scale, originY + (pivotY + dy) * scale);
      context.rotate(awake * turn * Math.sin(seconds * rate * 0.5 + phases[1]));
      if (!cut) context.scale(1, 1 + awake * 0.06 * Math.sin(seconds * rate * 1.1 + phases[3]));
      context.drawImage(
        image,
        sheet.sheet[0],
        sheet.sheet[1],
        w,
        h,
        (x - pivotX) * scale,
        (y - pivotY) * scale,
        w * scale,
        h * scale,
      );
      context.restore();
    }
  };
}

// A tela de Code & Share não respira: ela cintila com as linhas que passam.
const flickering: SpaceIllustrationKey = "tech";

// A luz que toda ilustração tem atrás da figura respira um pouco enquanto a foto está acordada.
function glowDrawing({ u, v, radius, alpha, rate }: Glow, flickers: boolean): PictureDrawing {
  return (context, map, seconds, awake) => {
    const [x, y] = map.at(u, v);
    const reach = radius * map.width;
    let level = alpha * (0.6 + 0.4 * Math.sin(seconds * rate));
    if (flickers) level += 0.028 * (hash(Math.floor(seconds * 6)) - 0.5);
    const gradient = context.createRadialGradient(x, y, 0, x, y, reach);
    gradient.addColorStop(0, `rgba(255,255,255,${(level * awake).toFixed(4)})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(x - reach, y - reach, reach * 2, reach * 2);
  };
}

function motionDrawing(
  motion: SpaceMotion,
  size: [number, number],
  lineRgb: string,
): PictureDrawing {
  switch (motion.kind) {
    case "shutter":
      return shutter(motion, lineRgb);
    case "waves":
      return waves(motion, lineRgb);
    case "leds":
      return leds(motion, size);
    case "sheets":
      return sheets(motion);
  }
}

// O desenho da foto viva de uma ilustração: o movimento dela e, por cima, a luz que respira.
// `lineRgb` é a cor dos fios em canais RGB, como "233,233,230" (o token `light`).
export function pictureDrawing(
  key: SpaceIllustrationKey,
  { size, glow, motion }: LivingPictureData,
  lineRgb: string,
): PictureDrawing {
  const drawMotion = motionDrawing(motion, size, lineRgb);
  const drawGlow = glowDrawing(glow, key === flickering);
  return (context, map, seconds, awake) => {
    drawMotion(context, map, seconds, awake);
    drawGlow(context, map, seconds, awake);
  };
}
