O card que apresenta uma frente do hub: uma ilustração em 4:5 e, abaixo dela, número, título, texto e link.

- **Você fornece**: a ilustração (com texto alternativo), o número de ordem, o nome da frente, um texto de até cinco linhas e o status.
- **Quando usar**: na home, três lado a lado, um por frente. Não use para listar posts, séries ou itens de uma frente; isso pede outro componente.
- Os três estados estão no guia, em "Estados de uma frente". O estado muda a exposição da imagem, o selo e a cor dos textos; a estrutura não muda.
- "Em planejamento" traz marcas de corte nos quatro cantos da imagem. Os outros estados não.
- O card inteiro é o alvo do link. Enquanto a frente não abre, o link fica em `mist`, com traço de 14px, e responde com o `Toast`.
- Com foco (cursor, teclado ou, em tela de toque, o card no meio da tela), a imagem vai à exposição plena, o traço do número cresce até a largura do card e os outros cards recuam para 55%.
- No protótipo, cada imagem tem um efeito vivo em canvas: poeira na luz (Frames & Fables), luzes dos racks (Code & Share) e folhas soltas (Write & Learn). A prévia aqui é estática.
- Mantenha o ritmo vertical do card com `rhythm-32`, `rhythm-22` e `rhythm-18`, e os quatro textos alinhados entre os cards.
