A fresta de um space na Home: uma abertura na fileira dos quatro, com a ilustração inteira em repouso e tudo o que nomeia o space escrito dentro dela.

- **Você fornece**: a ilustração (com texto alternativo e o recorte de `assets/Illustrations/illustrations.json`), o número de ordem, o nome do space, o status, a descrição (até três frases curtas) e a primeira frase dela, para onde a descrição inteira não cabe.
- **Quando usar**: na Home, quatro numa fileira, uma por space, sob o `SectionHeader` "Spaces". Não use para listar posts ou itens de um space; isso pede outro componente.

## Fileira

- As quatro dividem a fileira por igual, com o vão da grade entre elas. Em repouso, cada fresta tem a proporção da ilustração, 3:4, e mostra a foto inteira.
- A altura é a da fileira: um terço da largura dela, descontados os vãos, entre 280px e 62% da altura da tela. Não muda quando uma fresta abre. Em 1440 × 900, são 408px, e a seção cabe numa tela com o cabeçalho.
- Não há nada embaixo da fileira: número, status, nome, descrição e link ficam dentro da foto.

## Sobre o topo

- A `slit-inset-min` a `slit-inset-max` das bordas (fluido, clamp(14px, 1.5vw, 22px)): o número (`number`, `mist`) e a `StatusLine` numa linha, com 14px entre eles, e o nome (`title`, `light`) 12px abaixo.
- O bloco tem a largura da fresta mais estreita, e o nome é calculado para caber nela (entre 15px e 27px): o nome nunca quebra enquanto a fileira se move.
- Em fileiras com menos de 1240px, o status desce para baixo do número, 9px abaixo.
- Um véu fica sempre sob o topo: `ground` de 62% na borda a 30% em 18% da altura, até sumir em 38%.

## Sobre o pé

- O link "Acessar" (`link`, `light`, traço de 22px) fica sempre à vista, preso ao pé.
- Com o foco, um fio em `mist` a 55% atravessa a duna da esquerda para a direita (1,1s) e a descrição (`paragraph`, `body`) sobe sobre ela 0,38s depois de a fresta começar a abrir.
- O bloco tem a largura da fresta aberta e fica preso pelo pé: o texto não quebra de novo e o link não pula.
- Um segundo véu entra só com o foco, junto com a descrição. Ele escurece a duna, com `ground` de 90% no pé, 76% em 23% da altura e 67% em 39%, até sumir em 60%. Também reforça o topo, onde a foto clareia ao perder a chave de repouso: `ground` de 49% na borda, 80% em 8,5%, 52% em 21,5%, até sumir em 30,5%. Os dois são um só pseudoelemento, que acende e apaga junto.
- Com os dois véus, todo texto sobre a foto fica em 4,5:1 ou mais no pior ponto. Medido em 2026-11-20 com movimento reduzido, a 1440, 1280, 1100 e 390 de largura: o mínimo foi 4,72:1. A margem cobre a luz da foto viva e a aproximação de 3%, que não foram medidas.
- Em fileiras com menos de 1120px, a descrição inteira não cabe sobre a duna sem encostar na figura: entra só a primeira frase (`lead`).

## Foco

- O foco faz o mesmo em qualquer space, qualquer que seja o status. Vale o space sob o cursor, sob o teclado ou, em tela de toque, o que foi tocado.
- A fresta com foco vai a 1,9 vez a largura das outras (0,9s, `ease`), e as outras três cedem e recuam para 60% da luz.
- A foto ganha a luz inteira (sem a chave de repouso), chega 3% mais perto e acorda (ver "Foto viva"). Como a fresta alarga e a foto está presa pelo pé (`y: 1`), ela cresce cerca de 1,6 vez: a figura sobe de 65% para perto de 45% da altura, e a duna fica livre para o texto.
- O traço do link cresce para 40px.
- O link é o alvo: a fresta inteira responde ao clique, e o foco de teclado aparece como um contorno de 1px em `mist` por dentro da borda.

## Até 900px

- A fileira continua uma fileira, com 8px entre as frestas e altura entre 280px e 440px (metade da tela). Uma fresta está sempre aberta e vai a cinco vezes a largura das outras.
- As fechadas mostram a tira da imagem onde está a figura, com o número e o ponto do status (a palavra fica só para leitores de tela). A aberta tem o nome sobre o topo (entre 21px e 25px, pode quebrar) e a primeira frase e o link sobre o pé.
- Um toque escolhe a fresta; um segundo toque responde como o link.

## Status e link

- O status mora só na `StatusLine`. A foto, a luz, o texto e o link são os mesmos para os três status.
- Enquanto o space não abre, o link continua igual, em `light`, e responde com o `Toast`. Ele só leva a uma página quando o status virar Disponível.

## Foto viva

- Cada ilustração tem um movimento feito do que está pintado nela: os enquadramentos de Frames & Songs, os arcos de som de Music & Feeling, as luzes dos servidores de Code & Share e as folhas de Write & Learn. Em todas, a luz atrás da figura respira. Os dados estão em `assets/Illustrations/illustrations.json`.
- A foto acorda quando o space ganha o foco e volta ao repouso quando o perde, em cerca de um segundo. Em repouso nada é desenhado sobre a imagem. Só a fresta com foco se move.
- Com movimento reduzido, nada se move: a fresta abre sem transição, a foto não acorda e o foco continua valendo.
- A prévia aqui é estática: os movimentos estão no script do protótipo (`docs/design/prototype/mvp/`) e, portados dele, na Home (`apps/web/spaces/living-picture-motions.ts`).

## Entrada

- Ao rolar até a fileira, as fotos se revelam como uma cópia no banho (1,6s), e o topo e o pé sobem 0,4s depois, uma fresta depois da outra (120ms entre elas).
