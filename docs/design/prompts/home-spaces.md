# Prompt: home com spaces

O Autor pilota a sessão no Claude Design com o prompt abaixo: abra uma conversa nova e cole o bloco inteiro. O resultado reorganiza o comparativo da home, com a v2.3 como "Backup" e as versões novas ao lado. Quando o Autor escolher uma versão, ela substitui a v2.3 como referência da home, e o conceito de Frente passa a se chamar Space no repositório (`GLOSSARY.md`, brief, sistema de design e mapa).

````markdown
# Minimal Me · Home com spaces, novas versões

Quero uma nova visão da home do Minimal Me, sucessora da v2.3 (o que seria a 2.4). A abertura fica exatamente como está. Da seção "Funcionalidades" para baixo, tudo pode mudar: o conceito de funcionalidades sai e dá lugar aos **Spaces**. Seu papel: propor versões diferentes e navegáveis dessa parte da home, com liberdade criativa de verdade, dentro da identidade que já existe. Eu piloto, reajo na tela e escolho.

## Como trabalhar comigo
- Português do Brasil, direto.
- Mostre na tela antes de discutir em texto. Se a dúvida couber numa versão ou num Tweak, desenhe em vez de perguntar.
- Separe sempre requisito confirmado, hipótese e decisão pendente.
- Em pergunta de decisão, dê sua recomendação e o impacto dela. Se eu responder "defaults", adote todas.
- No máximo 4 perguntas por rodada, só as que mudam o desenho.
- Textos de amostra são seus. Nada de conteúdo real meu, dados pessoais ou números apresentados como reais.

## De funcionalidades a spaces
- Minimal Me é meu hub pessoal e público, onde eu compartilho coisas com quem visita. Eu sou o único autor; visitantes leem.
- O conceito de "Funcionalidades" sai por inteiro. Entra o de **Spaces**: cada space reúne as coisas que eu compartilho sobre uma temática.
- "Space" é espaço no sentido mais puro do substantivo: um lugar dedicado a um tema. Não tem relação nenhuma com espaço sideral, universo ou cosmos. A identidade já tem céu, órbitas e uma marca que lembra um astro; isso fica como está, mas não represente os spaces nem a navegação entre eles com planetas, órbitas, constelações, galáxias ou viagem espacial.
- Funcionalidade é palavra de produto; space é lugar. A seção deve se ler como um conjunto de lugares para visitar, não como uma grade de recursos.

São quatro spaces:
1. **Frames & Fables**: fotografia. Uma espécie de álbum de fotos particular, como um feed do Instagram.
2. **Music & Feeling**: música. Em sua maioria, vídeos meus tocando pequenos trechos de músicas no violão e na guitarra. É novo: não existe na v2.3 e ainda não tem ilustração.
3. **Code & Share**: o nome continua. A descrição de hoje está no card da v2.3.
4. **Write & Learn**: o nome continua. A descrição de hoje está no card da v2.3.

## Só a home
- Esta sessão trata só da home. Não idealize nem prototipe nenhuma página interna de space, nem antecipe na home o que há dentro deles (feed de fotos, player de vídeo, lista de posts).
- Descarte por completo o artefato "Minimal Me · Frames & Fables, protótipo das telas". Ficou totalmente diferente do que imaginei: não abra, não leia e não use como inspiração para nada, nem para descrever Frames & Fables na home.
- Nenhum space abre página nesta rodada. O "Acessar" de cada um responde com o aviso, como na v2.3: "Em desenvolvimento · Frames & Fables ainda não está disponível."
- As bases são só duas: o comparativo abaixo e o Design System "Minimal Me". Versões e direções antigas ficam de fora.

## Ponto de partida: o comparativo
Parta do artefato "Minimal Me - Comparativo v2.1 e v2.3" (https://claude.ai/artifact/SA4dpdcuXn9NPSDs29ymLD). Hoje ele tem uma barra com duas versões, "v2.1 · referência" e "v2.3 · correções", as teclas 1 e 2 e o botão "Rever a abertura". Cada versão roda inteira na sua própria moldura, e trocar de versão preserva a rolagem. Reorganize-o assim:
- Esqueça a numeração 2.x. As versões novas ganham nome, não número: um nome curto que diga a ideia de cada uma.
- A v2.3 vira a versão "Backup", intacta: o mesmo arquivo, byte a byte.
- A v2.1 sai da barra. A v2.3 é a v2.1 com seis correções que não mudam o que se vê; nada visível se perde.
- Cada versão nova nasce de uma cópia da v2.3 e só muda da seção de spaces para baixo. A abertura fica idêntica na tela: céu e dunas, a marca, o nome "Minimal Me", o sobretítulo "hub pessoal e minimalista", a frase "Uma dinâmica simples e moderna para consumir e gerar conteúdo." e a animação de entrada.
- Mantenha a mecânica da barra: uma tecla por versão, "Rever a abertura" em todas e a rolagem preservada na troca, para eu comparar a mesma altura da página.
- Se não puder editar esse artefato no lugar, crie um novo com essa organização, me diga qual é e deixe o comparativo como está.

## A base: o Design System "Minimal Me"
Use o Design System "Minimal Me" desta conta (https://claude.ai/artifact/StCJXsKtEb1sG39VzTbNzX) e leia o README dele antes de desenhar. Em resumo:
- Um mundo monocromático com grão. Fundo `ground`; texto em `light`, `body`, `text` e `mist`; fios em `hairline`. Nenhum matiz, sombra, gradiente de cor ou raio.
- Jost para nome, títulos e rótulos; IBM Plex Mono para texto e números. Pesos 300 e 400. Sem itálico.
- Grade de 12 colunas. Uma seção abre com uma linha só: rótulo, contagem e fio.
- A imagem conduz e a interface quase some. Movimento curto e com função, respeitando a preferência de reduzir movimento.
- Três estados: Disponível; Em desenvolvimento; Em planejamento, apagado de propósito (texto abaixo de 3:1 em repouso), que acende a meia força com foco.
- Funciona no celular e por teclado. Texto ativo com contraste de pelo menos 4,5:1; alvos de toque de pelo menos 44px.
- Componentes que já existem: Mark, Masthead, SectionHeader, FrontCard, StatusBadge, Toast e Footer.
- Nomes: código novo (componentes, classes e arquivos) em inglês; textos da interface em português. O que vier copiado da v2.3 pode ficar como está.

O sistema foi escrito para três frentes, e quatro spaces vão quebrar regras dele: os cards em três colunas iguais, o `FrontCard` "três lado a lado", a exposição das imagens calibrada para três cards e a própria palavra "frente". Proponha o que mudar e marque cada novidade como **acréscimo ao sistema** ou **mudança no sistema**. Em código, o conceito passa a se chamar `Space` (por exemplo, `FrontCard` vira `SpaceCard`). Não altere o artefato do Design System: as mudanças voltam primeiro ao meu repositório.

Music & Feeling precisa de ilustração nova, na receita do sistema: monocromática, com grão, o mesmo personagem (homem calvo, de barba e camiseta escura), pequeno ou em silhueta, aqui tocando violão ou guitarra, no recorte 4:5 e no mesmo nível de luz das outras três. Se não conseguir uma imagem à altura das outras, use um marcador honesto no lugar e escreva a descrição da cena, para eu gerar a imagem depois. Nada de foto de banco nem de outro traço.

## Liberdade criativa
Da seção de spaces para baixo, a estrutura é sua. Não se prenda à fileira de cards da v2.3 nem ao molde de landing page de produto: quero ver ideias que só fariam sentido neste hub. Você pode desafiar o card, a contagem, a ordem, a forma de mostrar o status e o rodapé. Se uma ideia boa esbarrar numa regra do sistema, desenhe assim mesmo e diga qual regra ela desafia. Prefiro uma versão ousada que eu recuse a três versões seguras e parecidas.

## O que quero ver
1. **Pelo menos três versões novas**, com nome, diferentes na estrutura e não só no acabamento. O que for questão de dose (densidade, tamanho da imagem, texto curto ou longo, movimento) vira Tweak, não versão.
2. Em cada versão, a home inteira, ligada para o modo Play: rolar da abertura aos spaces, focar cada space (cursor, teclado e, no celular, o space que cruza o meio da tela) e acionar "Acessar" com o aviso. No desktop (1440) e no celular (390).
3. Os quatro spaces nos três estados, pelo Tweak de status. Com três spaces em planejamento, a seção pode ficar quase toda apagada: resolva isso no desenho sem perder a leitura do status. No celular, quatro spaces empilhados podem virar uma rolagem longa: resolva isso também.
4. Sementes, que você pode trocar por ideias melhores:
   - **Quatro em linha**: a menor mudança possível, a v2.3 com quatro cards numa linha. Serve de controle.
   - **Sumário**: um space por linha (número, nome, frase e status), com uma ilustração grande que troca conforme o foco percorre a lista.
   - **Lugares**: um trecho de página inteiro para cada space, e a home vira um passeio por quatro lugares.
   - **Destaque**: o space em desenvolvimento ocupa a cena; os outros três esperam a vez, menores.

## Tweaks
- Status de cada space: Disponível · Em desenvolvimento · Em planejamento. Padrão: Frames & Fables em desenvolvimento; os outros três em planejamento.
- Ordem: a da lista · por status.
- Densidade: arejada · compacta.
- Movimento: sutil · nenhum.

## Requisitos confirmados
1. A abertura fica exatamente como na v2.3; as mudanças valem da seção "Funcionalidades" para baixo.
2. "Funcionalidades" sai e entra "Spaces", no sentido de lugar dedicado a uma temática, sem relação com espaço sideral.
3. São quatro spaces: Frames & Fables, Music & Feeling, Code & Share e Write & Learn.
4. Esta sessão trata só da home; nenhuma página interna de space.
5. O artefato "Minimal Me · Frames & Fables, protótipo das telas" está descartado e não serve de inspiração.
6. O trabalho acontece no comparativo reorganizado: sem numeração 2.x, a v2.3 como "Backup" e as versões novas com nome.
7. A identidade é a do Design System "Minimal Me".

## Hipóteses (desafie)
- O rótulo da seção é "Spaces", em inglês como os nomes dos spaces.
- Music & Feeling entra como "Em planejamento", como Code & Share e Write & Learn; Frames & Fables segue "Em desenvolvimento".
- A ordem é a da lista: 01 Frames & Fables, 02 Music & Feeling, 03 Code & Share, 04 Write & Learn.
- Code & Share e Write & Learn ficam com os textos da v2.3. Frames & Fables e Music & Feeling ganham textos novos, escritos por você a partir das descrições acima: o texto de Frames & Fables na v2.3 fala de séries lidas como um conto e não descreve mais o space.
- O rodapé fica como na v2.3.

## Decisões pendentes
Pergunte as que mudarem o desenho. As que virarem versão ou Tweak, eu decido olhando.
1. Como quatro spaces se arrumam na página.
2. A ordem dos spaces.
3. O status de Music & Feeling na home.
4. A cena da ilustração de Music & Feeling.
5. O que fica abaixo dos spaces.
6. O que muda no Design System.

## Fora desta rodada
- A abertura.
- Páginas internas de qualquer space e o conteúdo de dentro deles.
- O artefato descartado de Frames & Fables e as versões e direções antigas.
- Implementação, login e dados reais.

## Entregável final
- O comparativo reorganizado: "Backup" com a v2.3 intacta e pelo menos três versões novas com nome, navegáveis e com os Tweaks.
- Uma página "O que muda no sistema": os acréscimos e as mudanças propostos ao Design System, com o motivo de cada um, inclusive a troca de frente por space nos nomes.
- Um resumo em três listas (requisitos confirmados, hipóteses e decisões pendentes), para eu levar de volta ao repositório.
````
