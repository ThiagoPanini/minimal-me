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

## Sistema vivo

Esta é a versão 1 do sistema. Ele vai mudar: o Autor ainda vai prototipar as telas de Frames & Fables, e esse protótipo pode acrescentar componentes e alterar regras. Quando mudar, altere `system/` primeiro, republique o Design System e só então ajuste as telas.

## O que vale como referência

- A Home v2.3 é o critério de aceite visual da home (Marco 1). Isso inclui o estado apagado das frentes em planejamento, com texto abaixo de 3:1 em repouso, registrado como escolha deliberada: o texto fica legível quando o card ganha foco.
- Onde `system/` e o protótipo divergirem, vale o protótipo, e `system/` é corrigido.
- Os textos da home valem como estão na v2.3 e podem ser ajustados a qualquer momento.

## No Claude Design

Os dois artefatos são privados e abrem com a conta do Autor.

- [Design System "Minimal Me"](https://claude.ai/artifact/StCJXsKtEb1sG39VzTbNzX): publicado a partir de `system/`. É dele que as próximas telas partem.
- [Comparativo v2.1 e v2.3](https://claude.ai/artifact/SA4dpdcuXn9NPSDs29ymLD): a home de referência, com as duas versões em abas.

Para republicar o Design System, envie os arquivos alterados de `system/` para o caminho `project/<mesmo caminho>` do artefato. As imagens e os SVG são uploads do próprio artefato, e as prévias os chamam por `/_blob/<id>`; por isso, abertas direto do repositório, as prévias aparecem sem imagem.

## Linhagem

- As rodadas 1 e 2 (direções Painel, Horizonte e Órbita, com gato, relógio e painéis de mangá) foram aposentadas. O histórico está em [Protótipos das direções visuais do MVP](https://github.com/ThiagoPanini/minimal-me/issues/21) e no branch `prototype/direcoes-visuais-rodada-1`.
- A Home v2.1 passou por uma revisão crítica que gerou a v2.2, com mudanças visíveis (índice no céu, negativos, folha de contato, diário). A v2.2 não foi adotada.
- A v2.3 é a v2.1 com seis correções que não mudam o que se vê: fontes embutidas, rolagem por teclado, foco visível na marca, abertura que espera as imagens, laço de animação que para em repouso e nível de standby por imagem.

## Pendências para a implementação

- Os tokens do protótipo têm nomes em português (`--chao`, `--luz`), e a convenção dos projetos de referência é código em inglês. A escolha fica para [Base técnica do Marco 1](https://github.com/ThiagoPanini/minimal-me/issues/17).
- Os efeitos vivos em canvas (poeira, luzes dos racks, folhas) e o alinhamento do bloco de texto pela altura das maiúsculas existem só no script do protótipo.
- O protótipo embute as fontes na página; como servi-las em produção também é decisão da Base técnica.
