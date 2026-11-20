import { test as base, expect } from "@playwright/test";

// Toda página aberta num teste termina sem erro de console, violação de CSP incluída.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (event) => {
        console.error(`CSP: ${event.violatedDirective} bloqueou ${event.blockedURI}`);
      });
    });

    await use(page);

    expect(errors, "erros de console na página").toEqual([]);
  },
});

export { expect };
