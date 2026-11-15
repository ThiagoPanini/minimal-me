As cinco ilustrações da Home v2.3. São monocromáticas, com grão, e mostram o mesmo personagem diante de geometria celeste.

- `sky.webp` (1086×1128): o mapa celeste, fundo da abertura. Camada de trás; texto alternativo vazio.
- `dunes.webp` (1086×1128, com transparência): o personagem sentado nas dunas. Camada da frente da abertura, sobre `sky.webp`.
- `frames.webp` (1086×1446): o fotógrafo diante do diafragma. Card de Frames & Songs.
- `tech.webp` (1086×1448): a mesa curva entre racks de servidores. Card de Code & Share.
- `ai.webp` (1086×1448): o leitor no túnel de folhas de papel. Card de Write & Learn.

As imagens dos cards nascem em 3:4 e são recortadas em 4:5. Cubra sempre com o grão (`assets/Texture`). Não recolora, não espelhe e não use uma ilustração de uma frente em outra.

No repositório, `sky.webp` e `dunes.webp` ficam em `docs/design/prototype/mvp/img/`, com os mesmos nomes. Lá também estão as quatro ilustrações novas dos cards (`frames.webp`, `music.webp`, `tech.webp` e `ai.webp`), que substituem as três dos cards descritas acima. As três antigas estão no commit `1551e5b`, em `docs/design/prototype/home-v2.3/img/`, com os nomes do protótipo da época (`ceu.webp` e `dunas.webp`). Onde as ilustrações novas passam a morar em `system/` é trabalho do ticket [#40](https://github.com/ThiagoPanini/minimal-me/issues/40).
