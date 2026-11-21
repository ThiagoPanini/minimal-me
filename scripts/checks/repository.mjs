// Os arquivos do repositório que os checks leem.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "../..");
export const designSystemDir = path.join(root, "docs/design/system");

/**
 * Os Markdown que o git guarda, com o caminho relativo à raiz e o texto. Um arquivo que nasce
 * fora do git, como o `apps/web/AGENTS.md` que o `next dev` escreve, só conta depois do `git add`.
 */
export function markdownFiles() {
  const listed = execFileSync("git", ["ls-files", "-z", "--", "*.md"], {
    cwd: root,
    encoding: "utf8",
  });
  return listed
    .split("\0")
    .filter((file) => file && existsSync(path.join(root, file)))
    .map((file) => ({ file, text: readFileSync(path.join(root, file), "utf8") }));
}

/**
 * O código da web que o git guarda (`apps/web/**` em `.ts`, `.tsx` e `.css`), com o caminho
 * relativo à raiz e o texto. O que o build gera, em `design-system/generated/`, fica de fora.
 */
export function webSourceFiles() {
  const listed = execFileSync(
    "git",
    ["ls-files", "-z", "--", "apps/web/*.ts", "apps/web/*.tsx", "apps/web/*.css"],
    { cwd: root, encoding: "utf8" },
  );
  return listed
    .split("\0")
    .filter((file) => file && existsSync(path.join(root, file)))
    .map((file) => ({ file, text: readFileSync(path.join(root, file), "utf8") }));
}

/** As prévias dos componentes do sistema de design, com o caminho relativo à raiz e o texto. */
export function previewFiles() {
  const componentsDir = path.join(designSystemDir, "components");
  return readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(componentsDir, entry.name, "preview.html"))
    .filter((preview) => existsSync(preview))
    .map((preview) => ({
      file: path.relative(root, preview),
      text: readFileSync(preview, "utf8"),
    }));
}
