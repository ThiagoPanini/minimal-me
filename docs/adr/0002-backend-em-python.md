---
status: accepted
date: 2026-11-14
---

# Web em Next e API interna em Python, na régua panlabs-python-standards

O Marco 2 traz o primeiro backend do Minimal Me: Publicações, fotos, Rascunhos e a entrada do Autor. Decidimos manter a aplicação web em Next, a mesma que serve a Home do Marco 1, e pôr a lógica de Frames & Fables numa API em Python que segue a skill `panlabs-python-standards`, cujo espécime é o `apps/api` do life-under-control (Python, FastAPI, uv, com pyright strict, ruff e import-linter no gate). É o molde da frota, e não um desvio: monorepo com `apps/web` e `apps/api`, duas aplicações no Coolify e um Postgres por produto. A API fica interna, na rede do Coolify, e só a web é pública: o navegador nunca fala com a API.

## Considered Options

- **Aplicação única em Next**, com o servidor de Frames & Fables dentro da web: um deploy e uma linguagem, mas sem a régua de Python que o Autor quer para o backend. Foi o primeiro desenho do life-under-control (o ADR 0001 de lá), depois trocado por web mais API.
- **API pública em `api.<domínio>`**, prevista no ADR 0001 deste repositório para o caso de existir uma API pública: exporia ao navegador uma superfície de que nenhuma tela precisa.
- **Web em Next e API interna em Python** (escolhida).

## Consequences

- O layout do repositório nasce no Marco 1 já com lugar para `apps/api`, mas o Marco 1 cria só a web. A API, o banco e as travas de máquina do Python (pyright strict, ruff, import-linter, o CI como única autoridade) entram com o Marco 2.
- As três camadas da régua (domínio, aplicação e adaptadores) valem aqui porque Frames & Fables tem regra de domínio para testar sem infraestrutura: título e legenda, tamanho da Série, data nunca no futuro, Rascunho e publicada.
- A API é dona única do DDL dela, com as migrações na raiz da aplicação. As tabelas da entrada do Autor ficam fora dela (ADR 0003).
- A API distingue a leitura pública, que a web faz para renderizar a página de Frames & Fables, da ação do Autor, que chega com o token curto emitido pela web (ADR 0003).
- O `api.<domínio>` do ADR 0001 fica sem uso, e a exposição da API, que aquele ADR deixou em aberto, fica respondida.
- Toda funcionalidade de Frames & Fables cruza duas linguagens e um contrato interno. É o custo aceito em troca da régua.
