import { defineConfig, devices } from "@playwright/test";

// Costura 1: os testes rodam no contêiner oficial do Playwright contra a imagem
// nginx de pé no Docker Compose. Quem sobe os dois é `pnpm test:e2e`, na raiz.
const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error(
    "BASE_URL não definida: rode os testes por `pnpm test:e2e`, na raiz do repositório.",
  );
}

const isCI = Boolean(process.env.CI);

// As respostas do nginx não dependem do navegador: rodam só no projeto de 1440.
const nginxOnly = "nginx.spec.ts";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: true,
  retries: 1,
  failOnFlakyTests: true,
  workers: isCI ? 1 : 2,
  reporter: isCI ? [["list"], ["github"]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-390",
      testIgnore: nginxOnly,
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "chromium-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      // Subconjunto em WebKit: só os testes marcados com @webkit.
      name: "webkit-iphone-13",
      testIgnore: nginxOnly,
      grep: /@webkit/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
