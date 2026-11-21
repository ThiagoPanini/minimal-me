// Passo do build: as ilustrações que a Home mostra ganham tamanhos responsivos.
// Lê `docs/design/system/assets/Illustrations/`, grava as larguras menores em
// `design-system/generated/` (fora do git) e escreve `generated/illustrations.ts`,
// que importa cada largura. O Next dá hash ao nome de cada arquivo importado e o
// serve em `/_next/static/media/`; a maior largura é o próprio arquivo do sistema.
// As camadas da abertura ganham também uma cópia em PNG, no tamanho original, em
// `generated/opening/`: o `next/og` da imagem de compartilhamento não desenha WebP.
// Escreve também `generated/atlases.ts`, com os atlas da foto viva, só para o código dela.
// Faltar uma ilustração ou um atlas que a Home usa quebra o build aqui.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const systemDir = path.resolve(
  import.meta.dirname,
  "../../../docs/design/system/assets/Illustrations",
);
const generatedDir = path.resolve(import.meta.dirname, "generated");
const variantsDir = path.join(generatedDir, "illustrations");
const openingDir = path.join(generatedDir, "opening");

// As larguras menores que o arquivo original; a original entra sempre.
const variantWidths = [480, 768];

type Illustration = { id: string; file: string; size: [number, number] };
type IllustrationsData = {
  opening: { layers: Illustration[] };
  illustrations: Record<
    string,
    Omit<Illustration, "id"> & { motion: { atlas?: string; atlasSize?: [number, number] } }
  >;
};

const data: IllustrationsData = JSON.parse(
  readFileSync(path.join(systemDir, "illustrations.json"), "utf8"),
);

// As ilustrações que a Home mostra: as camadas da abertura e as dos spaces.
const shown: Illustration[] = [
  ...data.opening.layers,
  ...Object.entries(data.illustrations).map(([id, illustration]) => ({ id, ...illustration })),
];

// Os atlas da foto viva (as folhas de Write & Learn): entram como estão, sem outras larguras,
// num módulo à parte, que só o código da foto viva importa.
const atlases: Illustration[] = Object.entries(data.illustrations).flatMap(([id, { motion }]) =>
  motion.atlas && motion.atlasSize
    ? [{ id: `${id} (atlas)`, file: motion.atlas, size: motion.atlasSize }]
    : [],
);

const missing = [...shown, ...atlases].filter(
  ({ file }) => !existsSync(path.join(systemDir, file)),
);
if (missing.length > 0) {
  console.error(
    "Ilustrações que a Home usa e que faltam em docs/design/system/assets/Illustrations:",
  );
  for (const { id, file } of missing) console.error(`  ${file} (${id})`);
  process.exit(1);
}

rmSync(generatedDir, { recursive: true, force: true });
mkdirSync(variantsDir, { recursive: true });
mkdirSync(openingDir, { recursive: true });

const identifier = (id: string, width: number) => `${id.replace(/\W/g, "_")}${width}`;
const imports: string[] = [];
const entries: string[] = [];

// Confere que o arquivo tem o tamanho que `illustrations.json` diz e devolve a largura.
async function checkedWidth({ file, size }: Illustration): Promise<number> {
  const { width = 0, height = 0 } = await sharp(path.join(systemDir, file)).metadata();
  if (width !== size[0] || height !== size[1]) {
    console.error(
      `${file} tem ${width}×${height}, mas illustrations.json diz ${size[0]}×${size[1]}.`,
    );
    process.exit(1);
  }
  return width;
}

for (const illustration of shown) {
  const { id, file } = illustration;
  const source = path.join(systemDir, file);
  const width = await checkedWidth(illustration);
  const names: string[] = [];
  for (const variantWidth of variantWidths.filter((w) => w < width)) {
    const variant = `${id}-${variantWidth}.webp`;
    await sharp(source)
      .resize({ width: variantWidth })
      .webp({ quality: 80 })
      .toFile(path.join(variantsDir, variant));
    imports.push(`import ${identifier(id, variantWidth)} from "./illustrations/${variant}";`);
    names.push(identifier(id, variantWidth));
  }
  imports.push(
    `import ${identifier(id, width)} from "@design-system/assets/Illustrations/${file}";`,
  );
  names.push(identifier(id, width));
  entries.push(`  ${JSON.stringify(id)}: [${names.join(", ")}],`);
}

for (const { id, file } of data.opening.layers) {
  await sharp(path.join(systemDir, file))
    .png()
    .toFile(path.join(openingDir, `${id}.png`));
}

writeFileSync(
  path.join(generatedDir, "illustrations.ts"),
  [
    "// Gerado por design-system/generate-illustrations.ts no build. Não edite.",
    ...imports,
    "",
    "// Cada ilustração que a Home mostra, da menor largura para a maior.",
    "export const illustrationSources = {",
    ...entries,
    "} as const;",
    "",
  ].join("\n"),
);

const atlasImports: string[] = [];
const atlasEntries: string[] = [];
for (const [index, atlas] of atlases.entries()) {
  await checkedWidth(atlas);
  atlasImports.push(
    `import atlas${index} from "@design-system/assets/Illustrations/${atlas.file}";`,
  );
  atlasEntries.push(`  ${JSON.stringify(atlas.file)}: atlas${index},`);
}
writeFileSync(
  path.join(generatedDir, "atlases.ts"),
  [
    "// Gerado por design-system/generate-illustrations.ts no build. Não edite.",
    ...atlasImports,
    "",
    "// Os atlas da foto viva, pelo nome do arquivo em `illustrations.json`.",
    "export const atlasSources: Record<string, { src: string }> = {",
    ...atlasEntries,
    "};",
    "",
  ].join("\n"),
);
console.log(
  `Ilustrações geradas: ${shown.map(({ id }) => id).join(", ")}; atlas: ${atlases.map(({ file }) => file).join(", ")}.`,
);
