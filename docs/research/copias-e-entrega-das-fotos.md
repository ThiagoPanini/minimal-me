# Cópias e entrega das fotos

Pesquisa do ticket [#35](https://github.com/ThiagoPanini/minimal-me/issues/35), parte do mapa do Marco 2 (Frames & Fables). Consultei a documentação da Cloudflare (R2, cache, purge e certificados), o MDN, o caniuse, o Pillow, o Next.js, o ogp.me e as páginas oficiais de Facebook, WhatsApp, LinkedIn, Apple e Slack, e medi o palco do protótipo e sete fotos codificadas no Pillow 13.

## Retomada

- **Estado**: completo.
- **Coberto**: seções 0–7 e a recomendação para a spec.
- **Pendente**: as medidas do card do X vêm só da página legada, que hoje redireciona; Telegram e Discord não têm página oficial sobre prévia de link. Ficam para conferir no primeiro deploy, com um teste de cinco minutos cada: a cópia entre depósitos com `CopyObject`, o `Cache-Control` devolvido pelo domínio do depósito e o tempo de codificação na VPS (medi num notebook).
- **Data**: 2026-11-14.

**Decisões que esta pesquisa toma como dadas** (decididas pelo Autor em 2026-11-14, no [ADR 0004](https://github.com/ThiagoPanini/minimal-me/blob/main/docs/adr/0004-guarda-das-fotos.md) e no [mapa #34](https://github.com/ThiagoPanini/minimal-me/issues/34)): guarda no R2, com originais num depósito privado e cópias públicas só de publicação publicada, num endereço da zona; despublicar e excluir tiram as cópias do ar e limpam o cache; cinza na página e cor na foto aberta; compartilhamento com a cópia cheia; série de até 6 fotos. O que não vem de fonte está marcado como **inferência**; o que eu medi está marcado como **medido**.

## 0. Como medi

- **Protótipo.** As medidas e o comportamento vêm do protótipo arquivado em `docs/design/prototype/mvp-2026-11-13/` (a Grade e a camada do Autor), medido numa varredura de 2026-11-14 cujos relatórios ficaram fora do repositório.
- **Palco da foto aberta.** Abri a Grade do protótipo no Chromium headless (`chrome-headless-shell` 1243), com fotos de marcação no lugar das reais, e medi o palco e a foto aberta. Em CSS px: a 390×844, palco de 350 × 704,6; a 1440×900, 1313,3 × 742; a 1920×1080, 1776 × 922. Os quadros conferem com a medição da varredura de 2026-11-14: 173,5 e 348 a 390; 327,1 e 655,1 a 1440×900.
- **Formatos.** Pillow 13.0.0 (libwebp 1.6.0, libavif 1.4.2 com libaom, libjpeg-turbo) e Python 3.12, num Intel i7-12700H com 20 threads. Sete fotos do Wikimedia Commons, de licença livre: cinco paisagens 3:2 ou 4:3 (as maiores que 3840 px vieram reduzidas a 3840 pelo próprio Commons), um retrato 2:3 de 2000 × 3008 e um panorama de 3,75:1. Cada cópia sai delas por redução LANCZOS. Para cada cópia, codifiquei JPEG (`optimize`, `progressive`), WebP e AVIF em várias qualidades, medi bytes e tempo (o menor de duas rodadas) e a SSIM de luminância em janelas de 8×8 contra a cópia sem perda. A comparação "com qualidade igual" interpola o WebP e o AVIF até a SSIM do JPEG de qualidade 80, o mesmo critério do estudo do Google (seção 1). O custo do conjunto inteiro de cópias usa o enquadramento padrão (centro, aproximação 1). Os metadados foram testados com uma imagem sintética com EXIF (modelo e GPS), XMP e perfil de cor.
- **Limites da medição.** A SSIM de luminância não enxerga cor; sete fotos é amostra pequena; as fontes já eram JPEG; o tempo é de um notebook, não da VPS.

## 1. Formato e qualidade das cópias públicas

Fontes: https://caniuse.com/webp e https://caniuse.com/avif (dados de https://github.com/Fyrd/caniuse, lidos em 2026-11-14) · https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types (modificada em 2026-11-05) · https://developers.google.com/speed/webp/docs/webp_study · https://web.dev/articles/compress-images-avif (2021) · https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html · https://pillow.readthedocs.io/en/stable/releasenotes/11.3.0.html · https://pypi.org/project/pillow/

**Suporte nos navegadores**
- caniuse, uso global: WebP com suporte total em 97,24% (mais 0,08% parcial); AVIF em 96,69% (mais 0,02% parcial). A diferença entre os dois é de meio ponto.
- WebP desde Chrome 32, Edge 18, Firefox 65, Safari 16.0 e iOS Safari 14; o Safari 14 a 15.6 tem suporte total, mas só no macOS 11 ou mais novo (caniuse, nota 3).
- AVIF desde Chrome 85, Edge 121, Firefox 93, Safari 16.4 e iOS Safari 16.0; o Safari 16.1 a 16.3 é parcial: só imagem parada, só no macOS 13 ou mais novo e sem "noise synthesis" (caniuse, notas 2 a 4).
- JPEG: "All versions of Chrome, Edge, Firefox, Opera, and Safari" (MDN).
- O MDN pede alternativa para os dois formatos novos: para AVIF, "you should provide a fallback in WebP, JPEG or PNG format using the `<picture>` element"; para WebP, "Provide a fallback in either JPEG or PNG format". Com 97% de suporte, uma alternativa em JPEG custaria uma cópia a mais por tamanho para servir menos de 3% do uso (**inferência**).
- O AVIF "does not support progressive rendering, so files must be fully downloaded before they can be displayed" (MDN). Na foto aberta, a maior cópia aparece de uma vez, e não aos poucos.

**Peso típico, pelas fontes**
- WebP: "Lossy WebP images are on average 25–35% smaller than JPEG images of visually similar compression levels" (MDN); "WebP achieves 25%-34% smaller file sizes compared to JPEG at the same Structural Similarity (SSIM) index" (Google).
- AVIF: "lossy AVIF images are around 50% smaller than JPEG images"; contra o WebP, "median 50% vs. 30% compression for the same JPG set", citando o CTRL Blog (MDN). O web.dev fala em "greater than 50% savings vs. JPEG".

**Peso e custo medidos** (**medido**, medianas das sete fotos; "mesma SSIM" = a SSIM de luminância do JPEG q80 da mesma foto; tempo de uma codificação, com o AVIF usando as 20 threads na velocidade 6)

| Cópia | JPEG q80 | WebP, mesma SSIM | AVIF, mesma SSIM |
|---|---|---|---|
| 480 no lado menor (a `-s` do protótipo) | 67 KB, 7 ms | 49 KB (0,77 do JPEG), 30 ms | 46 KB (0,69), 144 ms |
| quadrada de 640 | 95 KB, 8 ms | 68 KB (0,78), 40 ms | 65 KB (0,70), 154 ms |
| inteira contida em 1400 | 171 KB, 21 ms | 154 KB (0,79), 109 ms | 119 KB (0,70), 191 ms |
| quadrada de 1280 | 319 KB, 32 ms | 289 KB (0,85), 132 ms | 239 KB (0,72), 266 ms |
| inteira contida em 2400 | 424 KB, 43 ms | 422 KB (0,83), 329 ms | 317 KB (0,72), 418 ms |

- Com a mesma SSIM, o WebP ficou de 0,77 a 0,85 do JPEG, e o AVIF de 0,69 a 0,72: o AVIF fica de 10% a 15% abaixo do WebP. O ganho é menor que o das fontes. Duas causas prováveis: a SSIM de luminância tende a desfavorecer o AVIF, que suaviza, e as fontes já eram JPEG (**inferência**).
- Para chegar à SSIM do JPEG q80, o WebP precisou de qualidade entre 61 e 88, conforme a foto (folhagem pede menos, céu liso pede mais); o AVIF, de 61 a 69.
- Com o padrão do Pillow, WebP q80 e `method` 4, a SSIM ficou igual ou acima da do JPEG q80 em quatro das cinco cópias, com 82% a 95% dos bytes.
- `method` 6 no WebP poupou de 2% a 3%, em 2,2 a 3,3 vezes o tempo. No AVIF, a velocidade 8 gerou arquivos de 0% a 5% maiores que a 6, em menos da metade do tempo; a velocidade 4 deu o mesmo tamanho, com SSIM só um pouco maior, e levou até 3,5 s.
- Numa thread só, o AVIF na velocidade 6 levou de 0,8 a 0,9 s na inteira de 1400 e de 2,3 a 2,7 s na de 2400; o WebP, 0,1 e 0,26 s.
- **O conjunto inteiro de uma foto** (decodificar, endireitar, reduzir e codificar as cópias recomendadas na seção 2), numa thread:

| Formato | Foto que não é capa | Capa | Publicação de 6 fotos | Cópias da capa somadas |
|---|---|---|---|---|
| WebP q80, `method` 4 | 0,54 s | 1,07 s | ~3,8 s | 1,5 MB |
| AVIF q65, velocidade 8 | 0,98 s | 2,17 s | ~7,1 s | 1,1 MB |
| AVIF q65, velocidade 6 | 2,41 s | 5,21 s | ~17,2 s | 1,1 MB |

**Codificar no Pillow**
- A versão atual é a 13.0.0, de 2026-10-16 (PyPI).
- AVIF entrou nas rodas do Pillow na 11.3.0: "Support for reading and writing AVIF images is now included in Pillow's wheels, except for Windows ARM64 and iOS. libaom is available as an encoder and dav1d as a decoder." Antes disso, na 11.2.1, só compilando com libavif.
- Opções de gravação (documentação do Pillow):
  - JPEG: `quality` de 0 a 95, padrão 75 ("Values above 95 should be avoided"); `optimize` faz "an extra pass over the image in order to select optimal encoder settings"; `progressive` grava JPEG progressivo.
  - WebP: `quality` de 0 a 100, padrão 80; `method` de 0 a 6, padrão 4 ("Quality/speed trade-off (0=fast, 6=slower-better)").
  - AVIF: `quality` de 0 a 100, padrão 75; `speed` de 0 a 10, padrão 6 ("0=slower/better, 10=fastest"); `max_threads` sem limite por padrão; `subsampling` padrão 4:2:0; "It is only possible to save 8-bit AVIF images".
  - O web.dev recomenda a velocidade 6 do libaom como "a balance of encode speed, compression efficiency, and quality", e diz que 8 threads aceleram "roughly 5x".
- Metadados, pela documentação: o JPEG grava EXIF só se receber `exif`, e, sem `icc_profile`, "the image will be saved with no profile attached"; o WebP e o AVIF têm as mesmas opções `exif`, `xmp` e `icc_profile`.
- Metadados, **medido** no Pillow 13:
  - a cópia reduzida guarda `exif`, `xmp` e `icc_profile` no `info` do objeto em memória;
  - ainda assim, gravada sem esses parâmetros, nenhum dos três formatos escreve o EXIF (nem modelo nem GPS) ou o XMP. "Sem lugar nem aparelho" sai de graça.
  - O perfil de cor é diferente: o AVIF o leva sozinho, e o JPEG e o WebP o perdem.
  - Sem perfil, uma foto de celular em Display P3 perde saturação na cópia (**inferência**). Converter para sRGB, ou passar `icc_profile` de propósito, é decisão da pesquisa de envio e conversão (#36).

## 2. Tamanhos: o que cada caso pede e quantas cópias bastam

Fontes: protótipo arquivado (na Grade, as colunas, o quadro grande e a escolha da cópia; na camada do Autor, a aproximação de até 3×), medido na varredura de 2026-11-14, e a medição da seção 0 · https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img (modificada em 2026-09-11) · https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images · https://github.com/mdn/browser-compat-data (`html.elements.img.sizes.auto`) · https://nextjs.org/docs/app/api-reference/components/image (2026-11-06)

**Pixels que a grade pede** (lado do quadro × densidade; com o recorte por CSS do protótipo, a cópia inteira precisa desse valor vezes a aproximação no lado menor)

| Caso | Quadro (CSS) | Pixels do quadro | Lado menor da cópia a 2× | a 3× |
|---|---|---|---|---|
| Pequeno a 390, densidade 3 | 173,5 | 520 | 1041 | 1562 |
| Grande a 390, densidade 3 | 348 | 1044 | 2088 | 3132 |
| Pequeno a 1440×900, densidade 2 | 327,1 | 654 | 1308 | 1963 |
| Grande a 1440×900, densidade 2 | 655,1 | 1310 | 2620 | 3931 |
| Pequeno a 390, densidade 2 (o teto do protótipo) | 173,5 | 347 | 694 | 1041 |
| Grande a 1920×1080, densidade 2 | 806,5 | 1613 | 3226 | 4839 |

**O que as duas cópias do protótipo entregam** (pixels da cópia dentro do quadrado ÷ pixels do quadro; abaixo de 1, o navegador amplia e a foto amolece)

| Caso, foto 3:2 | Cópia que o protótipo pede | Aproximação 1 | 2 | 3 |
|---|---|---|---|---|
| Pequeno a 390, densidade 3 | `-s` (720 × 480) | 0,92 | 0,46 | 0,31 |
| Grande a 390, densidade 3 | cheia (1400 × 933) | 0,89 | 0,45 | 0,30 |
| Pequeno a 1440×900, densidade 2 | cheia, porque 327 × 2 > 500 | 1,43 | 0,71 | 0,48 |
| Grande a 1440×900, densidade 2 | cheia | 0,71 | 0,36 | 0,24 |

- Duas cópias inteiras não bastam. Sem aproximar, o quadro grande a 1440×900 com densidade 2 já recebe 71% dos pixels numa foto 3:2; a 3×, 24%. Para servir a 3× pelo recorte em CSS, a cópia precisaria de 3931 px no lado menor: 5897 × 3931 numa 3:2, ou 23 MP baixados para mostrar 1,7 MP.
- O recorte em CSS também desperdiça: a 1440×900 com densidade 2, cada quadro pequeno baixa a cheia, 1,31 MP, para mostrar 0,43 MP.
- **Uma cópia quadrada, cortada pelo enquadramento**, resolve as duas coisas: o peso passa a depender só do quadro, e não da aproximação. Ela só existe para a capa (`photos[0]`), porque a grade só mostra a capa (protótipo arquivado, Grade). O limite é o original: a 3× numa foto de 4032 × 3024, o recorte tem 1008 px de lado, e a cópia nunca amplia além disso (**inferência**).

**Pixels que a foto aberta pede** (a foto cabe inteira no palco medido; "cobertura" = largura da cópia ÷ largura pedida)

| Caso | Foto 3:2 mostrada → pedida | Retrato 2:3 mostrado → pedido | Cobertura da cheia de 1400, 3:2 / 2:3 |
|---|---|---|---|
| 390, densidade 3 | 350 × 233 → 1050 × 700 | 350 × 525 → 1050 × 1575 | 1,33 / 0,89 |
| 1440×900, densidade 2 | 1113 × 742 → 2226 × 1484 | 495 × 742 → 989 × 1484 | 0,63 / 0,94 |
| 1440×900, densidade 1 | 1113 × 742 | 495 × 742 | 1,26 / 1,89 |
| 1920×1080, densidade 1 | 1383 × 922 | 615 × 922 | 1,01 / 1,52 |

- A cheia de 1400 serve o celular e a tela de densidade 1. Num notebook de densidade 2, a foto aberta em 3:2 recebe 63% dos pixels; um 16:9, 53%. É o momento em cor da página, e é onde a falta mais aparece (**inferência**).
- Uma cópia inteira contida em 2560 × 1600 cobre a 1440×900 com densidade 2: 3:2 vira 2400 × 1600 (1,08), 16:9 vira 2560 × 1440 (0,97) e retrato 2:3 vira 1067 × 1600 (1,08).

**O conjunto recomendado** (nomes de código em inglês; formato na seção 1; peso **medido** na seção 5)

| Cópia | Como sai | Para quê | De quais fotos |
|---|---|---|---|
| `whole-1400` | inteira, contida em 1400 × 1400 (a cheia do protótipo) | foto aberta no celular e em densidade 1 | todas |
| `whole-2560` | inteira, contida em 2560 × 1600 | foto aberta em densidade 2 | todas |
| `square-540` | quadrada, cortada pelo enquadramento | quadros pequenos a 390 com densidade 3 (pedem 520) | só a capa |
| `square-660` | idem | quadros pequenos a 1440×900 com densidade 2 (pedem 654) | só a capa |
| `square-1080` | idem | quadro grande a 390 com densidade 3 (pede 1044) | só a capa |
| `square-1320` | idem | quadro grande a 1440×900 com densidade 2 (pede 1310) | só a capa |
| `share-1200` | inteira, 1200 de largura, em JPEG | imagem de compartilhamento (seção 7) | só a capa |

- Os quatro lados saem dos dois casos pedidos, com folga de 1% a 4%. As outras telas caem na quadrada seguinte:
  - o celular de densidade 2 fica com 540 nos pequenos (pedem 347) e 1080 no grande (696);
  - telas de 1366 a 1920 em densidade 1 ficam com 540 nos pequenos (248 a 403) e com 540, 660 ou 1080 no grande (497 a 807).
- Com só duas quadradas, 660 e 1320, o celular de densidade 3 baixaria 60% mais pixels do que mostra. Com 640 e 1280, o caso de 1440 ficaria 2% abaixo, e a escolha ficaria por conta da heurística de cada navegador (**inferência**).
- Quatro quadradas custam pouco: só a capa as tem, e elas somam uns 730 KB por publicação (seção 5).
- A `-s` do protótipo deixa de existir: a grade usa as quadradas, e a foto aberta, as inteiras.

**Peso da primeira tela** (**medido**: medianas em WebP q80; o quadro grande e os quatro pequenos que aparecem sem rolar)

| Caso | Protótipo (`-s` e cheia) | Recomendado | Cobertura com aproximação 1: protótipo / recomendado |
|---|---|---|---|
| 390, densidade 3 | 388 KB: cheia 140 + 4 × `-s` 62 | 483 KB: `square-1080` 231 + 4 × `square-540` 63 | 0,89 a 0,92 / 1,03 a 1,04 |
| 1440×900, densidade 2 | 698 KB: 5 × cheia 140 | 668 KB: `square-1320` 290 + 4 × `square-660` 95 | 0,71 no grande / 1,01 |

- No celular, o recomendado pesa um quarto a mais e entrega a resolução inteira. A 3× de aproximação, o protótipo entregaria 0,30 dos pixels; o recomendado fica perto de 1 enquanto o original tiver pixels para isso (a 3×, um original de 4032 × 3024 dá um recorte de 1008 px).
- No notebook, pesa menos e deixa de amolecer o quadro grande.
- O carregamento preguiçoso pede mais quadros que esses cinco, conforme a margem do navegador. Cada pequeno a mais soma 63 KB no celular e 95 KB no notebook.

**A regra de escolha**: o navegador escolhe, por `srcset` com descritor de largura e `sizes`.
- O MDN descreve a escolha: o navegador olha "screen size, pixel density, zoom level, screen orientation, and network speed" e, sem cópia do tamanho exato, "will choose the first image that is bigger than the chosen slot size and scale it down to fit".
- Quadros pequenos: `srcset` com `square-540 540w, square-660 660w, square-1080 1080w, square-1320 1320w`, `loading="lazy"` e `sizes="auto, …"`. O `auto` "indicates that the browser should use the expected layout width of the element" e "is only valid when combined with `loading="lazy"`"; depois dele vai uma lista de reserva para quem não o entende (MDN). Suporte: Chrome 126, Firefox 150 e Safari 27, este marcado como parcial por um defeito só com SVG e `object-fit` (browser-compat-data). Isso resolve a regra do protótipo que dependia da altura da janela, de 4 a 8 colunas (**inferência**).
- Quadro grande: mesmo `srcset`, sem `lazy`, com `fetchpriority="high"` e um `sizes` por media query, porque ele é o maior elemento da primeira tela (**inferência**).
- Foto aberta: `srcset` com as larguras reais de `whole-1400` e `whole-2560`, e `sizes` igual à largura mostrada, que o componente já calcula pela proporção e pelo palco, como o protótipo faz (**inferência**). O valor de `sizes` aceita funções matemáticas do CSS: "It must not use CSS functions other than the math functions" (MDN).
- No Next, a otimização do `next/image` "works self-hosted with zero configuration when deploying using `next start`", ou seja, roda no próprio servidor da web. O guia de self-hosting diz que dá para desligá-la "if you are optimizing images yourself separately"; com `unoptimized`, "The source image will be served as-is from the `src`" (https://nextjs.org/docs/app/guides/self-hosting e a página do `Image`). Usar `<img>` simples ou `unoptimized` evita codificar de novo, na VPS, o que a API já codificou.

**Consequências para o comportamento** (**inferência**; vão para a rodada do Claude Design e para a spec)
- Mudar o enquadramento ou a capa de uma publicação publicada gera quadradas novas, com nome novo, e tira as antigas do ar (seção 5).
- A abertura parte do recorte (a revelação da Grade, no protótipo arquivado). A quadrada é exatamente esse recorte, então a animação pode começar dela e trocar para a inteira quando a inteira chegar. O atalho "já vista" do protótipo, que reaproveitava a `-s`, muda.

## 3. Proporções extremas

Fontes: protótipo arquivado (a escolha da cópia na grade) e a conta da seção 2 · https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews/

- Com 480 px no lado menor e 1400 no maior, as duas cópias empatam em 1400 ÷ 480 ≈ 2,917:1. Acima disso, a `-s` passa a cheia:

| Proporção | `-s` (480 no lado menor) | cheia (1400 no lado maior) |
|---|---|---|
| 2,5:1 | 1200 × 480 | 1400 × 560 |
| 3:1 | 1440 × 480 | 1400 × 467 |
| 4:1 | 1920 × 480 | 1400 × 350 |
| 6:1 | 2880 × 480 | 1400 × 233 |

- **Regra proposta** (**inferência**):
  1. Toda cópia inteira se define por uma caixa ("contida em L × A"), nunca pelo lado menor. Assim a menor nunca passa a maior, em qualquer proporção.
  2. As quadradas não dependem da proporção: o lado do recorte é o lado menor da foto dividido pela aproximação.
  3. Nenhuma cópia amplia o original; se a foto já cabe numa caixa menor, a cópia maior não é gerada, e o `srcset` lista só as que existem.
- **Medido**: no panorama de 3,75:1 (3840 × 1023), `square-1080` e `square-1320` saíram idênticas, com 1023 px de lado. A regra 3 evita guardar e servir a mesma imagem duas vezes.
- Com a caixa de 2560 × 1600, um panorama de 4:1 vira 2560 × 640, e a foto aberta a 1440×900 com densidade 2 pede 2627 × 657: cobertura de 0,97 (seção 2).
- O WhatsApp aceita imagem de prévia com "4:1 width/height or less aspect ratio". Acima disso, a prévia grande pode não sair. É o único limite de proporção com fonte; não pede limite no envio. Se a spec quiser recusar panoramas no envio, isso cabe nos limites de arquivo da #36.

## 4. Endereço público das cópias

Fontes: https://developers.cloudflare.com/r2/buckets/public-buckets/ (atualizada em 2026-11-12) · https://developers.cloudflare.com/r2/platform/limits/ (2026-10-30) · https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/ (2026-10-09) · https://developers.cloudflare.com/cache/concepts/default-cache-behavior/ (2026-09-14) · https://developers.cloudflare.com/cache/concepts/cache-control/ (2026-06-30) · https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/ (2026-08-14) · https://developers.cloudflare.com/cache/how-to/tiered-cache/ (2026-11-03) · https://developers.cloudflare.com/cache/how-to/cache-rules/ (2026-08-14) · https://developers.cloudflare.com/cache/how-to/purge-cache/ (2026-09-29) · https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/ (2026-09-29) · https://developers.cloudflare.com/api/resources/cache/methods/purge/ · https://developers.cloudflare.com/r2/platform/troubleshooting/ · https://developers.cloudflare.com/r2/objects/upload-objects/

**Domínio próprio do depósito contra `r2.dev`**
- "To use features like WAF custom rules, caching, access controls, or Bot Management, you must configure your bucket behind a custom domain. These capabilities are not available when using the `r2.dev` development url." (R2, public buckets)
- O `r2.dev` "is not intended for production usage and has a variable rate limit applied to it": acima de "hundreds of requests/second" ele devolve 429, e a banda "may also be throttled" (R2, limits). "For production use cases, connect a custom domain to your bucket."
- Ligar o domínio próprio não exige ligar o `r2.dev`: "Enabling custom domains does not require enabling `r2.dev` access." E, com WAF ou Access, desligue o `r2.dev`, ou "your bucket will remain publicly available through your `r2.dev` subdomain".
- Requisitos: "The domain being used must have been added as a zone in the same account as the R2 bucket"; ao conectar, o painel cria o registro de DNS, que passa de "Initializing" a "Active" em alguns minutos. Até 100 domínios por depósito (limits).
- Certificado: o Universal SSL gratuito cobre "the root domain (for example, `example.com`) and first-level subdomains". O endereço das fotos precisa ser de primeiro nível, como `img.<domínio>`, e não `img.ff.<domínio>`. É o mesmo limite que o ADR 0001 já registrou para a API.
- O depósito público não lista o conteúdo: "public buckets do not let you list the bucket contents at the root of your (sub) domain."

**Cache da Cloudflare no domínio do depósito**
- "Domain access through a custom domain allows you to use Cloudflare Cache"; e "Configure your cache to use Smart Tiered Cache to have a single upper-tier data center next to your R2 bucket" (R2). O Smart Tiered Cache existe no plano Free (tiered cache).
- A Cloudflare "only caches based on file extension and not by MIME type". JPG, JPEG, WEBP e AVIF estão na lista padrão; HTML e JSON, não: "The Cloudflare CDN does not cache HTML or JSON by default." O nome da cópia precisa terminar na extensão.
- A Cloudflare respeita o `Cache-Control` da origem; no Free, Pro e Business o "Origin Cache Control" vem ligado. "`public` and `max-age` is greater than 0" é guardado.
- O `immutable` "has no effect on public caches like Cloudflare, but does change browser behavior" (cache-control).
- O Browser Cache TTL padrão é de 4 horas, e a Cloudflare só sobrescreve o cabeçalho da origem quando ele é menor que isso ou não existe. Um `max-age` de um ano passa intacto (edge and browser TTL).
- Sem `Cache-Control`, um 404 fica 3 minutos no cache (default cache behavior). Importa na seção 5.
- O R2 guarda `Cache-Control` como metadado HTTP do objeto, gravado no envio (upload objects; `PutObject` e `CopyObject` aceitam `Cache-Control`, seção 5). Que o domínio do depósito devolva esse cabeçalho é **inferência**; conferir com `curl -I` no primeiro deploy.
- Regras de cache no Free: 10 (cache rules). Nenhuma é necessária para as cópias.
- Se o Hotlink Protection estiver ligado na zona, ele pode bloquear o pedido (R2, troubleshooting). Os rastreadores das prévias buscam a imagem direto no domínio das fotos (**inferência**).

**Apagar do cache ao despublicar e ao excluir**
- O purge por URL é "the recommended method". No Free: 800 URLs por segundo e 100 URLs por pedido (purge cache). Purge por hostname, tag ou prefixo também existe no Free, mas com 5 pedidos por minuto.
- API: `POST /zones/{zone_id}/purge_cache` com `{"files": [...]}` e um token com a permissão `Cache Purge`. O purge vale para "every Cloudflare data center and cache tier", e a Cloudflare "does not serve purged content from cache again, even if your origin is unavailable" (API).
- Uma resposta 200 só confirma o recebimento: "To verify a purge, request the asset after purging and confirm that `CF-Cache-Status` is no longer `HIT`."
- Pelo painel, o purge por URL não limpa objetos guardados com o cabeçalho `Origin`; pela API, mandando os mesmos cabeçalhos, limpa (purge by single file). `<img>` sem `crossorigin` não manda `Origin` (**inferência**).
- O purge não alcança o navegador: "Purging Cloudflare's cache does not affect assets stored by a visitor's browser" (edge and browser TTL). Quem já viu a foto continua com ela no próprio aparelho; ninguém mais a alcança.

## 5. Rascunho fora do público

Fontes: https://developers.cloudflare.com/r2/pricing/ (atualizada em 2026-10-30) · https://developers.cloudflare.com/r2/api/s3/api/ (2026-11-10) · https://developers.cloudflare.com/r2/api/s3/presigned-urls/ (2026-11-12) · https://developers.cloudflare.com/r2/platform/limits/ · as páginas de cache da seção 4

**Mecanismo recomendado** (**inferência** sobre as fontes)
- **Toda cópia de rascunho mora só no depósito privado.** A cópia pública nasce ao publicar e morre ao despublicar ou excluir. Nenhum endereço público aponta para um rascunho, nem por acaso.
- **No envio**, a API guarda o original e já gera `whole-1400` e `whole-2560` no privado. A `whole-1400` serve ao compositor do Autor em qualquer aparelho, inclusive para enquadrar uma HEIC que o navegador não abre (protótipo arquivado, camada do Autor). As quadradas não nascem no envio, porque o enquadramento muda até publicar.
- **O Autor vê o rascunho** por URL pré-assinada do depósito privado, ou pela própria web.
  - URL pré-assinada vale de "1 second to 7 days" e só no endpoint S3: "Presigned URLs work with the S3 API domain (`<ACCOUNT_ID>.r2.cloudflarestorage.com`) and cannot be used with custom domains" (presigned URLs).
  - "Treat presigned URLs as bearer tokens": vida curta, emitida só para a sessão do Autor. É o padrão do life-under-control (inventário da #4).
- **Publicar**, nesta ordem:
  1. gerar as quatro quadradas e a `share-1200` da capa, a partir do original;
  2. copiar as inteiras do privado para o público;
  3. só então mudar a situação no banco e revalidar a página (seção 6).
  - Se algo falhar antes do passo 3, apagar o que já foi para o público: nenhuma página apontou para lá.
  - Fazer também o purge das URLs que vão ser publicadas. Uma republicação logo depois de despublicar reusa os mesmos nomes, e um 404 servido no intervalo fica 3 minutos no cache da borda (seção 4).
- **Despublicar**, nesta ordem:
  1. mudar a situação e revalidar a página;
  2. apagar as cópias públicas;
  3. fazer o purge dessas URLs, num pedido só.
  - Apagar antes do purge: no sentido inverso, um pedido no meio recolocaria no cache uma cópia que ainda existe.
  - As cópias privadas ficam, porque o rascunho continua.
- **Excluir**: igual a despublicar, mais as cópias privadas e o original. O registro some quando o depósito estiver limpo.
- **Editar uma publicação publicada**:
  - um novo enquadramento ou uma nova capa geram quadradas com nome novo; as antigas saem do ar e do cache;
  - uma foto acrescentada vai para o público ao salvar; uma foto removida sai do público e do cache.
- **Falha no meio**: cada apagamento pendente vai para uma fila no banco, gravada na mesma transação da mudança de situação, e um processo repete até conseguir. Uma conferência periódica compara o banco com o depósito público. `ListObjects` é Classe A e devolve uma página de chaves por chamada (`max-keys`), um custo desprezível para centenas de fotos.

**Copiar entre depósitos**
- O R2 implementa `CopyObject` com `x-amz-copy-source`, `x-amz-metadata-directive` e `Cache-Control` (S3 API). A página não diz se a origem pode ser outro depósito da mesma conta; no S3, o `x-amz-copy-source` nomeia o depósito (**inferência**; conferir no primeiro teste).
- Se não puder, a API reenvia os bytes com `PutObject`. A conta de Classe A é a mesma.
- Uma regra útil dos limites: "Maximum concurrent writes to the same object name (key) | 1 per second". Nomes com hash nunca são regravados (seção 6).

**Operações por publicação de 6 fotos** (a capa é a primeira; classes da página de preços)

| Momento | Operações | Classe A | Classe B | Grátis |
|---|---|---|---|---|
| Envio das 6 fotos | `PutObject` do original, de `whole-1400` e de `whole-2560` no privado, por foto | 18 | 0 | 0 |
| O Autor revê o rascunho | `GetObject` por imagem vista | 0 | uma por imagem | 0 |
| Publicar | `GetObject` do original da capa; `PutObject` de 5 cópias da capa (4 quadradas e `share-1200`); `CopyObject` de 12 inteiras para o público | 17 | 1 | 0 |
| Visitantes | `GetObject` só quando falta no cache (**inferência**: um acerto de cache não chega ao R2) | 0 | ~17 por enchimento do cache | 0 |
| Despublicar | `DeleteObject` das 17 cópias públicas; o purge é da API da zona, não do R2 | 0 | 0 | 17 |
| Excluir uma publicada | `DeleteObject` de 17 públicas, 12 privadas e 6 originais | 0 | 0 | 35 |
| Novo enquadramento da capa | `GetObject` do original; `PutObject` de 4 quadradas; `DeleteObject` das antigas | 4 | 1 | 4 |

- Classe A inclui `PutObject`, `CopyObject` e `ListObjects`; Classe B inclui `GetObject` e `HeadObject`; `DeleteObject` é grátis (pricing).
- **Por publicação**: 35 operações de Classe A e algumas dezenas de Classe B. A camada gratuita (1 milhão de A e 10 milhões de B por mês) comporta umas 28 mil publicações por mês: as operações não limitam.
- **O que limita é a guarda.** Pesos **medidos** (medianas em WebP q80):
  - por foto, `whole-1400` com 140 KB e `whole-2560` com 458 KB;
  - na capa, mais as quatro quadradas (730 KB) e a `share-1200` (187 KB).
  - Uma publicação de 6 fotos publicada guarda as inteiras duas vezes, no privado e no público: 6 × 2 × 0,6 MB + 0,9 MB ≈ 8 MB de cópias, mais os originais.
  - Com originais de 8 MB, a estimativa do protótipo, dá uns 56 MB por publicação, e os 10 GB guardam umas 175 publicações, ou mil fotos. Com originais de 4 MB, umas 310 publicações.
  - As cópias são um sétimo do total; quem pesa é o original.
- Acima da camada gratuita: US$ 0,015 por GB-mês, US$ 4,50 por milhão de Classe A e US$ 0,36 por milhão de Classe B, sem cobrança de saída; o uso é arredondado para cima ("1.1 GB-month, you will be billed for 2 GB-month") (pricing).
- O backup do banco no R2 (ADR 0004) divide os mesmos 10 GB.

## 6. Cache das cópias e da página

Fontes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control (modificada em 2026-09-17) · https://developers.cloudflare.com/cache/concepts/cache-control/ · https://nextjs.org/docs/app/api-reference/functions/updateTag (2026-08-18) · https://nextjs.org/docs/app/api-reference/functions/revalidateTag (2026-08-25) · https://nextjs.org/docs/app/getting-started/caching (2026-10-06) · https://nextjs.org/docs/app/guides/self-hosting (2026-10-15) · https://registry.npmjs.org/next/latest

**Cópias imutáveis**
- O MDN descreve o padrão "cache busting": "include version/hashes in their URLs, while never modifying the resources", com "`Cache-Control: max-age=31536000, immutable`". O `immutable` evita a revalidação "even when a user reloads the browser".
- Cabeçalho recomendado para toda cópia pública: `Cache-Control: public, max-age=31536000, immutable`, gravado como metadado do objeto, junto com o `Content-Type`. O `public` com `max-age` maior que 0 é o que a Cloudflare guarda; o `immutable` vale só para o navegador (seção 4).
- **Nome com hash** (**inferência**): `<photo_id>/<hash>/<copy>.<ext>`, por exemplo `…/3f9c2a7d41b0e6c8/square-660.webp`. O hash sai do SHA-256 do original, da versão da receita de cópias e, nas quadradas, do enquadramento.
  - Ele pode ser calculado antes de codificar, e regenerar dá o mesmo nome.
  - Mudar o enquadramento, a qualidade ou a receita gera nome novo, e o cache antigo simplesmente deixa de ser pedido.
  - O banco guarda a lista de URLs públicas de cada foto, que é a lista do purge.

**A lista de publicações, renderizada no Next**
- O Next atual é o 16.4.6 (npm).
- O Next guarda dados com `'use cache'`, `cacheLife` e `cacheTag`; o guia mostra a lista de posts com `cacheLife('hours')` e `cacheTag('posts')`.
- `updateTag` "immediately expires the cached data for the specified tag. The next request will wait to fetch fresh data rather than serving stale content". Só pode ser chamado "from within Server Actions".
- `revalidateTag(tag, 'max')` serve o dado velho enquanto busca o novo ("stale-while-revalidate"). Para despublicar e excluir, isso mostraria por um pedido uma publicação já fora do ar, com as cópias já apagadas. A forma de um argumento só "is deprecated".
- Uma instância só, com disco persistente, funciona sem configuração: o cache "is stored on the local filesystem (on disk) of each Next.js server instance". Com mais de uma, "calling `revalidateTag()` on one instance only invalidates the cache on that instance", e é preciso um `cacheHandler` compartilhado (self-hosting).
- A Cloudflare não guarda HTML por padrão (seção 4). Revalidar no Next basta; não há purge de página na zona, a menos que alguém crie uma regra que guarde HTML.
- **Recomendação** (**inferência**):
  - a leitura da lista na API fica numa função com `'use cache'`, `cacheTag('publications')` e um `cacheLife` longo, de horas, como rede de segurança;
  - a leitura de uma publicação ganha também `cacheTag('publication:<id>')`;
  - as Server Actions de publicar, editar, despublicar e excluir chamam a API e depois `updateTag` nas duas tags;
  - como toda escrita passa pela web (a API é interna), a web sabe sempre quando revalidar;
  - a camada do Autor (rascunhos, "Editar") lê a sessão e fica fora do cache compartilhado.

## 7. Imagem de compartilhamento por publicação

Fontes: https://ogp.me/ · https://developers.facebook.com/docs/sharing/webmasters/images/ · https://developers.facebook.com/docs/sharing/webmasters/ · https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews/ · https://www.linkedin.com/help/linkedin/answer/a521928 · https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages (antigo TN2444) · https://api.slack.com/robots · https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image (legada; hoje redireciona, não consegui baixar) · https://nextjs.org/docs/app/api-reference/functions/generate-metadata (2026-11-06)

| Quem | Tamanho e proporção | Peso e formato | Outras regras |
|---|---|---|---|
| Open Graph (ogp.me) | `og:image:width` e `og:image:height` opcionais | `og:image:type` opcional | "If the page specifies an og:image it should specify `og:image:alt`" |
| Facebook | "at least 1200 x 630 pixels for the best display on high resolution devices"; mínimo 600 × 315 para a prévia grande e 200 × 200 para qualquer uma; "as close to 1.91:1 aspect ratio as possible to display the full image in Feed without any cropping" | até 8 MB; `og:image:type` "One of `image/jpeg`, `image/gif` or `image/png`" | guarda a imagem pela URL: "Use a new URL for the new image"; com largura e altura declaradas, mostra a imagem já no primeiro compartilhamento |
| WhatsApp | "300px or more in width with 4:1 width/height or less aspect ratio" | "under 600KB" | o `<head>` precisa estar "within the first 300KB of the HTML"; `og:title`, `og:description` e `og:url` não vazios; título em até 2 linhas; descrição de 1 a 2 linhas ("80 characters will suffice") |
| LinkedIn | mínimo 1200 × 627; proporção 1,91:1; abaixo de 401 px de largura vira miniatura | até 5 MB | — |
| Apple (Mensagens) | "at least 900 pixels in width"; abaixo de 150 px pode ser ignorada | página até 1 MB; recursos somados até 10 MB | "Avoid text in preview images" |
| X (página legada, não baixada) | `summary_large_image`: 2:1, de 300 × 157 a 4096 × 4096 | menos de 5 MB; JPG, PNG, WEBP e GIF | a página atual de mídia do X lista os mesmos formatos e 5 MB para envio |
| Slack | usa Open Graph ou Twitter Card | — | guarda a prévia "for around 30 minutes" |

- **É preciso uma cópia específica.** A cópia cheia em WebP ou AVIF fica fora dos tipos que o Facebook documenta, e o WhatsApp pede menos de 600 KB.
- A cópia recomendada é `share-1200`:
  - a mesma foto inteira, em cor;
  - em JPEG, com 1200 px de largura e a altura da proporção, sem ampliar;
  - qualidade 80, baixando de 5 em 5 se passar de 600 KB.
  - **Medido**: em q80, de 95 a 258 KB nas sete fotos (o retrato sai com 1200 × 1805 e 187 KB); nem em q90 passou de 362 KB. O teto do WhatsApp sobra, e a descida de qualidade é só uma trava.
- A largura de 1200 atende Facebook, LinkedIn e Apple; o WhatsApp só pede 300. Um panorama de 3,75:1 sai com 320 px de altura, abaixo dos 627 que o LinkedIn pede.
- A proporção fica a da foto, como manda a decisão de compartilhamento do mapa #34. O Facebook avisa que, longe de 1,91:1, a imagem é recortada no feed; LinkedIn e X pedem 1,91:1 e 2:1. Um retrato deve aparecer recortado nessas prévias (**inferência** para LinkedIn e X).
- Ela só existe para a capa: a prévia de `/frames-and-fables/<id>` é a capa da publicação, e a de `/frames-and-fables` é a da publicação mais recente (**inferência**).
- Ela segue o ciclo das outras cópias: pública só com a publicação publicada, apagada e tirada do cache ao despublicar e excluir.
- As prévias já feitas ficam com as plataformas: o Facebook guarda a imagem pela URL e o Slack guarda a prévia por uns 30 minutos. Tirar do ar no nosso endereço não apaga uma prévia já gerada lá fora.
- No Next, `generateMetadata` monta `openGraph.images` com `url` absoluta, `width`, `height` e `alt`, e o campo `twitter` com `card: 'summary_large_image'`. O `alt` é a descrição da foto ou "Fotografia.", como decidido no mapa #34.

## Recomendação para a spec

Uma linha por pergunta do ticket; cada uma é decisão pendente da spec.

1. **Formato**: WebP com qualidade 80 e `method` 4, o padrão do Pillow, em todas as cópias de tela, sem alternativa em `<picture>`; JPEG q80 só na `share-1200`. O perfil de cor precisa de tratamento explícito, porque o WebP e o JPEG do Pillow não o levam sozinhos; a forma fica com a #36. **Impacto**: suporte de 97,2%, o mesmo do AVIF; com a mesma SSIM, de 15% a 23% menor que o JPEG; uma publicação de 6 fotos custa uns 4 s de CPU numa thread. O AVIF pouparia mais 10% a 15% por 2 a 4,5 vezes a CPU (velocidade 8 ou 6), e mostra a foto aberta só no fim do download; fica como troca futura, que só pede regenerar as cópias.
2. **Tamanhos**: as cópias passam a ser definidas pelo uso, e não mais duas por foto. `whole-1400` e `whole-2560` (contidas em 1400 × 1400 e 2560 × 1600) para toda foto. Só para a capa: `square-540`, `square-660`, `square-1080` e `square-1320`, cortadas pelo enquadramento, e `share-1200`. O navegador escolhe por `srcset` e `sizes`, com `sizes="auto"` nos quadros pequenos preguiçosos. **Impacto**: a grade fica nítida até 3× de aproximação; a 1440×900 com densidade 2, a primeira tela fica mais leve (668 contra 698 KB) e nítida; no celular, pesa um quarto a mais (483 contra 388 KB) para entregar a resolução inteira; a foto aberta ganha resolução de tela densa. Em troca, enquadramento e capa passam a gerar arquivo ao publicar e ao editar, e a abertura parte da quadrada.
3. **Proporções extremas**: toda cópia inteira definida por caixa, quadradas pelo enquadramento, nada ampliado e nenhuma cópia maior gerada quando a menor já cobre a foto; sem limite de proporção nas cópias. **Impacto**: some o caso acima de 2,917:1, panoramas até 4:1 ficam com prévia grande no WhatsApp, e a decisão de recusar panoramas, se houver, fica com a #36.
4. **Endereço**: domínio próprio do depósito público num subdomínio de primeiro nível da zona (ex.: `img.<domínio>`), `r2.dev` desligado, Smart Tiered Cache ligado, nenhuma regra de cache, purge por URL pela API com token só de `Cache Purge`. **Impacto**: cache e WAF da zona valem para as fotos, o certificado gratuito cobre o endereço, e o purge de uma publicação é um pedido só, dentro do limite do Free.
5. **Rascunho fora do público**: cópias de rascunho só no privado (o Autor as vê por URL pré-assinada de vida curta); publicar copia para o público antes de mudar a situação; despublicar e excluir mudam a situação, apagam e depois fazem o purge, com fila de pendências no banco. **Impacto**: nenhum rascunho tem endereço público; cerca de 35 operações de Classe A por publicação de 6 fotos, folga enorme na camada gratuita; o limite real passa a ser a guarda, umas mil fotos com originais de 8 MB (seção 5).
6. **Cache**: cópias com hash no nome e `Cache-Control: public, max-age=31536000, immutable`; a lista e cada publicação em `'use cache'` com `cacheTag`, revalidadas com `updateTag` nas Server Actions de publicar, editar, despublicar e excluir, e `cacheLife` de horas só como rede de segurança. **Impacto**: a página reflete cada mudança no pedido seguinte, sem cache curto batendo na API; vale com uma instância do Next, e mais de uma pede `cacheHandler` compartilhado.
7. **Compartilhamento**: cópia específica `share-1200` da capa, em JPEG, 1200 px de largura, proporção da foto, abaixo de 600 KB, com `og:image:width`, `og:image:height`, `og:image:type` e `og:image:alt`, e `twitter:card` `summary_large_image`. **Impacto**: prévia grande no Facebook, LinkedIn, Mensagens e WhatsApp; uma cópia a mais por publicação, que segue o mesmo ciclo de publicar e despublicar.
