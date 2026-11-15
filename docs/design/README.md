# Design do Minimal Me

A identidade visual do Minimal Me nasce da Home v2.3, prototipada pelo Autor no Claude Design em 2026-11-09. Em 2026-11-13, o Autor escolheu o protótipo do MVP: a Home em Frestas II e a página de Frames & Fables na forma Grade, com a camada do Autor. Esta pasta é a fonte que a implementação lê.

## O que há aqui

| Caminho | O que é |
|---|---|
| `system/README.md` | O guia do sistema, versão 1, escrito para a Home v2.3: princípios, conteúdo, cor, tipografia, grade, imagem, estados de uma frente, movimento e acessibilidade. Comece por ele, sabendo o que a versão 2 muda (abaixo). |
| `system/tokens.json` | Cores, estilos de texto, espaços, raios e curvas, com o uso de cada um. |
| `system/components/` | Sete componentes da Home v2.3, cada um com guia (`README.md`) e prévia (`preview.html`), mais a capa do sistema (`Cover`). |
| `system/fonts/` | Jost e IBM Plex Mono, pesos 300 e 400, em woff2: a combinação "Atual", que a Home em Frestas II mantém. As duas famílias usam a licença SIL OFL. |
| `system/assets/` | A marca em SVG e as notas de uso de cada grupo de imagens. |
| `prototype/mvp-2026-11-13/` | O protótipo do MVP, arquivado como foi publicado: a Home em Frestas II (tecla 3), a página de Frames & Fables na forma Grade (tecla 4), a mesma página com a camada do Autor (tecla 5), a linhagem (Vitrine e Mosaico, teclas 1 e 2) e a página "O que muda no sistema". Abra `index.html` num navegador. |
| `prototype/home-v2.3/` | A Home v2.3, arquivada como foi publicada. É linhagem: a abertura e o rodapé da Frestas II vêm dela. |
| `prompts/` | Os prompts que o Autor cola no Claude Design para pilotar um protótipo: `home-spaces.md` (a Home com spaces) e `frames-and-fables-page.md` (a página de Frames & Fables). |

## Sistema vivo

Esta é a versão 1 do sistema, escrita para a Home v2.3. O protótipo do MVP pede a versão 2, que entra em três levas, cada uma num ticket que bloqueia a implementação das telas que a usam:

- [Sistema de design v2: a Home com spaces](https://github.com/ThiagoPanini/minimal-me/issues/40), no Marco 1;
- [Sistema de design v2: a página de Frames & Fables](https://github.com/ThiagoPanini/minimal-me/issues/41), depois do acabamento da Grade, no Marco 2;
- [Sistema de design v2: a camada do Autor](https://github.com/ThiagoPanini/minimal-me/issues/42), depois do redesenho do publicador, no Marco 2.

O que cada leva leva está na página "O que muda no sistema" do protótipo arquivado, por seção: `#comum`, `#v-frestas-2` e `#fotos` para a Home; `#ff-pagina` e `#ff-grade` para a página; `#ff-autor` e `#ff-bastidor` para o Autor. Quando mudar, altere `system/` primeiro, republique o Design System e só então ajuste as telas.

## O que vale como referência

- A Home em Frestas II é a referência da Home (Marco 1). A abertura e o rodapé são os da v2.3, idênticos; muda da seção de spaces para baixo. O status aparece só no rótulo, e só "Em desenvolvimento" tem cor, o âmbar `#E8B96A`. O estado apagado da v2.3 deixa de existir.
- A página de Frames & Fables na forma Grade, com a camada do Autor, é a referência do Marco 2 em requisitos e comportamento. O desenho da rodada 7 (o acabamento da Grade e a experiência do Autor) vai ser refeito no Claude Design ([#38](https://github.com/ThiagoPanini/minimal-me/issues/38) e [#39](https://github.com/ThiagoPanini/minimal-me/issues/39)); até lá, vale o protótipo arquivado.
- O padrão de cada Tweak é a hipótese em vigor; as outras opções são alternativas vistas e não escolhidas. Onde o Autor decidiu outra coisa, vale a decisão, registrada no mapa do marco. Por exemplo: cor na foto aberta, onde o padrão deixa preto e branco; voz em primeira pessoa, onde o padrão é a da v2.3.
- Onde `system/` e o protótipo divergirem, vale o protótipo, e `system/` é corrigido.
- Textos e fotos do protótipo são de amostra. Os textos dos spaces na Home são os da voz em primeira pessoa (seção `#voz` da página "O que muda no sistema"); as fotos de amostra nunca vão para produção.

## No Claude Design

Os dois artefatos são privados e abrem com a conta do Autor.

- [Design System "Minimal Me"](https://claude.ai/artifact/StCJXsKtEb1sG39VzTbNzX): publicado a partir de `system/`. É dele que as próximas telas partem.
- [Minimal Me - Comparativo da home com spaces](https://claude.ai/artifact/SA4dpdcuXn9NPSDs29ymLD): o artefato de trabalho do MVP, com Vitrine, Mosaico, Frestas II, Grade e Autor, os Tweaks e a página "O que muda no sistema". O arquivo em `prototype/mvp-2026-11-13/` é a versão `1794705133-8fc5`, de 2026-11-13. O artefato também carrega uma pasta `pacote/`, de leitura para agentes, que fica fora do repositório.

Para republicar o Design System depois de mudar `system/`:

1. Monte uma pasta temporária com os arquivos alterados em `project/<mesmo caminho de system/>`. As imagens e os SVG de `assets/` não entram: são uploads do próprio artefato.
2. Leia `project/design-system.json` do artefato na hora, mude só o que o seu trabalho tocou (`lastChange`, um grupo ou um registro de asset) e envie-o por último.
3. Publique tudo numa chamada só. Cada caminho removido ou renomeado vai com `null`; sem isso, o arquivo antigo continua no artefato.
4. Para uma imagem nova, suba como asset do artefato, registre no índice e use na prévia o `/_blob/<id>` devolvido.
5. As prévias chamam as imagens por `/_blob/<id>`; por isso, abertas direto do repositório, aparecem sem imagem.

## Linhagem

- As rodadas 1 e 2 (direções Painel, Horizonte e Órbita, com gato, relógio e painéis de mangá) foram aposentadas. O histórico está em [Protótipos das direções visuais do MVP](https://github.com/ThiagoPanini/minimal-me/issues/21) e no branch `prototype/direcoes-visuais-rodada-1`.
- A Home v2.1 passou por uma revisão crítica que gerou a v2.2, com mudanças visíveis (índice no céu, negativos, folha de contato, diário). A v2.2 não foi adotada.
- A v2.3 é a v2.1 com seis correções que não mudam o que se vê: fontes embutidas, rolagem por teclado, foco visível na marca, abertura que espera as imagens, laço de animação que para em repouso e nível de standby por imagem. Saiu do comparativo e fica só em `prototype/home-v2.3/`.
- A primeira rodada das telas de Frames & Fables, no artefato "Minimal Me · Frames & Fables, protótipo das telas" (2026-11-10), foi descartada pelo Autor: ficou diferente do imaginado e não serve de referência nem de inspiração.
- A Home com spaces (rodadas 1 a 5 do comparativo, a partir de `prompts/home-spaces.md`): saíram Em linha, Lugares, Frase, Dupla exposição, Sumário, Faixas e Frestas, além do "Backup" com a v2.3. Em 2026-11-13, o Autor escolheu Frestas II; Vitrine e Mosaico ficam no comparativo como linhagem.
- A página de Frames & Fables (rodadas 6 e 7, a partir de `prompts/frames-and-fables-page.md`): saíram Pausas, Meses, Rolo e Parede, e ficou a Grade. A rodada 7 acrescentou a camada do Autor.

## Nomes

Tudo o que é código tem nome em inglês: tokens, estilos de texto, componentes, classes, pastas e arquivos do sistema. Guias, notas de uso e textos da interface ficam em português, com a exceção de space (ver `AGENTS.md`).

Os protótipos arquivados são a exceção: ficam como o Autor publicou. Na v2.3 e na Frestas II, as variáveis e os arquivos estão em português; nas páginas de Frames & Fables, os nomes já seguem os tokens. A correspondência com o sistema:

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

- Os efeitos vivos em canvas (as folhas de Write & Learn, as luzes de Code & Share, os arcos de som de Music & Feeling, o enquadramento e o disparo de Frames & Fables) e o alinhamento do bloco de texto pela altura das maiúsculas existem só no script do protótipo. Cada efeito depende dos dados da sua ilustração: trocar uma ilustração obriga a refazê-los.
- O protótipo embute as fontes na página; como servi-las em produção é decisão de [Base técnica do Marco 1](https://github.com/ThiagoPanini/minimal-me/issues/17).
- Na Frestas II, como na v2.3, a página rola dentro de um `main` fixo; a spec do Marco 1 diz como ela rola em produção.
