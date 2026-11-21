# Design do Minimal Me

A identidade visual do Minimal Me nasce da Home v2.3, prototipada pelo Autor no Claude Design em 2026-11-09. Em 2026-11-13, o Autor escolheu a Home em Frestas II como protótipo do MVP. Em 2026-11-15, o MVP passou a ser só a Home, e sobrou um protótipo só. Esta pasta é a fonte que a implementação lê.

## O que há aqui

| Caminho | O que é |
|---|---|
| `system/README.md` | O guia do sistema, versão 2, escrito para a Home em Frestas II: princípios, conteúdo, cor, tipografia, grade, imagem, status de um space, movimento e acessibilidade. Comece por ele. |
| `system/tokens.json` | Cores, estilos de texto, espaços, raios e curvas, com o uso de cada um. |
| `system/components/` | Sete componentes da Home, cada um com guia (`README.md`) e prévia (`preview.html`), mais a capa do sistema (`Cover`). Os dos spaces são `SpaceSlit` (a fresta) e `StatusLine` (o status). |
| `system/fonts/` | Jost e IBM Plex Mono, pesos 300 e 400, em woff2: a combinação "Atual", que a Home em Frestas II mantém. As duas famílias usam a licença SIL OFL, cujo texto está em `OFL.txt`. |
| `system/assets/` | A marca em SVG, as ilustrações da abertura e dos spaces, o grão e as notas de uso de cada grupo. `Illustrations/illustrations.json` traz as camadas da abertura (texto alternativo, posição e profundidade) e o texto alternativo, o recorte e os dados das fotos vivas de cada ilustração de space. |
| `prototype/mvp/` | O protótipo do MVP: a Home em Frestas II, só ela, com os Tweaks congelados no valor em vigor. `index.html` abre num navegador e lê as fontes e as imagens de `system/`. |
| `o-que-muda-no-sistema-da-home.md` | O que a Home em Frestas II pediu do sistema, item a item, com motivo e lugar. Foi a fonte do ticket [Sistema de design v2: a Home com spaces](https://github.com/ThiagoPanini/minimal-me/issues/40), aplicado na versão 2 em 2026-11-20; fica como registro do porquê. |

## Sistema vivo

Esta é a versão 2 do sistema, de 2026-11-20, escrita para a Home em Frestas II no ticket [Sistema de design v2: a Home com spaces](https://github.com/ThiagoPanini/minimal-me/issues/40). A versão 1, da Home v2.3, está no histórico do git. Quando mudar, altere `system/` primeiro, republique o Design System e só então ajuste as telas.

## O que vale como referência

- A Home em Frestas II (`prototype/mvp/`) é a referência da Home, a única tela do MVP. A abertura e o rodapé são os da v2.3, idênticos; muda da seção de spaces para baixo. O status aparece só no rótulo, e só "Em desenvolvimento" tem cor, o âmbar `status-in-development`.
- Os Tweaks da comparação foram congelados. O valor em vigor de cada um:

  | Tweak | Valor | Origem |
  |---|---|---|
  | Status | Frames & Songs "Em desenvolvimento"; os outros três "Em planejamento" | [Critérios de aceite da home](https://github.com/ThiagoPanini/minimal-me/issues/12#issuecomment-6888187054) |
  | Ordem | a da lista | idem |
  | Fotos vivas | acordam com o foco | idem |
  | Fontes e texto corrido | "Atual" (Jost e IBM Plex Mono), texto em mono | idem |
  | Voz dos textos | primeira pessoa | idem |
  | Densidade e movimento | arejada e sutil | o padrão da comparação, sem decisão registrada (hipótese) |
  | Recortes das fotos | os padrões da página, por largura | idem |

- Onde `system/` e o protótipo divergirem, vale o protótipo, e `system/` é corrigido.
- Os textos dos spaces são de amostra e podem ser ajustados a qualquer momento. As quatro ilustrações são as do sistema. O texto de Frames & Songs foi escrito em 2026-11-15, na renomeação, e descreve só o conceito confirmado: fotos e vídeos em carrossel, cada post com a música do momento.

## No Claude Design

Os dois artefatos são privados e abrem com a conta do Autor.

- [Design System "Minimal Me"](https://claude.ai/artifact/StCJXsKtEb1sG39VzTbNzX): publicado a partir de `system/`. É dele que as próximas telas partem.
- [Minimal Me - Protótipo do MVP](https://claude.ai/artifact/MaREP6JtaMXcKG3DW5Mb5m): o protótipo navegável da Home, numa prancha só (rolagem, foco nos spaces e, em "Acessar", o aviso de que o space ainda não está disponível). A versão publicada é a 3, `1794762115-8fc7`, de 2026-11-15. É o mesmo conteúdo de `prototype/mvp/index.html`: o tipo Design não aceita `data:` nem `<iframe>`, então no artefato as fontes, as imagens, o CSS e o JS são assets enviados, e a prancha `Main.dc.html` só carrega o markup.

Para republicar o Design System depois de mudar `system/`:

1. Monte uma pasta temporária com os arquivos alterados em `project/<mesmo caminho de system/>`. As imagens e os SVG de `assets/` não entram: são uploads do próprio artefato. Os textos de `assets/` (os `README.md` e o `illustrations.json`) entram como arquivos.
2. Leia `project/design-system.json` do artefato na hora, mude só o que o seu trabalho tocou (`lastChange`, um grupo ou um registro de asset) e envie-o por último.
3. Publique tudo numa chamada só. Cada caminho removido ou renomeado vai com `null`; sem isso, o arquivo antigo continua no artefato.
4. Para uma imagem nova, suba como asset do artefato, registre no índice e use na prévia o `/_blob/<id>` devolvido.
5. As prévias chamam as imagens por `/_blob/<id>`; por isso, abertas direto do repositório, aparecem sem imagem.

## Linhagem

- **Antes de 2026-11-15** esta pasta guardava `prototype/mvp-2026-11-13/` (o Comparativo, com as versões de Home Vitrine, Mosaico e Frestas II, a página de Frames & Fables em Grade, a camada do Autor e a página "O que muda no sistema"), `prototype/home-v2.3/` e `prompts/`. As duas pastas de protótipo e os prompts estão no commit `1551e5b` da `main`: `git show 1551e5b:docs/design/prototype/mvp-2026-11-13/index.html`.
- **Rodadas 1 e 2** (direções Painel, Horizonte e Órbita, com gato, relógio e painéis de mangá) foram aposentadas. O histórico está em [Protótipos das direções visuais do MVP](https://github.com/ThiagoPanini/minimal-me/issues/21) e no branch `prototype/direcoes-visuais-rodada-1`.
- **Home v2.1, v2.2 e v2.3.** A v2.1 passou por uma revisão crítica que gerou a v2.2, que não foi adotada. A v2.3 é a v2.1 com seis correções que não mudam o que se vê: fontes embutidas, rolagem por teclado, foco visível na marca, abertura que espera as imagens, laço de animação que para em repouso e nível de standby por imagem. A abertura e o rodapé da Frestas II vêm dela.
- **A Home com spaces** (cinco rodadas): saíram Em linha, Lugares, Frase, Dupla exposição, Sumário, Faixas, Frestas, Vitrine e Mosaico, e o "Backup" com a v2.3. Em 2026-11-13, o Autor escolheu Frestas II.
- **Frames & Fables** (a página em Grade e a camada do Autor, rodadas 6 e 7, mais a primeira rodada das telas, descartada em 2026-11-10) saiu do MVP em 2026-11-15, e o space passou a se chamar **Frames & Songs**: fotos e vídeos num carrossel, cada post com uma música pessoal que representa o momento. O conceito será especificado e prototipado em grilling futuro ([mapa #34](https://github.com/ThiagoPanini/minimal-me/issues/34)). O material antigo é insumo a revalidar, não ponto de partida.
- **Artefatos apagados do claude.ai em 2026-11-15:** o Comparativo, "Minimal Me · Frames & Fables, protótipo das telas", Home v2.1 e a revisão crítica dela, Direções Visuais, Home 01', 02 Matéria Digital, 04′ Know it all, "[OLD] Minimal Me · Initial Draft" e quatro telas em branco sem título.
- **Como `prototype/mvp/index.html` nasceu:** é a Frestas II extraída do Comparativo, com Frames & Fables renomeado para Frames & Songs (nome, texto, rótulos de acessibilidade e comentários), os identificadores em inglês pela tabela "Nomes", as fontes lidas de `system/fonts/` e os Tweaks no valor em vigor. Sem a barra da comparação.
- **Sistema v2 (2026-11-20).** Frente virou space em todo o sistema; `FrontCard` e `StatusBadge` saíram, e entraram `SpaceSlit` e `StatusLine`; saíram os tokens `off-*`, `badge-bg`, `badge-text`, `rhythm-*` e `badge-inset`, e `badge-border` virou `toast-border`; entrou a cor `status-in-development`. As oito imagens saíram de `prototype/mvp/img/` para `system/assets/`, e o protótipo passou a lê-las de lá. A versão 1 está no commit `c0ed7d7`.

## Nomes

Tudo o que é código tem nome em inglês: tokens, estilos de texto, componentes, classes, pastas e arquivos do sistema. Guias, notas de uso e textos da interface ficam em português, com a exceção de space (ver `CODING_STANDARDS.md`).

O protótipo do MVP já segue essa regra. Os protótipos antigos, recuperáveis pelo commit de linhagem, têm variáveis e arquivos em português. A correspondência com o sistema:

| No protótipo antigo | No sistema |
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

No protótipo do MVP, as classes têm nomes curtos da comparação. A correspondência com os componentes:

| No protótipo do MVP | No sistema |
|---|---|
| `.inset`, `.inset-top`, `.inset-foot` (dentro de `.insets`) | `SpaceSlit` |
| `.status-line` | `StatusLine` |
| `.r-head` | `SectionHeader` |
| `.toast` | `Toast` |
| `--st-dev` | `status-in-development` |
| `data-status="dev"`, `"plan"`, `"ok"` | `SpaceStatus`: `in-development`, `planned`, `available` |

## Pendências para a implementação

- Os efeitos vivos em canvas (as folhas de Write & Learn, as luzes de Code & Share, os arcos de som de Music & Feeling, o enquadramento e o disparo de Frames & Songs) e o alinhamento do bloco de texto pela altura das maiúsculas existem só no script do protótipo. Os dados de cada efeito estão em `system/assets/Illustrations/illustrations.json`; o desenho, no script. Trocar uma ilustração obriga a refazer os dados dela.
- As fontes vão ao ar pela própria Home, como decidiu [Base técnica do Marco 1](https://github.com/ThiagoPanini/minimal-me/issues/17): `apps/web/design-system/fonts.ts` lê os woff2 de `system/fonts/` por `next/font/local` no build, e o export os serve com hash no nome, sem pedido a terceiros e sem cópia no repositório. Faltar um arquivo que a Home usa quebra o build. O texto da SIL OFL está em `system/fonts/OFL.txt`. No protótipo, `index.html` continua lendo os woff2 de `system/fonts/`.
- No protótipo, a página rola dentro de um `main` fixo. Em produção, como decidiu a spec do [Marco 1](https://github.com/ThiagoPanini/minimal-me/issues/57), ela rola no próprio documento: a rolagem, o teclado, a barra do navegador do celular e o "voltar" funcionam como em qualquer site. A marca da abertura e "voltar ao início ↑" são links para o topo da página (`#top`) que funcionam sem script, e a rolagem até lá é suave só quando o Visitante não pediu movimento reduzido.
