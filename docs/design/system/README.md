Minimal Me é um hub pessoal com quatro spaces: Frames & Songs, Music & Feeling, Code & Share e Write & Learn. A identidade é um mundo monocromático com grão: uma ilustração conduz cada tela, a interface quase some e o nome lidera.

## Estado do sistema

Esta é a versão 2, de 2026-11-20, escrita para a Home em Frestas II (`docs/design/prototype/mvp/`). A versão 1, de 2026-11-09, foi extraída da Home v2.3; a abertura e o rodapé continuam os dela, e muda da seção de spaces para baixo. O sistema é vivo: quando uma tela pedir algo novo, mude este sistema primeiro e só depois as telas. Onde o sistema e o protótipo divergirem, vale o protótipo, e o sistema é corrigido.

## Princípios

- Use só o que está nos tokens. Não acrescente matiz, sombra, gradiente de cor nem raio. A única cor é `status-in-development`, e ela só diz um status.
- Deixe a imagem conduzir. Uma ilustração grande por bloco e texto curto, ao lado dela, abaixo dela ou sobre a parte escura dela, com véu; nenhum ornamento de interface.
- Dê ênfase pelo peso (300 ou 400), nunca por itálico. O itálico não existe aqui.
- Mantenha tudo reto (`square`). O círculo (`circle`) é só da marca e do ponto do status.
- Mova pouco e com função: uma abertura, uma revelação ao rolar e a resposta ao foco. Uma imagem só se move enquanto tem o foco.
- Trate todo space do mesmo jeito. O status se lê pelo ponto e pela palavra, nunca pela imagem, pela luz ou pelo texto.
- Nomeie em inglês tudo o que é código (tokens, estilos de texto, componentes, classes, pastas e arquivos) e escreva em português tudo o que é texto (guias, notas de uso e a interface). A exceção é space: ver `CODING_STANDARDS.md`.

## Conteúdo

- Escreva em português do Brasil. Os nomes dos spaces ficam em inglês, com "&": Frames & Songs, Music & Feeling, Code & Share, Write & Learn. Na prosa, "o space" e "os spaces"; o rótulo da seção é "Spaces".
- Fale em primeira pessoa: quem fala é o Autor.
- Use frases curtas e concretas. Exemplo real: "Meus momentos, em fotos e vídeos. Posts em carrossel, cada um com a música que ficou daquele momento."
- A primeira frase da descrição de um space se sustenta sozinha: é ela que aparece onde a descrição inteira não cabe.
- Escreva rótulos e links em maiúsculas espaçadas (`label`, `kicker`, `link`); títulos, textos e o status em caixa normal.
- Numere com dois algarismos (01, 02, 03, 04) e mostre a contagem como "01 — 04", em `number`.
- Diga o status com estas palavras: "Disponível", "Em desenvolvimento", "Em planejamento".
- Quando algo ainda não abre, diga o que é e em que pé está: "Em desenvolvimento · Frames & Songs ainda não está disponível."
- Comece o texto alternativo de uma ilustração por "Ilustração:" e descreva a cena. A camada do céu, que é fundo, leva texto alternativo vazio.
- Não use emoji nem ícones decorativos.
- Os textos dos spaces são de amostra e podem ser ajustados a qualquer momento.

## Cor

- Pinte o fundo de toda página com `ground`. A única superfície clara é `sky`, e ela só existe dentro da imagem de abertura.
- Hierarquia de texto sobre `ground`: `light` para o nome, títulos, rótulos e links; `body` para a frase de abertura; `text` para o texto corrido; `mist` para números, sobretítulo e rodapé.
- Sobre a ilustração de um space: `light` para o nome e o link, `body` para a descrição e o status, `mist` para o número.
- Sobre `sky`, use só `ink`: a marca e o foco de teclado dela.
- Desenhe todo fio sobre `ground` com `hairline`, em 1px. `hairline` nunca carrega texto. Sobre a ilustração, o fio da duna é `mist` a 55%.
- `status-in-development` é a única cor da página: o ponto e a palavra de "Em desenvolvimento", e nada mais. "Disponível" e "Em planejamento" ficam em `body`.
- O aviso usa `toast-bg` com `toast-border`.
- Os véus sobre as ilustrações são `ground` em transparência (os valores estão na `SpaceSlit`).

## Tipografia

- Duas famílias, dois pesos. Jost (`sans`) para o nome, títulos e rótulos; IBM Plex Mono (`mono`) para frases, texto, números, links e status. Pesos 300 e 400.
- `wordmark`: sempre em maiúsculas, numa linha só, ocupando exatamente 8 das 12 colunas. Não o use como título de seção.
- `title`: o nome de um space, numa linha só na fileira larga, no tamanho que cabe na fresta mais estreita.
- `label` abre uma seção; `kicker` fica acima da frase de abertura.
- `tagline` e `paragraph` sobre `ground`: limite a linha a 34 e a 40 caracteres. Sobre a duna, `paragraph` tem a largura da fresta aberta.
- `lead`: a primeira frase de uma descrição, onde a inteira não cabe.
- `number`, `link` e `status`: sempre em IBM Plex Mono 400. Ligue os algarismos tabulares em `number`.
- Ao lado do nome, alinhe o bloco de texto pela altura das maiúsculas: as maiúsculas do `kicker` começam onde começam as do nome, e a última linha da `tagline` pousa na linha de base do nome.

## Grade e espaço

- Uma grade de 12 colunas atravessa a página, do nome ao rodapé. Vão entre `gap-min` e `gap-max`; margem lateral entre `gutter-min` e `gutter-max`; largura máxima `max-width`.
- Abertura: o nome nas colunas 1 a 8, o bloco de texto nas colunas 9 a 12. Rodapé: a marca nas colunas 1 a 8, a linha de crédito nas colunas 9 a 12.
- Uma seção abre com uma linha só: `label` à esquerda, contagem à direita, um fio abaixo (`section-rule-gap`).
- Spaces: uma fileira de quatro frestas (`SpaceSlit`), de margem a margem, com o vão da grade entre elas. A altura da fileira é a de uma ilustração 3:4 na largura de um quarto dela, e não muda quando uma fresta abre. Dentro da fresta, o texto fica entre `slit-inset-min` e `slit-inset-max` das bordas.
- Até 900px de largura, empilhe a abertura: o nome ocupa a largura toda e o bloco de texto vai para baixo dele. A fileira de spaces continua uma fileira, com uma fresta sempre aberta.

## Imagem e grão

- Toda ilustração é monocromática, em cinza puro, com grão, e mostra o mesmo personagem pequeno diante de geometria celeste. Nas quatro dos spaces, ele está no alto de uma duna, com a luz atrás dele e uma grande curva em volta, cruzada por linhas finas; a duna escura embaixo é o lugar do texto.
- Ilustrações novas são originais e seguem essa receita. Não use fotografia de banco, cor nem outro traço.
- As quatro dos spaces saem no mesmo nível de luz e dividem uma chave só: `brightness(.86) contrast(.97)` em repouso e nenhuma com foco.
- Recorte com posição e zoom: `x` e `y` de 0 a 1 (onde a imagem fica presa no quadro) e `zoom` a partir de 1, com um valor para a tela larga e outro para a empilhada. Na fresta, a imagem fica presa pelo pé (`y: 1`). Os valores de cada ilustração estão em `assets/Illustrations/illustrations.json`.
- Esfume as quatro bordas da imagem de um space em 2%. Na abertura, use duas camadas (céu e dunas) e desça para `ground` no pé da imagem.
- Cubra toda imagem com o grão: `grain.png` em ladrilho de 160px, opacidade .35, em multiplicação.
- A profundidade é discreta: o céu se desloca até 6px e as dunas até 12px com o ponteiro; a imagem de um space, até 3px com o ponteiro e 14px com a rolagem.

## Status de um space

- O status mora só na `StatusLine`: o ponto e a palavra. Todo space tem a mesma disposição, o mesmo alinhamento, a mesma luz, o mesmo texto e o mesmo link, qualquer que seja o status.
- **Disponível**: ponto cheio, em `body`. O link leva à página do space.
- **Em desenvolvimento**: ponto cheio que pulsa, ponto e palavra em `status-in-development`.
- **Em planejamento**: ponto vazado, em `body`.
- Enquanto o space não abre, o link "Acessar" continua igual e responde com o aviso (`Toast`).
- O foco é interação, não status: faz o mesmo em qualquer space. Vale o space sob o cursor, sob o teclado ou, em tela de toque, o que foi tocado. A fresta abre, a foto ganha a luz inteira, chega 3% mais perto e acorda, a descrição sobe sobre a duna e o traço do link cresce; as outras frestas recuam para 60% da luz.

## Movimento

- Três curvas: `ease` para mudanças de estado, `ease-out` para entradas, `ease-io` para laços lentos.
- Abertura: a imagem entra quando as duas camadas chegaram (céu em 2,4s, dunas em 1,9s); o nome sobe por máscara, palavra a palavra (1,25s, 150ms entre elas); sobretítulo e frase entram por último.
- Ao rolar, cada bloco entra uma vez: o fio da seção cresce da esquerda (1,2s), as imagens se revelam como uma cópia no banho (1,6s) e os textos sobem 12px, com 120ms entre um space e o seguinte.
- Uma fresta abre em 0,9s e desloca a fileira inteira; a descrição sobe 0,38s depois.
- Fotos vivas: cada ilustração de space tem um movimento feito do que está pintado nela, e em todas a luz atrás da figura respira. A foto acorda quando o space ganha o foco e volta ao repouso quando o perde, em cerca de um segundo. Em repouso nada é desenhado sobre a imagem.
- Nada mais fica em laço: só o pulso do ponto de "Em desenvolvimento" e a foto viva do space com foco.
- Com movimento reduzido, tudo aparece no estado final, sem animação, sem foto viva, sem profundidade e sem rolagem suave. O foco continua valendo.

## Acessibilidade

- Declare o idioma da página (`pt-BR`) e mantenha a rolagem por teclado.
- Foco visível em todo controle: contorno de 1,5px na cor do texto, afastado 3px. A marca sobre `sky` recebe contorno de 2px em `ink`.
- O link de um space é o alvo; o foco de teclado aparece como um contorno de 1px em `mist`, por dentro da borda da fresta.
- Texto sobre `ground` fica em 4,5:1 ou mais (`mist` é o piso, com 5,5:1).
- Texto sobre uma ilustração fica em 4,5:1 ou mais, ou 3:1 para texto grande (24px ou mais), medido no pior ponto da imagem atrás dele, no estado em que ele aparece (em repouso ou com foco). Onde a imagem não deixa, um véu de `ground` escurece aquela faixa: o do topo, sempre, e outro com o foco, sobre a duna e reforçando o topo, porque a foto com foco perde a chave de repouso e clareia. Os valores estão na `SpaceSlit`. Ao trocar uma ilustração, um recorte ou um tamanho de texto, meça de novo nas larguras de 1440, 1280, 1100 e 390.
- O status é dito em palavras, não só pela cor ou pelo ponto. Onde só o ponto fica à vista (fresta fechada no celular), a palavra continua para leitores de tela.

## Iconografia

- Não há conjunto de ícones. O único símbolo é a marca: um anel de 1px com um ponto no centro (`assets/Brand`).
- Setas são tipográficas ("↑"). O link de ação termina num traço de 22px que cresce para 40px com foco.
- O ponto do status (cheio ou vazado) é o único outro sinal gráfico.

## Componentes

- `Mark`: o símbolo, sobre `sky` ou sobre `ground`.
- `Masthead`: o nome com o bloco de texto ao lado.
- `SectionHeader`: rótulo, contagem e fio.
- `SpaceSlit`: a fresta de um space na fileira da Home, com número, status, nome, descrição e link sobre a ilustração.
- `StatusLine`: o status de um space, em ponto e palavra.
- `Toast`: a resposta a uma ação que ainda não tem destino.
- `Footer`: a marca e a linha de crédito.
