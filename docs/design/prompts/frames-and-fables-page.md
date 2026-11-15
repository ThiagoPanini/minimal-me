# Prompt: a página de Frames & Fables

O Autor pilotou a sessão no Claude Design com o prompt abaixo, em 2026-11-12, no artefato "Minimal Me - Comparativo da home com spaces". Ele gerou as rodadas 6 e 7 da página de Frames & Fables (Grade, Pausas, Meses, Rolo e Parede), de que ficou a Grade; a rodada 7 acrescentou a camada do Autor, que este prompt deixava fora. Substitui o prompt das telas de 2026-11-10, cuja rodada foi descartada. O resultado está em `docs/design/prototype/mvp-2026-11-13/`.

````markdown
# Minimal Me · Frames & Fables, a página do space

Quero idealizar aqui a página de Frames & Fables: o que o "Acessar" desse space abre. Ela serve para compartilhar fotos como num feed do Instagram: a foto primeiro e quase nenhum texto. Seu papel: manter o comparativo da home, expandi-lo com versões diferentes e navegáveis dessa página e pôr nelas o seu toque de chef, dentro da identidade que já existe. Eu piloto, reajo na tela e escolho.

## Como trabalhar comigo
- Português do Brasil, direto.
- Mostre na tela antes de discutir em texto. Se a dúvida couber numa versão ou num Tweak, desenhe em vez de perguntar.
- Separe sempre requisito confirmado, hipótese e decisão pendente.
- Em pergunta de decisão, dê sua recomendação e o impacto dela. Se eu responder "defaults", adote todas.
- No máximo 4 perguntas por rodada, só as que mudam o desenho.
- Textos e fotos de amostra são seus. Nada de conteúdo real meu, dados pessoais ou números apresentados como reais. A exceção são as fotos que eu mesmo anexar nesta conversa para servirem de amostra.
- Fotos de amostra: sem pessoas reais, sem banco de imagens e sem as fotos das referências. Faça-as você, em tons de cinza e com grão (paisagem, arquitetura, objeto, textura), em proporções variadas. Recortes das ilustrações do sistema também servem.

## Contexto
- Minimal Me é meu hub pessoal e público. Eu sou o único autor; visitantes olham e leem.
- O hub se organiza em quatro **spaces**: Frames & Fables, Music & Feeling, Code & Share e Write & Learn. "Space" é um lugar dedicado a um tema, sem relação com espaço sideral: nada de planetas, órbitas, constelações ou viagem espacial para representar os spaces ou a navegação.
- No repositório o conceito ainda se chama Frente, e são três. Nesta sessão vale space, e são quatro. Não trate isso como divergência a resolver.
- A home está em revisão no comparativo, e eu ainda não escolhi a versão dela. Frames & Fables é o primeiro space a ser construído e aparece na home como "Em desenvolvimento".

## Frames & Fables
- É o space de fotografia. A home o descreve assim, em texto de amostra: "Fotos particulares, abertas a quem passa. Momentos e lugares publicados um a um, como num feed: a imagem primeiro, poucas palavras depois."
- A referência de uso é o perfil do Instagram: uma grade de fotos que se percorre com o polegar, e uma foto que se abre. Quero esse gesto, não a interface do aplicativo: nada de ícones, barra de abas ou contadores copiados de lá.
- Pouco texto. A página não tem parágrafo de apresentação. Uma publicação leva, no máximo, um título de duas ou três palavras ou uma legenda de uma linha, e pode não levar nada.
- Na home, a ilustração desse space mostra o personagem fotografando o sol que nasce, no alto de uma duna. O movimento dela é um enquadramento que pousa no horizonte, um disparo e o quadro tirado, que fica um instante. A página deve parecer o lugar para onde essa cena leva.
- A página vai nascer com poucas publicações: o marco que a põe no ar pede só uma foto real. Ela precisa ficar boa com uma, com nove e com dezenas.

## Ponto de partida: o comparativo
Trabalhe no artefato "Minimal Me - Comparativo da home com spaces" (https://claude.ai/artifact/SA4dpdcuXn9NPSDs29ymLD), publicando versões novas dele. Hoje ele é um `index.html` e uma pasta `img/`. A barra tem quatro versões da home (Frestas, Vitrine, Mosaico e Frestas II, nas teclas 1 a 4), a página "O que muda no sistema", a largura de tela (Livre, 1440, 390), "Ajustar fotos", os Tweaks e "Rever a abertura". Cada versão é um documento inteiro, levado em base64 dentro do `index.html` e mostrado na sua própria moldura. Antes de desenhar, leia a página "O que muda no sistema": ela resume o que já foi decidido e o que segue aberto.

Reorganize-o assim:
- Da home ficam só **Vitrine**, **Mosaico** e **Frestas II**. Ainda vou compará-las para escolher; não escolha por mim. **Frestas** sai.
- As três ficam exatamente como estão: os mesmos documentos, os mesmos Tweaks, o mesmo "Ajustar fotos". A única mudança permitida nelas é o destino do "Acessar" de Frames & Fables.
- A barra ganha um segundo grupo, "Frames & Fables", com as versões novas da página. Cada versão tem um nome curto, que diga a ideia dela. Refira-se às versões sempre pelo nome: os números das teclas vão mudar.
- O "Acessar" de Frames & Fables, em qualquer versão da home, abre a versão da página que estiver escolhida. Na página, a marca leva de volta à home de onde vim, na mesma altura da rolagem. Os outros três spaces continuam respondendo com o aviso.
- Mantenha a mecânica: uma tecla por versão, a rolagem preservada na troca entre versões do mesmo grupo, as três larguras de tela e os Tweaks guardados no navegador. "Rever a abertura" e "Ajustar fotos" valem só para a home.
- As fotos de amostra entram como arquivos do artefato, numa pasta nova dentro de `img/`, e não embutidas no HTML.
- Se eu anexar `minimal-me-comparativo-kit.zip`, ele traz as fontes que geram o `index.html` de hoje: leia o `LEIA-ME.md`, confirme que o build reproduz o artefato e parta dali. Sem o kit, extraia as versões do próprio artefato.
- Se não puder editar esse artefato no lugar, crie um novo com essa organização, me diga qual é e deixe o comparativo como está.

## A base: a identidade que já existe
Use o Design System "Minimal Me" desta conta (https://claude.ai/artifact/StCJXsKtEb1sG39VzTbNzX) e leia o README dele antes de desenhar. Em resumo:
- Um mundo monocromático com grão. Fundo `ground`; texto em `light`, `body`, `text` e `mist`; fios em `hairline`. Nenhuma sombra, gradiente de cor ou raio.
- Tipografia leve: pesos 300 e 400, sem itálico. Uma família para nome, títulos e rótulos; mono para números, links e status.
- Grade de 12 colunas. Uma seção abre com uma linha só: rótulo, contagem e fio.
- A imagem conduz e a interface quase some. Movimento curto e com função, respeitando a preferência de reduzir movimento.
- Funciona no celular e por teclado. Texto ativo com contraste de pelo menos 4,5:1; alvos de toque de pelo menos 44px.
- Nomes: código novo (componentes, tokens, classes e arquivos) em inglês; textos da interface em português.

O sistema ainda descreve a Home v2.3. O comparativo já propõe mudanças, e elas valem para a página nova:
- O status de um space aparece só no rótulo: um ponto e a palavra. Só "Em desenvolvimento" tem cor, o âmbar `#E8B96A`, e é a única cor da interface.
- As ilustrações dos spaces se movem quando o space ganha o foco e ficam paradas com movimento reduzido.
- As fontes estão em revisão. Jost e IBM Plex Mono são o padrão, e o Tweak "Fontes" troca a combinação por papéis (`display`, `label`, `text`, `mono`). A página nova obedece a esse Tweak.
- Em código, o conceito é `Space`.

Frames & Fables vai pedir o que o sistema ainda não tem: fotografia em vez de ilustração, grade de fotos, foto aberta, sequência, navegação entre páginas. Proponha o que faltar e marque cada novidade como **acréscimo ao sistema** ou **mudança no sistema**. Não altere o artefato do Design System: as mudanças voltam primeiro ao meu repositório.

## Referências
Vou anexar imagens de referência nesta conversa. Leia cada uma pelo que ela resolve, não pela aparência, e me diga numa linha o que tirou de cada uma. As que já separei mostram:
- Um portfólio de fotografia em preto e branco: uma seção de trabalhos com filtro por tema e uma grade regular de quadros.
- Uma grade de perfil clara em que quadros de título curto se alternam com as fotos: a palavra vira um quadro da grade.
- Uma grade de perfil escura, toda em preto e branco, com um índice de destaques rotulados por mês (MM/AA) acima das fotos.
- Uma grade em tons de cinza com detalhes (mãos, objetos), um quadro de frase e um único acento de cor.

O que vale tirar delas: a grade como página, o ritmo entre foto e palavra, o tempo como índice, o cinza como regra. O que não vale: copiar fotos, nomes, textos ou a interface do Instagram. Também não vale trazer sem aviso o que briga com o sistema, como títulos em negrito condensado, círculos e cantos arredondados. Se uma dessas ideias for boa demais para largar, desenhe e diga qual regra ela desafia.

## Liberdade criativa e toque de chef
Dentro da identidade, a estrutura é sua. Desta vez o molde de rede social é o ponto de partida, e não o que evitar. O que eu não quero é uma cópia do Instagram com outra tinta. Prefiro uma versão ousada que eu recuse a quatro versões seguras e parecidas.

Em cada versão quero um toque de chef: um detalhe que só este hub teria, e que você nomeia. Algumas pistas, que você pode trocar por melhores:
- O gesto da home continua na página: os cantos do enquadramento pousam no quadro que tem o foco, e abrir uma foto é o disparo.
- A foto chega como quem revela: aparece uma vez, em pouco tempo, e fica parada.
- A grade é a interface: sem cards, caixas, sombras ou botões que a foto não peça.
- A página fica bonita com uma foto só.
- Nenhum número de vaidade: nada de contagem de curtidas, seguidores ou visualizações.

## O que quero ver
1. **Pelo menos quatro versões da página**, com nome, diferentes na estrutura e não só no acabamento. O que for questão de dose (colunas, respiro, quanto texto aparece, cor da foto) vira Tweak, não versão.
2. Em cada versão, o percurso inteiro, ligado para o modo Play: chegar pela home, percorrer as fotos, abrir uma publicação, ir para a seguinte e para a anterior, fechar e voltar à home. Por cursor, por teclado e por toque. No desktop (1440) e no celular (390).
3. A publicação de uma foto só e a série de várias fotos, se a sua versão tiver série.
4. As situações: nenhuma publicação, uma, nove e dezenas; foto carregando; foto que falhou.
5. Sementes, que você pode trocar por ideias melhores:
   - **Grade**: a menor distância do perfil do Instagram. Quadros quadrados, um fio fino entre eles, a série marcada no canto, a foto aberta com uma linha de legenda. Serve de controle.
   - **Pausas**: na grade, alguns quadros não são foto. São a "fable": um título curto ou uma frase num quadro vazio. Fotos e palavras se alternam num ritmo.
   - **Meses**: o tempo organiza. Um índice de meses no topo e a grade agrupada por mês, com o rótulo na margem.
   - **Rolo**: uma foto por vez, na proporção em que foi tirada, numa coluna só. A grade vira o índice, e as duas vistas se alternam.
   - **Parede**: as fotos na proporção original, em linhas justificadas, sem recorte quadrado.

## Tweaks
Os da home ficam como estão. Para a página:
- Quantidade de publicações: nenhuma · uma · nove · dezenas.
- Foto: preto e branco · cor · cor ao abrir. Padrão: preto e branco.
- Recorte na grade: quadrado · proporção original, nas versões em que isso não for a própria ideia.
- Palavras na grade: nenhuma · título · legenda.
- Densidade: arejada · compacta.
- Movimento: sutil · nenhum.
- Fontes e texto corrido: os mesmos da home.

## Requisitos confirmados
1. O comparativo continua sendo o artefato de trabalho e ganha as versões da página de Frames & Fables.
2. Da home ficam só Vitrine, Mosaico e Frestas II, sem mudança no desenho. Frestas sai.
3. A página é o detalhe do space Frames & Fables: o que o "Acessar" dele abre.
4. O intuito é compartilhar fotos como num feed do Instagram, com pouco texto.
5. Quero versões diferentes da página, para comparar.
6. As referências que eu anexar orientam e não são para copiar.
7. A identidade é a do Design System "Minimal Me", com o que o comparativo já propõe.
8. O artefato "Minimal Me · Frames & Fables, protótipo das telas" continua descartado: não abra, não leia e não use como inspiração para nada.

## Hipóteses (desafie)
- A unidade é a publicação: uma foto, ou uma série curta, com data.
- A "fable" é curta e opcional: um título ou uma legenda de uma linha.
- A ordem é a do tempo, da mais recente para a mais antiga.
- As fotos entram em preto e branco.
- O celular é a tela principal desta página.
- O visitante não tem conta: não há curtidas, comentários nem música nesta rodada.
- A chegada é pelo "Acessar" da home, e a marca leva de volta.
- Na home, Frames & Fables segue como "Em desenvolvimento" enquanto a página for protótipo.

## Decisões pendentes
Pergunte as que mudarem o desenho. As que virarem versão ou Tweak, eu decido olhando.
1. A forma da página.
2. A unidade de publicação: foto única, série, ou as duas.
3. Quanto texto cabe numa publicação e onde ele aparece.
4. Como a fotografia entra no mundo monocromático.
5. Quadro quadrado ou proporção original.
6. O índice: por mês, por tema ou nenhum.
7. O que muda no Design System.

## Fora desta rodada
- Redesenhar a home ou escolher a versão dela.
- Fechar o que segue aberto na home: as fotos vivas, a combinação de fontes e a voz dos textos.
- As páginas dos outros três spaces.
- A tela em que eu publico (envio de fotos, edição do texto).
- Curtidas, comentários e música.
- As sementes da rodada descartada: o livro que se folheia, a folha de contato e o mapa do céu.
- O artefato do Design System.
- Implementação, login e dados reais.

## Entregável final
- O comparativo expandido: Vitrine, Mosaico e Frestas II intactas, e pelo menos quatro versões da página de Frames & Fables, navegáveis e com os Tweaks.
- A página "O que muda no sistema" atualizada: sai o que era de Frestas e entram os acréscimos e as mudanças que a página de Frames & Fables pede, com o motivo de cada um.
- Um resumo em três listas (requisitos confirmados, hipóteses e decisões pendentes), para eu levar de volta ao repositório e abrir o mapa do Marco 2.
````
