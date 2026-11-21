import { test as base, expect } from "@playwright/test";

// Toda página aberta num teste termina sem erro de console, violação de CSP incluída. A única
// exceção é o aviso do navegador de que o próprio documento veio com status 404, quando o teste
// abre de propósito uma rota que não existe: o status é o que a 404 promete, e o teste o confere.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: { text: string; url: string }[] = [];
    const notFoundDocuments = new Set<string>();
    page.on("response", (response) => {
      if (response.request().isNavigationRequest() && response.status() === 404) {
        notFoundDocuments.add(response.url());
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push({ text: message.text(), url: message.location().url });
      }
    });
    page.on("pageerror", (error) => errors.push({ text: error.message, url: "" }));
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (event) => {
        console.error(`CSP: ${event.violatedDirective} bloqueou ${event.blockedURI}`);
      });
    });

    await use(page);

    const unexpected = errors.filter(
      ({ text, url }) =>
        !(notFoundDocuments.has(url) && text.startsWith("Failed to load resource")),
    );
    expect(
      unexpected.map(({ text, url }) => (url ? `${text} (${url})` : text)),
      "erros de console na página",
    ).toEqual([]);
  },
});

export { expect };
