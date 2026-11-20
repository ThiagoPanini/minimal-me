import designTokens from "@design-system/tokens.json";
import { loadedFamilies } from "./fonts";

// Ponte do sistema de design: o `tokens.json` vira variáveis CSS com os nomes do sistema
// (`--ground`, `--font-sans`, `--gap-min`, `--square`, `--ease`...), declaradas em `:root`
// no build. O `globals.css` liga essas variáveis aos utilitários do Tailwind.

type Token = { name: string; value: string };

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
  return `:root{${declarations.join("")}}`;
}

export const rootTokensCss = designTokensCss();
