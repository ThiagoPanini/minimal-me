// Conventional Commits nas mensagens de commit (gancho `commit-msg`) e nos títulos de PR
// (o `pr-title` da CI), que viram o assunto do commit da `main` no squash. O assunto é em
// português e pode começar com nome próprio, por isso sem a regra de caixa; o corpo não tem
// limite de linha.
//
// Os títulos do Dependabot (`build(deps): bump ...`, em inglês, como exceção de robô) passam de
// 100 caracteres quando citam o diretório e o grupo, como `bump node from 24.22.3-trixie-slim to
// 24.23.0-trixie-slim in /apps/web in the docker group`. Para eles o cabeçalho não tem limite; para
// o resto, segue o de 100 do config-conventional. `scripts/commit-titles.test.mjs` confere os dois.
const dependabotHeader = /^build\(deps\): bump /i;
const headerLimit = 100;

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "header-max-length-except-dependabot": ({ header }, _when, value) => {
          const text = header ?? "";
          return [
            dependabotHeader.test(text) || text.length <= value,
            `o cabeçalho passa de ${value} caracteres: tem ${text.length}`,
          ];
        },
      },
    },
  ],
  rules: {
    "subject-case": [0],
    "body-max-line-length": [0],
    "header-max-length": [0],
    "header-max-length-except-dependabot": [2, "always", headerLimit],
  },
};
