import type { SpaceIllustrationKey } from "@/design-system/illustrations";

// O catálogo de spaces: o único lugar que declara os quatro. A ordem da lista dá o número
// de cada space e a contagem da seção; o Status dá a palavra da `StatusLine` e o texto do
// aviso. Mudar o Status ou o texto de um space é mudar um valor aqui, por PR, sem tocar no
// desenho. Os textos são de amostra (tabela "O que a Home mostra" da spec #57).

export type SpaceStatus = "available" | "in-development" | "planned";

export type SpaceId = "FramesAndSongs" | "MusicAndFeeling" | "CodeAndShare" | "WriteAndLearn";

type SpaceEntry = {
  id: SpaceId;
  name: string;
  status: SpaceStatus;
  // A descrição, frase por frase: a primeira é a que entra onde a inteira não cabe.
  sentences: readonly [string, ...string[]];
  // A chave da ilustração em `illustrations.json`.
  illustration: SpaceIllustrationKey;
};

const catalog: readonly SpaceEntry[] = [
  {
    id: "FramesAndSongs",
    name: "Frames & Songs",
    status: "in-development",
    sentences: [
      "Meus momentos, em fotos e vídeos.",
      "Posts em carrossel, cada um com a música que ficou daquele momento.",
    ],
    illustration: "frames",
  },
  {
    id: "MusicAndFeeling",
    name: "Music & Feeling",
    status: "planned",
    sentences: [
      "Eu tocando, de perto.",
      "Vídeos curtos de pequenos trechos de canções, no violão e na guitarra, guardados pelo que me fazem sentir.",
    ],
    illustration: "music",
  },
  {
    id: "CodeAndShare",
    name: "Code & Share",
    status: "planned",
    sentences: [
      "O que eu ando construindo, sem atualizar nada à mão.",
      "Repositórios, commits e o uso de cada ferramenta de IA chegam sozinhos do meu ambiente de desenvolvimento.",
    ],
    illustration: "tech",
  },
  {
    id: "WriteAndLearn",
    name: "Write & Learn",
    status: "planned",
    sentences: [
      "Um agente de IA que escreve por conta própria.",
      "Parte do que me interessa, sugere temas e publica textos para que eu e quem me visita aprendamos juntos.",
    ],
    illustration: "ai",
  },
];

const statusWords: Record<SpaceStatus, string> = {
  available: "Disponível",
  "in-development": "Em desenvolvimento",
  planned: "Em planejamento",
};

export type Space = SpaceEntry & {
  // O número de ordem, com dois algarismos: "01".
  number: string;
  // A palavra do Status: "Em desenvolvimento".
  statusWord: string;
  description: string;
  lead: string;
  // A âncora da fresta, que o "Acessar" usa enquanto o space não tem página: "frames-and-songs".
  anchor: string;
  // O texto do aviso do "Acessar": no Marco 1, nenhum space tem página.
  notice: string;
};

const twoDigits = (value: number) => String(value).padStart(2, "0");

const kebabCase = (id: SpaceId) => id.replace(/(?<!^)(?=[A-Z])/g, "-").toLowerCase();

export const spaces: readonly Space[] = catalog.map((entry, index) => {
  const statusWord = statusWords[entry.status];
  return {
    ...entry,
    number: twoDigits(index + 1),
    statusWord,
    description: entry.sentences.join(" "),
    lead: entry.sentences[0],
    anchor: kebabCase(entry.id),
    notice: `${statusWord} · ${entry.name} ainda não está disponível.`,
  };
});

// A contagem da seção: "01 — 04".
export const spaceCount = `01 — ${twoDigits(spaces.length)}`;
