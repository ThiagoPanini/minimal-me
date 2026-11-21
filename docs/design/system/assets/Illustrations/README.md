As ilustrações da Home: as duas camadas da abertura e as quatro dos spaces. São monocromáticas, com grão, em cinza puro, e mostram o mesmo personagem pequeno diante de geometria celeste.

- `sky.webp` (1086×1128): o mapa celeste, fundo da abertura. Camada de trás; texto alternativo vazio.
- `dunes.webp` (1086×1128, com transparência): o personagem sentado nas dunas. Camada da frente da abertura, sobre `sky.webp`.
- `frames.webp` (1086×1448): no alto de uma duna, o fotógrafo agachado com tripé diante do sol. Frames & Songs.
- `music.webp` (1086×1448): no alto de uma duna, o guitarrista sentado ao lado de um amplificador. Music & Feeling.
- `tech.webp` (1086×1448): de costas, a mesa com dois monitores entre duas fileiras de servidores. Code & Share.
- `ai.webp` (1086×1448): no alto de uma duna, o leitor sentado com folhas de papel flutuando em volta. Write & Learn.
- `ai-sheets.webp` (760×804, com transparência): as seis folhas de `ai.webp` recortadas, cada uma ao lado de um remendo do fundo limpo que fica embaixo dela. Não aparece sozinha: é o atlas da foto viva de Write & Learn.
- `illustrations.json`: os dados da abertura e de cada ilustração de space. Da abertura (`opening`), as duas camadas na ordem em que se empilham, com o texto alternativo, o ponto em que cada uma fica presa por largura e a profundidade com o ponteiro. De cada space (`illustrations`), o texto alternativo, o recorte na fresta por largura, a luz atrás da figura e o movimento da foto viva (os três enquadramentos de Frames & Songs, a fonte do som de Music & Feeling, as 77 luzes de Code & Share e as seis folhas de Write & Learn).

As quatro dos spaces são uma série: o personagem pequeno no alto de uma duna, com a luz atrás dele e uma grande curva que dá a volta no quadro, cruzada por linhas finas. Nascem em 3:4 e saem no mesmo nível de luz (média entre 0,15 e 0,19), por isso dividem uma chave só: `brightness(.86) contrast(.97)` em repouso e nenhuma com foco. A duna escura embaixo da figura é o lugar do texto.

Cubra sempre com o grão (`assets/Texture`). Não recolora, não espelhe e não use a ilustração de um space em outro. Se uma ilustração for trocada, refaça os dados dela em `illustrations.json` e, em Write & Learn, o atlas: as fotos vivas são feitas do que está pintado.

As três ilustrações dos cards da Home v2.3 saíram na versão 2 do sistema; estão no commit `1551e5b`, em `docs/design/prototype/home-v2.3/img/`.
