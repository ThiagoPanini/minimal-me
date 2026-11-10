Minimal Me é um hub pessoal com três frentes: Frames & Fables, Code & Share e Write & Learn. A identidade é um mundo monocromático com grão: uma ilustração conduz cada tela, a interface quase some e o nome lidera.

## Estado do sistema

Esta é a versão 1, extraída da Home v2.3 em 2026-11-09. O sistema é vivo: o protótipo das telas de Frames & Fables pode acrescentar componentes e mudar regras daqui. Quando isso acontecer, mude este sistema primeiro e só depois as telas.

## Princípios

- Use só o que está nos tokens. Não acrescente matiz, sombra, gradiente de cor nem raio.
- Deixe a imagem conduzir. Uma ilustração grande por bloco, texto curto ao lado ou abaixo, nenhum ornamento de interface.
- Dê ênfase pelo peso (300 ou 400), nunca por itálico. O itálico não existe aqui.
- Mantenha tudo reto (`reto`). O círculo (`circulo`) é só da marca e do ponto do selo.
- Mova pouco, rápido e com função: uma abertura, uma revelação ao rolar e a resposta ao foco.
- Faça cada estado se ler primeiro pela exposição da imagem e só depois pela palavra.

## Conteúdo

- Escreva em português do Brasil. Os nomes das frentes ficam em inglês, com "&": Frames & Fables, Code & Share, Write & Learn.
- Use frases curtas e concretas. Exemplo real: "Histórias contadas por fotografias. Cada série reúne imagens em sequência, com legendas curtas, e se lê como um conto, do primeiro quadro ao último."
- Escreva rótulos e links em maiúsculas espaçadas (`rotulo`, `sobretitulo`, `link`); títulos e textos em caixa normal.
- Numere com dois algarismos (01, 02, 03) e mostre a contagem como "01 — 03", em `numero`.
- Diga o status com estas palavras: "Disponível", "Em desenvolvimento", "Em planejamento".
- Quando algo ainda não abre, diga o que é e em que pé está: "Em desenvolvimento · Frames & Fables ainda não está disponível."
- Comece o texto alternativo de uma ilustração por "Ilustração:" e descreva a cena. A camada do céu, que é fundo, leva texto alternativo vazio.
- Não use emoji nem ícones decorativos.
- Os textos da Home v2.3 valem como estão e podem ser ajustados a qualquer momento; a voz (primeira pessoa ou "você") ainda não foi fixada.

## Cor

- Pinte o fundo de toda página com `chao`. A única superfície clara é `ceu`, e ela só existe dentro da imagem de abertura.
- Hierarquia de texto sobre `chao`: `luz` para o nome, títulos, rótulos e links; `corpo` para a frase de abertura; `texto` para o texto corrido; `nevoa` para números, sobretítulo e rodapé.
- Sobre `ceu`, use só `tinta`: a marca e o foco de teclado dela.
- Desenhe todo fio com `fio`, em 1px. `fio` nunca carrega texto.
- `apagado-titulo`, `apagado-texto` e `apagado-rotulo` são só do estado "Em planejamento" em repouso. Ficam abaixo de 3:1 por escolha deliberada e nunca servem para texto de uma tela ativa.
- O selo usa `selo-fundo`, `selo-borda` e `selo-texto`; o aviso usa `aviso-fundo` com `selo-borda`.
- No protótipo, os valores de `apagado-*`, `selo-*` e `aviso-fundo` são literais; os nomes foram dados nesta extração.

## Tipografia

- Duas famílias, dois pesos. Jost (`sans`) para o nome, títulos e rótulos; IBM Plex Mono (`mono`) para frases, texto e números. Pesos 300 e 400.
- `nome`: sempre em maiúsculas, numa linha só, ocupando exatamente 8 das 12 colunas. Não o use como título de seção.
- `titulo`: um por card ou por tela. Equilibre a quebra de linha (`text-wrap: balance`).
- `rotulo` abre uma seção; `sobretitulo` fica acima da frase de abertura.
- `frase` e `corrido`: limite a linha a 34 e a 40 caracteres.
- `numero`, `link` e `selo`: sempre em IBM Plex Mono 400. Ligue os algarismos tabulares em `numero`.
- Ao lado do nome, alinhe o bloco de texto pela altura das maiúsculas: as maiúsculas do `sobretitulo` começam onde começam as do nome, e a última linha da `frase` pousa na linha de base do nome.

## Grade e espaço

- Uma grade de 12 colunas atravessa a página, do nome ao rodapé. Vão entre `coluna-min` e `coluna-max`; margem lateral entre `calha-min` e `calha-max`; largura máxima `largura-max`.
- Abertura: o nome nas colunas 1 a 8, o bloco de texto nas colunas 9 a 12. Rodapé: a marca nas colunas 1 a 8, a linha de crédito nas colunas 9 a 12.
- Uma seção abre com uma linha só: `rotulo` à esquerda, contagem à direita, um fio abaixo (`regua-secao`).
- Cards de frente: três colunas iguais, com número, título, texto e link alinhados entre si. Um fio vertical separa os cards, só na altura do texto.
- Ritmo dentro do card: imagem, `ritmo-32`, fio, `ritmo-22`, número, `ritmo-18`, título, `ritmo-22`, texto, `ritmo-32`, link.
- Até 900px de largura, empilhe: o nome ocupa a largura toda, o bloco de texto vai para baixo dele, os cards viram uma coluna e o fio vertical some.

## Imagem e grão

- Toda ilustração é monocromática, com grão, e mostra o mesmo personagem (um homem calvo, de barba e camiseta escura) pequeno ou em silhueta, diante de geometria celeste: órbitas finas, discos, um astro.
- Ilustrações novas são originais e seguem essa receita. Não use fotografia de banco, cor nem outro traço.
- Nos cards, recorte em 4:5 e esfume as quatro bordas em 2%. Na abertura, use duas camadas (céu e dunas) e desça para `chao` no pé da imagem.
- Cubra toda imagem com o grão: `grain.png` em ladrilho de 160px, opacidade .35, em multiplicação.
- A exposição de cada imagem é ajustada à parte, para que os três cards fiquem no mesmo nível de luz.
- A profundidade é discreta: o céu se desloca até 6px e as dunas até 12px com o ponteiro; a imagem de um card, até 4px com o ponteiro e 18px com a rolagem.

## Estados de uma frente

- **Disponível**: a cópia inteira, em exposição plena, sem selo e com link ativo.
- **Em desenvolvimento**: a imagem um pouco abaixo da exposição, com um véu escuro que sobe e desce no topo e poeira na luz. Selo com ponto cheio que pulsa.
- **Em planejamento**: o card apagado. Imagem escura dentro de marcas de corte, textos em `apagado-*`, selo com ponto vazado. Com foco, o card tenta acender (uma piscada de 0,9s) e fica a meia força.
- O foco é do card inteiro: sob o cursor, sob o teclado ou, em tela de toque, no card que cruza o meio da tela. Os outros cards recuam para 55% de opacidade.
- Enquanto a frente não abre, o link "Acessar" continua no lugar, em `nevoa` e com traço menor, e responde com o aviso.

## Movimento

- Três curvas: `ease` para mudanças de estado, `ease-out` para entradas, `ease-io` para laços lentos.
- Abertura: a imagem entra quando as duas camadas chegaram (céu em 2,4s, dunas em 1,9s); o nome sobe por máscara, palavra a palavra (1,25s, 150ms entre elas); sobretítulo e frase entram por último.
- Ao rolar, cada bloco entra uma vez: o fio da seção cresce da esquerda (1,2s), as imagens se revelam como uma cópia no banho (1,6s) e os textos sobem 12px, com 120ms entre um card e o seguinte.
- Nada fica em laço sem motivo: só o pulso do selo, o véu e a poeira de "Em desenvolvimento".
- Com movimento reduzido, tudo aparece no estado final, sem animação, sem profundidade e sem rolagem suave.

## Acessibilidade

- Declare o idioma da página (`pt-BR`) e mantenha a rolagem por teclado.
- Foco visível em todo controle: contorno de 1,5px na cor do texto, afastado 3px. A marca sobre `ceu` recebe contorno de 2px em `tinta`.
- O card inteiro é o alvo do link; o foco aparece como um contorno de 1px em `nevoa`, afastado 12px.
- Texto ativo fica em 4,5:1 ou mais sobre `chao` (`nevoa` é o piso, com 5,5:1). A exceção é o estado "Em planejamento" em repouso, descrito acima.
- O status é dito em palavras no selo, não só pela exposição da imagem.

## Iconografia

- Não há conjunto de ícones. O único símbolo é a marca: um anel de 1px com um ponto no centro (`assets/Marca`).
- Setas são tipográficas ("↑"). O link de ação termina num traço de 22px que cresce para 40px com foco.
- O ponto do selo (cheio ou vazado) e as marcas de corte são os únicos outros sinais gráficos.

## Componentes

- `Marca`: o símbolo, sobre `ceu` ou sobre `chao`.
- `Abertura`: o nome com o bloco de texto ao lado.
- `CabecalhoDeSecao`: rótulo, contagem e fio.
- `CartaoDeFrente`: imagem, selo, número, título, texto e link, nos três estados.
- `SeloDeStatus`: o estado dito em palavras, sobre a imagem.
- `Aviso`: a resposta a uma ação que ainda não tem destino.
- `Rodape`: a marca e a linha de crédito.
