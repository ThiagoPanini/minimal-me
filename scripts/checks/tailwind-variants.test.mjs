// As variantes do Tailwind que erram em silêncio na web: as quebras arbitrárias de largura da
// tela e o `motion-reduce:transition-none` (armadilhas do Marco 1).
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { assertNone } from "./assert-none.mjs";
import { webSourceFiles } from "./repository.mjs";
import { tailwindVariantProblems } from "./tailwind-variants.mjs";

describe("the web code", () => {
  test("uses neither an arbitrary screen-width breakpoint nor motion-reduce:transition-none", () => {
    const files = webSourceFiles();
    assert.ok(files.length > 0, "Nenhum arquivo .ts, .tsx ou .css de apps/web listado pelo git.");
    assertNone(
      files.flatMap(({ file, text }) => tailwindVariantProblems(file, text)),
      "Variantes do Tailwind recusadas (as da Home estão em apps/web/app/globals.css):",
    );
  });
});

describe("the arbitrary screen-width breakpoints", () => {
  test("flags max-[…]: and min-[…]: with the file, the line and what to use", () => {
    const text = [
      "export function Row() {",
      '  return <div className="flex max-[900px]:flex-col min-[901px]:gap-4" />;',
      "}",
    ].join("\n");

    const problems = tailwindVariantProblems("apps/web/components/Row.tsx", text);

    assert.equal(problems.length, 2);
    assert.match(problems[0], /^apps\/web\/components\/Row\.tsx:2: `max-\[900px\]:` /);
    assert.match(problems[1], /^apps\/web\/components\/Row\.tsx:2: `min-\[901px\]:` /);
    for (const problem of problems) {
      assert.match(problem, /`stacked:` \(até 900px\), `not-stacked:` .* ou `narrow:`/);
    }
  });

  test("flags the breakpoint after another variant, negated or in another unit", () => {
    const text = "hover:max-[760px]:hidden not-min-[56rem]:block";

    assert.deepEqual(
      tailwindVariantProblems("a.css", text).map((problem) => problem.split(" ")[1]),
      ["`max-[760px]:`", "`min-[56rem]:`"],
    );
  });

  test("container queries and the max and min sizes pass", () => {
    const text = [
      '<p className="@max-[1240px]:flex-col @min-[600px]:gap-2 @container" />',
      '<div className="max-w-[1440px] min-h-[calc(100%_-_8px)] stacked:max-w-none" />',
      "@media (max-width: 900px) { .x { top: 0; } }",
    ].join("\n");

    assert.deepEqual(tailwindVariantProblems("b.tsx", text), []);
  });
});

describe("motion-reduce:transition-none", () => {
  test("flags it with the file, the line and what to use, also after another variant", () => {
    const text = [
      '<li className="transition-[flex] motion-reduce:transition-none" />',
      '<p className="stacked:motion-reduce:transition-none" />',
    ].join("\n");

    const problems = tailwindVariantProblems("apps/web/components/Slit.tsx", text);

    assert.deepEqual(
      problems.map((problem) => problem.split(" ")[0]),
      ["apps/web/components/Slit.tsx:1:", "apps/web/components/Slit.tsx:2:"],
    );
    for (const problem of problems) {
      assert.match(problem, /`motion-reduce:transition-none` .*`motion-safe:\[transition:…\]`/);
    }
  });

  test("a transition in motion-safe: and motion-reduce: on another property pass", () => {
    const text =
      '<div className="motion-safe:[transition:scale_.9s_var(--ease)] motion-reduce:translate-y-0" />';

    assert.deepEqual(tailwindVariantProblems("c.tsx", text), []);
  });
});
