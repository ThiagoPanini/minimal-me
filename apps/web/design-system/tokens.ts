import designTokens from "@design-system/tokens.json";
import { loadedFamilies } from "./fonts";

// Ponte do sistema de design: o `tokens.json` vira variáveis CSS com os nomes do sistema
// (`--ground`, `--font-sans`, `--gap-min`, `--square`, `--ease`...), declaradas em `:root`
// no build. O `globals.css` liga essas variáveis aos utilitários do Tailwind.
//
// Os pesos das fontes que o sistema carrega viram `--weight-<nome>`, com o nome do CSS para o
// número (300 é `light`, 400 é `normal`). Cada estilo de texto (`type.groups`) vira quatro
// variáveis com o nome dele: `--label-font-size`, `--label-line-height`, `--label-font-weight`
// e, quando o estilo tem, `--label-letter-spacing`.

type Token = { name: string; value: string };

type TextStyle = {
  name: string;
  fontSize: string;
  lineHeight: number;
  fontWeight: number;
  letterSpacing?: string;
};

// Os nomes que o CSS dá aos pesos, os mesmos dos utilitários do Tailwind (`font-light`).
const weightNames: Record<string, string> = {
  "100": "thin",
  "200": "extralight",
  "300": "light",
  "400": "normal",
  "500": "medium",
  "600": "semibold",
  "700": "bold",
  "800": "extrabold",
  "900": "black",
};

const tokenName = /^[a-z][a-z0-9-]*$/;

function declaration(name: string, value: string): string {
  if (!tokenName.test(name)) {
    throw new Error(`Token com nome fora do padrão no tokens.json: "${name}"`);
  }
  if (/[;{}<>]/.test(value)) {
    throw new Error(`Token com valor que não cabe numa variável CSS: --${name}: ${value}`);
  }
  return `--${name}:${value};`;
}

// Troca cada família carregada pelo `next/font` pelo nome gerado para ela, mantendo
// o resto da pilha do sistema como alternativa.
function familyStack(stack: string): string {
  return stack.replace(/"([^"]+)"/g, (quoted, family: string) => loadedFamilies[family] ?? quoted);
}

function familiesInUse(): void {
  const stacks = Object.values(designTokens.type.families).join(",");
  for (const family of Object.keys(loadedFamilies)) {
    if (!stacks.includes(`"${family}"`)) {
      throw new Error(`A família "${family}" não está em type.families do tokens.json`);
    }
  }
}

// Os pesos carregados, sem repetição: `--weight-light:300`...
function weightDeclarations(): string[] {
  const weights = new Set(designTokens.type.fonts.map(({ weight }) => weight));
  return [...weights].map((weight) => {
    const name = weightNames[weight];
    if (!name) throw new Error(`Peso sem nome no CSS em type.fonts do tokens.json: ${weight}`);
    return declaration(`weight-${name}`, weight);
  });
}

// Os estilos de texto, cada um num peso que alguma fonte do sistema carrega.
function textStyleDeclarations(): string[] {
  const loaded = new Set(designTokens.type.fonts.map(({ weight }) => Number(weight)));
  const styles: TextStyle[] = designTokens.type.groups.flatMap(({ styles }) => styles);
  return styles.flatMap(({ name, fontSize, lineHeight, fontWeight, letterSpacing }) => {
    if (!loaded.has(fontWeight)) {
      throw new Error(
        `O estilo "${name}" do tokens.json pede o peso ${fontWeight}, que não é carregado`,
      );
    }
    const properties = [
      declaration(`${name}-font-size`, fontSize),
      declaration(`${name}-line-height`, String(lineHeight)),
      declaration(`${name}-font-weight`, String(fontWeight)),
    ];
    if (letterSpacing) properties.push(declaration(`${name}-letter-spacing`, letterSpacing));
    return properties;
  });
}

function designTokensCss(): string {
  familiesInUse();
  const groups: Token[][] = [
    designTokens.color.tokens,
    designTokens.spacing.tokens,
    designTokens.radius.tokens,
    designTokens.easing.tokens,
  ];
  const declarations = groups.flat().map(({ name, value }) => declaration(name, value));
  for (const [family, stack] of Object.entries(designTokens.type.families)) {
    declarations.push(declaration(`font-${family}`, familyStack(stack)));
  }
  declarations.push(...weightDeclarations(), ...textStyleDeclarations());
  return `:root{${declarations.join("")}}`;
}

export const rootTokensCss = designTokensCss();
