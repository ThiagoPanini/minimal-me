# O que muda no sistema: as seções da Home

Extraído em 2026-11-15 da página "O que muda no sistema" do protótipo do MVP de 2026-11-13 (seções `#comum`, `#v-frestas-2`, `#fotos` e `#voz`), para o ticket [Sistema de design v2: a Home com spaces (#40)](https://github.com/ThiagoPanini/minimal-me/issues/40) ler sem depender de um artefato que deixou de existir. A página inteira, com as seções de Frames & Fables, da Grade e do Autor, está em `docs/design/prototype/mvp-2026-11-13/index.html` no commit `1551e5b` (ver a Linhagem em `docs/design/README.md`).

**Aplicado na versão 2 do sistema em 2026-11-20.** Três pontos mudaram na aplicação: `FrontCard` virou `SpaceSlit`, e não `SpaceCard` (item 01), porque a Home escolhida é Frestas II, sem card; a tabela de recortes (item 10) e os dados das fotos vivas (item 08) ficaram em `system/assets/Illustrations/illustrations.json`, e não em `tokens.json`, porque os tokens só guardam valores soltos; e a `StatusLine` substituiu também o selo sobre a foto (`StatusBadge`), porque em Frestas II o status já fica fora de caixa (itens 05 e 11).

Três ajustes em relação ao original:

- Frames & Fables passou a se chamar Frames & Songs. Onde o texto nomeia o space, o nome é o novo; as ilustrações, os movimentos e o Status não mudaram.
- O item 12 de `#comum` (o "Acessar" abrir a página de Frames & Fables) só valia no comparativo e está marcado como superado.
- A tabela de `#voz` traz só a primeira pessoa, que o Autor escolheu.

O texto fala em "comparativo", "Vitrine", "Mosaico", "Frestas" e "Ajustar fotos". São versões e ferramentas do artefato antigo, apagado do claude.ai em 2026-11-15, e ficam como contexto. As amostras visuais existiam só no artefato.

## Vale para qualquer versão

`#comum` · 12 itens

O que segue não depende da versão escolhida e pode voltar ao repositório desde já.

### 01 · Mudança no sistema · De frente a space, em todo lugar

- **Hoje:** "Frente" no guia, nos componentes e nos usos dos tokens; `FrontCard` no sistema; `Front` e `FrontStatus` no glossário.
- **Proposta:** "Space" na prosa (minúsculo, plural "spaces") e `Space` no código: `FrontCard` vira `SpaceCard`, `FrontStatus` vira `SpaceStatus`. Os valores `available`, `in-development` e `planned` não mudam. A seção "Estados de uma frente" passa a "Status de um space".
- **Motivo:** Funcionalidade é palavra de produto e frente é palavra de organização. Space é lugar, e é assim que a seção deve se ler.
- **Onde:** README (abertura, Conteúdo, Grade, Estados, Componentes), usos em tokens.json (`title`, `off-*`, `badge-*`), guias de FrontCard, StatusBadge e Toast. No repositório: GLOSSARY.md, brief e mapa.

### 02 · Mudança no sistema · Rótulo e contagem da seção

- **Hoje:** "Funcionalidades" e "01 — 03", que também são as amostras de `label` e `number` nos tokens.
- **Proposta:** "Spaces" e "01 — 04".
- **Motivo:** Os nomes dos spaces já são em inglês, com "&". O rótulo no mesmo idioma lê como parte do mesmo conjunto.
- **Onde:** SectionHeader, tokens.json (amostras) e a home.

### 03 · Acréscimo ao sistema · O quarto space: Music & Feeling

- **Proposta:** Nome "Music & Feeling", em código `MusicAndFeeling`, na posição 02. Texto de amostra: "Música tocada de perto. Vídeos curtos de pequenos trechos de canções, no violão e na guitarra, guardados pelo que fazem sentir."
- **Motivo:** É o space novo: não existe na home de antes.
- **Onde:** README (Conteúdo) e a home.

### 04 · Mudança no sistema · As quatro ilustrações são novas

- **Hoje:** Três ilustrações, cada uma com a sua cena e a sua chave de exposição (`brightness` e `contrast` por imagem), para os três cards ficarem no mesmo nível de luz.
- **Proposta:** Quatro ilustrações novas, de uma mesma série: o personagem pequeno, no alto de uma duna, com a luz atrás dele e uma grande curva em volta. Todas em 1086 × 1448. Como já saem no mesmo nível de luz, as chaves por imagem deixam de existir: vale uma só para as quatro, `brightness(.86) contrast(.97)` em repouso e nenhuma com foco.
- **Motivo:** Você as enviou nesta rodada, mais padronizadas entre si. A duna escura embaixo da figura virou o lugar natural do texto.
- **Onde:** assets/Illustrations (os quatro arquivos e as notas de uso), README (Imagem e grão) e o guia do card.

### 05 · Mudança no sistema · O status mora só no rótulo

- **Hoje:** O status muda quase tudo de um space: a foto de um space em planejamento fica apagada e ganha marcas de corte, a de um em desenvolvimento ganha um véu e é a única que se move, e o texto e o link perdem contraste (`off-*`).
- **Proposta:** Todo space tem a mesma disposição, o mesmo alinhamento, a mesma luz, o mesmo texto e o mesmo link, qualquer que seja o status. O que diz o status é o rótulo: o ponto (cheio em "Disponível", cheio e pulsando em "Em desenvolvimento", vazado em "Em planejamento") e a palavra. O rótulo de "Disponível" passa a aparecer, para os três terem o mesmo desenho. O véu e as marcas de corte saem.
- **Motivo:** Decisão da rodada 3: tratar spaces de forma diferente pelo status confunde.
- **Onde:** README (Estados), guia do card e do StatusBadge, tokens.json (`off-*` deixa de ser usado por status).

### 06 · Acréscimo ao sistema · Uma cor na página: âmbar em "Em desenvolvimento"

- **Proposta:** `status-in-development` #E8B96A, no ponto e na palavra do rótulo desse status, sobre a foto (selo) e fora dela (`StatusLine`). "Disponível" e "Em planejamento" ficam em `body`, cinza. Sobre o chão `ground` o âmbar tem 10:1 de contraste.
- **Motivo:** Decisão desta rodada: das três cores testadas ficou uma. Num sistema monocromático, uma cor só aponta o que está acontecendo agora, e não vira legenda para decorar.
- **Onde:** tokens.json (uma cor), README (Cor, Estados, Acessibilidade), StatusBadge.

### 07 · Mudança no sistema · Fotos vivas: cada uma com o seu movimento, e todas pelo foco

- **Hoje:** Só a imagem do space em desenvolvimento se move, com efeitos desenhados por cima dela (poeira, luzes, folhas).
- **Proposta:** Cada foto tem um movimento feito do que está pintado nela. Write & Learn: as folhas soltas flutuam. Code & Share: as luzes dos servidores piscam, e em algumas fileiras a luz corre de uma ponta à outra. Music & Feeling: o som sai do amplificador em arcos finos, que crescem e somem. Frames & Songs: os cantos de um enquadramento pousam no horizonte, o obturador pisca, e o quadro tirado fica um instante. Em todas, a luz atrás da figura respira. A foto acorda quando o space ganha o foco e volta ao repouso quando ele sai, em cerca de um segundo. Em repouso nada é desenhado sobre a imagem. Com movimento reduzido, nada se move.
- **Motivo:** Pedido desta rodada. Ligar o movimento ao foco, e não ao status, mantém a regra de não tratar spaces de forma diferente, e deixa a página parada até alguém chegar perto.
- **Onde:** README (Movimento, Estados, Acessibilidade), guia do card e assets/Illustrations.

### 08 · Acréscimo ao sistema · O que as fotos vivas pedem das ilustrações

- **Proposta:** Write & Learn ganha um segundo arquivo, `ai-sheets.webp` (760 × 804, 35 KB): cada uma das seis folhas recortada da própria ilustração, ao lado de um remendo do fundo limpo que fica embaixo dela. Code & Share ganha uma tabela com a posição das 77 luzes. Os outros dois efeitos são só coordenadas: o amplificador, e três enquadramentos sobre o horizonte.
- **Motivo:** As folhas que se movem são as que estão pintadas, e não folhas desenhadas por cima. Para isso a imagem precisa vir com as folhas separadas do fundo.
- **Onde:** assets/Illustrations e o guia do card. Se uma ilustração for trocada, o recorte e as coordenadas dela são refeitos.

### 09 · Mudança no sistema · O foco é interação, não status

- **Hoje:** O foco acende um space em planejamento "a meia força" e tira o véu de um em desenvolvimento: o efeito do foco depende do status.
- **Proposta:** O foco faz o mesmo em qualquer space: a foto ganha a luz inteira, chega 3% mais perto e acorda; a linha do link cresce. Em tela de toque, vale o space que cruza o meio da tela, ou o que foi tocado. O foco continua valendo com movimento reduzido; só as transições e as fotos vivas param.
- **Motivo:** Com o status fora da foto, não sobra motivo para o foco se comportar de três jeitos.
- **Onde:** README (Estados, Movimento, Acessibilidade).

### 10 · Acréscimo ao sistema · O recorte tem posição e zoom

- **Proposta:** Cada ilustração, em cada tipo de quadro, tem `x` e `y` de 0 a 1 (onde a imagem fica presa) e `zoom` a partir de 1, com um valor para a tela larga e outro para a empilhada. Os padrões desta rodada põem a figura e a luz na parte de cima do quadro e deixam a duna para o texto. No comparativo, "Ajustar fotos" deixa arrastar e aproximar cada foto e copiar as posições.
- **Motivo:** O recorte deixou de ser sempre 4:5: há fresta, destaque largo, detalhe de trilho e quadro de mosaico.
- **Onde:** README (Imagem e grão), tokens.json (uma tabela de recortes por ilustração) e o guia do card.

### 11 · Acréscimo ao sistema · `StatusLine`: o status em palavras fora da imagem

- **Proposta:** Um ponto e a palavra, em IBM Plex Mono 400 de 11px, sem caixa, com a mesma cor e os mesmos pontos do selo. Nunca usa `off-*`.
- **Motivo:** No destaque e no trilho da Vitrine o status vai junto do texto, não sobre a foto.
- **Onde:** Vitrine.

### 12 · Superado em 2026-11-15 · O "Acessar" de Frames & Songs

- **Antes:** No comparativo, o "Acessar" de Frames & Songs abria a página da Grade, e a marca da página levava de volta à Home.
- **Agora:** No protótipo do MVP, os quatro "Acessar" respondem com o aviso ("Em desenvolvimento · Frames & Songs ainda não está disponível." ou "Em planejamento · … ainda não está disponível."). Nenhum space abre página. Na implementação, o link de um space só abre quando o Status dele virar Disponível, o que é do Marco 2.
- **Para o sistema:** nada a levar. O item fica aqui só para não deixar o número 12 sem explicação.

### Amostra · O rótulo nos três status

_Amostra visual, só no artefato._

Só "Em desenvolvimento" leva cor: `#E8B96A`. Os outros dois ficam em `body`, e o ponto diz qual é qual.

## Frestas II

`#v-frestas-2` · 07 itens

Quatro aberturas numa fileira, todas iguais, sem nada embaixo. O número, o status e o nome ficam sobre o topo de cada foto; com o foco, a fresta abre, a foto acorda e a descrição aparece sobre a duna, já na largura da foto aberta. Herdou a fileira de Frestas, que saiu nesta rodada.

### 01 · Acréscimo ao sistema · `SpaceSlit`: quatro aberturas em 3:4

As quatro dividem a fileira por igual e, em repouso, têm a proporção das próprias ilustrações, 3:4: a foto aparece inteira, sem corte. A altura é a da fileira (um terço da largura dela, descontados os espaços, até 62% da altura da tela) e não muda quando uma fresta abre. Com foco, a fresta vai a 1,9 da largura, as outras três cedem e recuam para 60% da luz.

### 02 · Mudança no sistema · A legenda mora dentro da foto

Não há bloco de legenda sob a fileira. O texto tem a largura da foto aberta e fica dentro dela. A seção inteira tem a altura da fileira: em 1440 × 900 são 408px, e ela cabe numa tela com o cabeçalho.

### 03 · Acréscimo ao sistema · Sobre o topo: número, status e nome

A 14 a 22px da borda: o número e a `StatusLine` numa linha, e o nome embaixo (15 a 27px, calculado para caber na fresta mais estreita, então nunca quebra enquanto a fileira se move). Em fileiras com menos de 1240px, o status desce para baixo do número. Sob o nome, a foto escurece de leve no topo.

### 04 · Acréscimo ao sistema · Sobre o pé: o link sempre, a descrição com o foco

O link "Acessar" fica sempre à vista, no pé. Com o foco, um fio atravessa a duna da esquerda para a direita e a descrição sobe sobre ela, 0,4s depois de a fresta começar a abrir. O bloco tem a largura da fresta aberta e fica preso pelo pé: o texto não quebra de novo e o link não pula. A duna escurece só enquanto a descrição está sobre ela.

### 05 · Mudança no sistema · Aberta, a foto se apoia no pé

Em repouso a fresta é a ilustração inteira, em 3:4. Ao abrir, a foto cresce cerca de 1,6 vez e fica presa pela borda de baixo (`y: 1`): a figura sobe de 65% para perto de 45% da altura, e a duna fica livre para o texto.

### 06 · Mudança no sistema · Em fileiras estreitas, a primeira frase

Com menos de 1120px de fileira, a descrição inteira não cabe sobre a duna sem encostar na figura: entra só a primeira frase.

### 07 · Mudança no sistema · Até 900px, tudo dentro da fresta aberta

As quatro ficam lado a lado, e a que tem foco abre cinco vezes mais. As fechadas mostram a tira da imagem onde está a figura, com o número e o ponto do status. A aberta tem o nome sobre o topo e a primeira frase e o link sobre o pé. Um toque escolhe a fresta, e um segundo toque responde como o link.

### Desafia ou não resolve

- No desktop, a descrição só aparece com o foco. Em repouso há o nome, o status e o link.
- Texto sobre a ilustração: o sistema hoje não faz isso. Aqui há um véu no topo, sempre, e outro no pé, com o foco.
- A descrição inteira só cabe em fileiras de 1120px ou mais; abaixo disso, e no celular, fica a primeira frase.
- Abrir uma fresta leva 0,9s e desloca a fileira inteira. É mais movimento do que o resto do sistema usa.

## As quatro ilustrações

`#fotos` · 1086 × 1448

São as que você enviou nesta rodada. As quatro contam a mesma cena de quatro jeitos: o personagem pequeno, no alto de uma duna, com a luz atrás dele, e uma grande curva que dá a volta no quadro, cruzada por linhas finas.

### As quatro · Em repouso e com foco

_Amostra visual, só no artefato: frames · 0,18 · music · 0,17 · tech · 0,15 · ai · 0,19 · com foco._
O número é a média de luz do arquivo, de 0 a 1. As quatro ficam entre 0,15 e 0,19, e por isso dividem uma chave só: em repouso, um pouco abaixo; com foco, o arquivo como ele é.

### Descrições

**Frames & Songs.** `alt`: "Ilustração: no alto de uma duna, uma pessoa agachada fotografa com tripé o sol que nasce atrás das montanhas." Movimento: os cantos de um enquadramento pousam sobre o horizonte, o obturador pisca e o quadro tirado fica um instante. São três enquadramentos, um depois do outro, a cada 6 segundos.

**Music & Feeling.** `alt`: "Ilustração: no alto de uma duna, ao lado de um amplificador, uma pessoa sentada toca guitarra diante do sol que nasce." Movimento: arcos finos saem do amplificador para cima e para a esquerda, longe de quem toca, crescem e somem.

**Code & Share.** `alt`: "Ilustração: de costas, uma pessoa programa numa mesa com dois monitores, entre duas fileiras de servidores." Movimento: das 77 luzes dos servidores, um quarto fica aceso, um terço respira e nas outras a luz corre pela fileira. A luz dos monitores oscila de leve.

**Write & Learn.** `alt`: "Ilustração: no alto de uma duna, uma pessoa sentada lê um livro enquanto folhas de papel flutuam ao redor." Movimento: as seis folhas pintadas flutuam, cada uma no seu ritmo: de 10 a 19px de vaivém e alguns graus de giro. A maior, cortada pela borda, só balança.

### Arquivos

Converti os quatro PNG em webp de 1086 × 1448, em cinza puro (eles traziam um tom de cor quase invisível). Ficaram entre 88 e 162 KB. De `ai.webp` saiu também `ai-sheets.webp`, com as seis folhas e o fundo de cada uma. As ilustrações antigas saíram do comparativo.

## Voz dos textos

`#voz` · Tweak

O Autor escolheu a primeira pessoa, na resolução do [#12](https://github.com/ThiagoPanini/minimal-me/issues/12#issuecomment-6888187054). Os textos da v2.3 falavam com "você" e usavam "painel" e "blog", que o `GLOSSARY.md` pede para evitar em Code & Share e Write & Learn. A tabela traz o texto em vigor no protótipo do MVP. O de Frames & Songs foi escrito em 2026-11-15, na renomeação, e pode ser ajustado a qualquer momento.

| Space | Texto na Home |
|---|---|
| Frames & Songs | Meus momentos, em fotos e vídeos. Posts em carrossel, cada um com a música que ficou daquele momento. |
| Music & Feeling | Eu tocando, de perto. Vídeos curtos de pequenos trechos de canções, no violão e na guitarra, guardados pelo que me fazem sentir. |
| Code & Share | O que eu ando construindo, sem atualizar nada à mão. Repositórios, commits e o uso de cada ferramenta de IA chegam sozinhos do meu ambiente de desenvolvimento. |
| Write & Learn | Um agente de IA que escreve por conta própria. Parte do que me interessa, sugere temas e publica textos para que eu e quem me visita aprendamos juntos. |
