# Minimal Me

Hub pessoal do Autor, público, organizado em quatro spaces. Este glossário fixa as palavras usadas em tickets, documentos e código. Os termos são em português, para a prosa; cada um traz a forma em inglês usada em código. A exceção é space: o termo da prosa também é em inglês, como os nomes dos spaces (ver `AGENTS.md`).

## Language

### Produto

**Space**:
Um lugar do hub dedicado a um tema, com nome, ilustração e Status do space próprios. Hoje são quatro: Frames & Fables, Music & Feeling, Code & Share e Write & Learn. Na prosa, "o space" e "os spaces"; na Home, o rótulo da seção é "Spaces".
_Em código_: `Space`
_Avoid_: frente, espaço, funcionalidade (para o space inteiro), seção, módulo

**Funcionalidade**:
Uma capacidade dentro de um space, como curtidas, comentários ou música em Frames & Fables.
_Em código_: `Feature`
_Avoid_: recurso, space

**Frames & Fables**:
O space de fotografia: fotos do Autor publicadas uma a uma, como num feed, com pouco texto.
_Em código_: `FramesAndFables`
_Avoid_: álbum, galeria, F&F

**Music & Feeling**:
O space de música: em sua maioria, vídeos do Autor tocando pequenos trechos de músicas no violão e na guitarra.
_Em código_: `MusicAndFeeling`
_Avoid_: M&F

**Code & Share**:
O space que mostra, sem atualização manual, o que o Autor faz no seu ambiente de desenvolvimento pessoal.
_Em código_: `CodeAndShare`
_Avoid_: painel, dashboard, portfólio

**Write & Learn**:
O space em que um agente de IA produz conteúdo de forma autônoma, para o Autor e os Visitantes aprenderem.
_Em código_: `WriteAndLearn`
_Avoid_: blog, assistente

**Home**:
A página de entrada do hub, que apresenta os quatro spaces e o Status de cada um.
_Em código_: `Home`
_Avoid_: landing page, portal, página inicial

**Status do space**:
O estágio em que um space se apresenta na Home: Disponível, Em desenvolvimento ou Em planejamento. Aparece só no rótulo e não muda mais nada do que a Home mostra.
_Em código_: `SpaceStatus`, com os valores `available`, `in-development` e `planned`
_Avoid_: estado, fase, em breve

### Frames & Fables

**Publicação**:
O que o Autor publica em Frames & Fables: uma foto ou uma Série, com data e, no máximo, um título curto ou uma legenda de uma linha.
_Em código_: `Publication`
_Avoid_: post, entrada, álbum

**Série**:
Uma Publicação com mais de uma foto, vistas em sequência na foto aberta.
_Em código_: `Series`
_Avoid_: carrossel, galeria, conto

**Enquadramento**:
A posição e a aproximação que o Autor escolhe para uma foto no quadro quadrado da grade. Aberta, a foto aparece inteira.
_Em código_: `Framing`
_Avoid_: corte, crop

**Rascunho**:
Uma Publicação que ainda não está publicada e que só o Autor vê. Fechar uma Publicação não terminada guarda um Rascunho; despublicar devolve a Publicação a Rascunho.
_Em código_: `Draft`
_Avoid_: pendente, oculta

### Pessoas

**Autor**:
A única pessoa que publica e administra o Minimal Me.
_Em código_: `Author`
_Avoid_: admin, dono, usuário

**Visitante**:
Qualquer pessoa que acessa o Minimal Me sem ser o Autor.
_Em código_: `Visitor`
_Avoid_: usuário, leitor, público

### Entrega

**Marco 1**:
A Home no ar no domínio próprio, sem nenhuma Funcionalidade, com a dinâmica de entrega estabelecida.
_Em código_: `Milestone 1`
_Avoid_: fase 1, v0

**Marco 2**:
Frames & Fables no ar para o Visitante e para o Autor: a página e o publicador. Estreia sem nenhuma Publicação; o Status do space vira Disponível depois da primeira Publicação do Autor.
_Em código_: `Milestone 2`
_Avoid_: fase 2, v1

**MVP**:
O Marco 1 e o Marco 2 juntos.
