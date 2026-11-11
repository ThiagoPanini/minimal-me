# Design do Minimal Me

A identidade visual do Minimal Me nasce da Home v2.3, prototipada pelo Autor no Claude Design em 2026-11-09. Esta pasta é a fonte que a implementação lê.

## O que há aqui

| Caminho | O que é |
|---|---|
| `system/README.md` | O guia do sistema: princípios, conteúdo, cor, tipografia, grade, imagem, estados de uma frente, movimento e acessibilidade. Comece por ele. |
| `system/tokens.json` | Cores, estilos de texto, espaços, raios e curvas, com o uso de cada um. |
| `system/components/` | Sete componentes da home, cada um com guia (`README.md`) e prévia (`preview.html`), mais a capa do sistema (`Cover`). |
| `system/fonts/` | Jost e IBM Plex Mono, pesos 300 e 400, em woff2. São os subconjuntos embutidos no protótipo; as duas famílias usam a licença SIL OFL. |
| `system/assets/` | A marca em SVG e as notas de uso de cada grupo de imagens. |
| `prototype/home-v2.3/` | A página de referência, arquivada como foi publicada, com as seis imagens. Abra `index.html` num navegador. |
| `prompts/` | Os prompts que o Autor cola no Claude Design para pilotar um protótipo. Hoje: `frames-and-fables.md` e `home-spaces.md`. |

## Sistema vivo

Esta é a versão 1 do sistema. Ele vai mudar: o Autor ainda vai prototipar as telas de Frames & Fables, e esse protótipo pode acrescentar componentes e alterar regras. Quando mudar, altere `system/` primeiro, republique o Design System e só então ajuste as telas.

## O que vale como referência

- A Home v2.3 é o critério de aceite visual da home (Marco 1). Isso inclui o estado apagado das frentes em planejamento, com texto abaixo de 3:1 em repouso, registrado como escolha deliberada: o texto fica legível quando o card ganha foco.
- Desde 2026-11-10 a home está em revisão: as frentes viram spaces, e entra um quarto, Music & Feeling. A abertura fica como está; o que muda é da seção das frentes para baixo. O prompt está em `prompts/home-spaces.md`. Até o Autor escolher uma versão, a v2.3 continua valendo.
- Onde `system/` e o protótipo divergirem, vale o protótipo, e `system/` é corrigido.
- Os textos da home valem como estão na v2.3 e podem ser ajustados a qualquer momento.

## No Claude Design

Os dois artefatos são privados e abrem com a conta do Autor.

- [Design System "Minimal Me"](https://claude.ai/artifact/StCJXsKtEb1sG39VzTbNzX): publicado a partir de `system/`. É dele que as próximas telas partem.
- [Comparativo v2.1 e v2.3](https://claude.ai/artifact/SA4dpdcuXn9NPSDs29ymLD): a home de referência, com as duas versões em abas.

Para republicar o Design System depois de mudar `system/`:

1. Monte uma pasta temporária com os arquivos alterados em `project/<mesmo caminho de system/>`. As imagens e os SVG de `assets/` não entram: são uploads do próprio artefato.
2. Leia `project/design-system.json` do artefato na hora, mude só o que o seu trabalho tocou (`lastChange`, um grupo ou um registro de asset) e envie-o por último.
3. Publique tudo numa chamada só. Cada caminho removido ou renomeado vai com `null`; sem isso, o arquivo antigo continua no artefato.
4. Para uma imagem nova, suba como asset do artefato, registre no índice e use na prévia o `/_blob/<id>` devolvido.
5. As prévias chamam as imagens por `/_blob/<id>`; por isso, abertas direto do repositório, aparecem sem imagem.

## Linhagem

- As rodadas 1 e 2 (direções Painel, Horizonte e Órbita, com gato, relógio e painéis de mangá) foram aposentadas. O histórico está em [Protótipos das direções visuais do MVP](https://github.com/ThiagoPanini/minimal-me/issues/21) e no branch `prototype/direcoes-visuais-rodada-1`.
- A Home v2.1 passou por uma revisão crítica que gerou a v2.2, com mudanças visíveis (índice no céu, negativos, folha de contato, diário). A v2.2 não foi adotada.
- A v2.3 é a v2.1 com seis correções que não mudam o que se vê: fontes embutidas, rolagem por teclado, foco visível na marca, abertura que espera as imagens, laço de animação que para em repouso e nível de standby por imagem.
- A primeira rodada das telas de Frames & Fables, no artefato "Minimal Me · Frames & Fables, protótipo das telas" (2026-11-10), foi descartada pelo Autor: ficou diferente do imaginado e não serve de referência nem de inspiração.

## Nomes

Tudo o que é código tem nome em inglês: tokens, estilos de texto, componentes, classes, pastas e arquivos do sistema. Guias, notas de uso e textos da interface ficam em português. A regra do repositório está em `AGENTS.md`.

O protótipo arquivado é a exceção: fica como o Autor publicou, com variáveis e arquivos em português. A correspondência com o sistema:

| No protótipo | No sistema |
|---|---|
| `--chao` | `ground` |
| `--ceu` | `sky` |
| `--tinta` | `ink` |
| `--luz` | `light` |
| `--corpo` | `body` |
| `--texto` | `text` |
| `--nevoa` | `mist` |
| `--fio` | `hairline` |
| `--sans`, `--mono` | `--font-sans`, `--font-mono` |
| `img/ceu.webp`, `img/dunas.webp` | `sky.webp`, `dunes.webp` |

## Pendências para a implementação

- Os efeitos vivos em canvas (poeira, luzes dos racks, folhas) e o alinhamento do bloco de texto pela altura das maiúsculas existem só no script do protótipo.
- O protótipo embute as fontes na página; como servi-las em produção é decisão de [Base técnica do Marco 1](https://github.com/ThiagoPanini/minimal-me/issues/17).
