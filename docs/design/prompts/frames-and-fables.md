# Prompt: protótipo das telas de Frames & Fables

O Autor pilota a sessão no Claude Design com o prompt abaixo: abra uma conversa nova e cole o bloco inteiro. O resultado abre o mapa do Marco 2 e pode alterar o sistema de design (`docs/design/system/`).

````markdown
# Minimal Me · Frames & Fables, protótipo das telas

Quero prototipar aqui as telas de Frames & Fables, a primeira frente do Minimal Me a ser construída. Seu papel: propor versões diferentes e navegáveis do que essa frente pode ser, com liberdade criativa de verdade, dentro da identidade que já existe. Eu piloto, reajo na tela e escolho.

## Como trabalhar comigo
- Português do Brasil, direto.
- Mostre na tela antes de discutir em texto. Se a dúvida couber numa versão ou num Tweak, desenhe em vez de perguntar.
- Separe sempre requisito confirmado, hipótese e decisão pendente.
- Em pergunta de decisão, dê sua recomendação e o impacto dela. Se eu responder "defaults", adote todas.
- No máximo 4 perguntas por rodada, só as que mudam o desenho.
- Textos e fotos de amostra são seus. Nada de conteúdo real meu, dados pessoais ou números apresentados como reais.

## Contexto
- Minimal Me é meu hub pessoal, público, com três frentes: Frames & Fables, Code & Share e Write & Learn. Eu sou o único autor; visitantes leem.
- A home já está decidida (Home v2.3) e vai ao ar primeiro, sem funcionalidade. Nela, Frames & Fables aparece como "Em desenvolvimento". Este protótipo é o que o link "Acessar" daquele card vai abrir.
- Frames & Fables é um álbum de fotos com histórias, com clima de rede social, à maneira do Instagram. Quero compartilhar momentos e reflexões com quem se interessar.
- A home descreve a frente assim: "Histórias contadas por fotografias. Cada série reúne imagens em sequência, com legendas curtas, e se lê como um conto, do primeiro quadro ao último. Um álbum que se folheia como um livro." Trate esse texto como hipótese, não como contrato.

## A base: o Design System "Minimal Me"
Use o Design System "Minimal Me" desta conta (https://claude.ai/artifact/StCJXsKtEb1sG39VzTbNzX) e leia o README dele antes de desenhar. Em resumo:
- Um mundo monocromático com grão. Fundo `ground`; texto em `light`, `body`, `text` e `mist`; fios em `hairline`. Nenhum matiz, sombra, gradiente de cor ou raio.
- Jost para nome, títulos e rótulos; IBM Plex Mono para texto e números. Pesos 300 e 400. Sem itálico e sem letra cursiva.
- Grade de 12 colunas, uma linha por seção, tudo reto.
- A imagem conduz e a interface quase some. Movimento curto e com função, respeitando a preferência de reduzir movimento.
- Funciona no celular e por teclado. Texto ativo com contraste de pelo menos 4,5:1; alvos de toque de pelo menos 44px.
- Componentes que já existem: Mark, Masthead, SectionHeader, FrontCard, StatusBadge, Toast e Footer.
- Nomes: tudo o que é código (componentes, tokens, classes e arquivos) em inglês; textos e rótulos da interface em português.

O sistema é vivo. Frames & Fables vai pedir coisas que ele ainda não tem: fotografia em vez de ilustração, legenda, sequência, navegação entre telas, talvez interação. Proponha o que faltar e marque cada novidade como **acréscimo ao sistema** ou **mudança no sistema**, para eu decidir e levar de volta ao repositório.

Um ponto novo e importante: até aqui a identidade só mostrou ilustrações em preto e branco. Frames & Fables mostra fotografias minhas. Como a foto entra nesse mundo (sempre em preto e branco, com a cor preservada, com cor só ao abrir, com grão ou sem) é a primeira coisa que quero ver resolvida, em versões diferentes.

## Liberdade criativa
Dentro da identidade, a estrutura é sua. Não parta do molde de rede social nem do molde de portfólio: quero ver ideias que só fariam sentido neste hub. Você pode desafiar a descrição da home, o formato de "série", a ordem das telas e a forma de navegar. Se uma ideia boa esbarrar numa regra do sistema, desenhe assim mesmo e diga qual regra ela desafia. Prefiro uma versão ousada que eu recuse a quatro versões seguras e parecidas.

## O que quero ver
1. **Três ou quatro versões navegáveis**, diferentes na estrutura e não só no acabamento. O que for questão de dose (grão, tamanho da legenda, densidade, cor da foto) vira Tweak, não versão.
2. Em cada versão, o percurso inteiro, ligado para o modo Play: chegada vindo da home, visão do álbum, uma publicação aberta do primeiro quadro ao último, e a volta. No desktop (1440) e no celular (390).
3. Os estados: álbum vazio, antes da primeira publicação; carregando; foto que falhou; publicação com uma foto só e com muitas.
4. Sementes, que você pode trocar por ideias melhores:
   - **Livro**: cada publicação é um conto folheado, um quadro por vez, com a história correndo ao lado.
   - **Feed**: uma coluna de momentos em ordem de data, cada um com foto e história curta.
   - **Folha de contato**: o álbum como tira de filme; escolher um quadro abre a história.
   - **Mapa do céu**: as publicações como pontos de uma constelação, no vocabulário da home.

## Tweaks
- Globais: Versão; Foto (preto e branco · cor · cor ao abrir); Grão (sim · não); Legenda (curta · longa); Densidade (arejada · compacta); Movimento (sutil · nenhum).
- Em exploração, desligados por padrão: Curtidas; Comentários; Música por publicação. São desejáveis e podem ficar fora do MVP. Quero ver como ficariam, sem que nenhuma tela dependa deles.

## Requisitos confirmados
1. Frames & Fables é pública e só eu publico.
2. Toda publicação tem foto e história.
3. A identidade é a do Design System "Minimal Me".
4. O resultado é um material de design navegável na tela, com versões para comparar.

## Hipóteses (desafie)
- A unidade é a "série": várias fotos em sequência, lidas como um conto.
- Visitante não tem conta no MVP, então curtidas e comentários ficam para depois.
- A chegada é pelo card da home, e a marca no topo leva de volta.

## Decisões pendentes
Pergunte as que mudarem o desenho. As que virarem versão ou Tweak, eu decido olhando.
1. A unidade de publicação: foto única com história, série, ou as duas.
2. Como a fotografia entra no mundo monocromático.
3. A ordem do álbum: data, capítulos ou curadoria minha.
4. Como se navega entre publicações e de volta à home.
5. Se alguma interação entra no MVP.
6. O que muda no Design System.

## Fora desta rodada
- A tela em que eu publico (envio de fotos, edição do texto): fica para depois de eu escolher a versão.
- Code & Share e Write & Learn.
- Implementação, login e dados reais.

## Entregável final
- O protótipo navegável, com as versões e os Tweaks.
- Uma página "O que muda no sistema": os acréscimos e as mudanças propostos ao Design System, com o motivo de cada um.
- Um resumo em três listas (requisitos confirmados, hipóteses e decisões pendentes), para eu levar de volta ao repositório e abrir o mapa do Marco 2.
````
