# Minimal Me

Hub pessoal do Autor, público, organizado em quatro spaces. Este glossário fixa as palavras usadas em tickets, documentos e código. Os termos são em português, para a prosa; cada um traz a forma em inglês usada em código. A exceção é space: o termo da prosa também é em inglês, como os nomes dos spaces (ver `CODING_STANDARDS.md`).

## Language

### Produto

**Space**:
Um lugar do hub dedicado a um tema, com nome, ilustração e Status do space próprios. Hoje são quatro: Frames & Songs, Music & Feeling, Code & Share e Write & Learn. Na prosa, "o space" e "os spaces"; na Home, o rótulo da seção é "Spaces".
_Em código_: `Space`
_Avoid_: frente, espaço, funcionalidade (para o space inteiro), seção, módulo

**Funcionalidade**:
Uma capacidade dentro de um space, como curtidas ou comentários.
_Em código_: `Feature`
_Avoid_: recurso, space

**Frames & Songs**:
O space de fotos e vídeos: o Autor posta num carrossel, como no Instagram, e cada post leva uma música pessoal que representa o momento. Só esse conceito está confirmado; o resto será especificado em grilling futuro. Antes de 2026-11-15, o space se chamava Frames & Fables.
_Em código_: `FramesAndSongs`
_Avoid_: álbum, galeria, F&S

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
Frames & Songs no ar. Vem depois do MVP, e o que ele inclui sai do grilling de Frames & Songs.
_Em código_: `Milestone 2`
_Avoid_: fase 2, v1

**MVP**:
O Marco 1: a Home no ar.
