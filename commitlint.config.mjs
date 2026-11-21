// Conventional Commits nos títulos de PR (o `pr-title` da CI), que viram o assunto do
// commit da `main` no squash. O assunto é em português e pode começar com nome próprio,
// por isso sem a regra de caixa; o corpo não tem limite de linha.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "body-max-line-length": [0],
  },
};
