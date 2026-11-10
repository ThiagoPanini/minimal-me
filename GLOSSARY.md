# Minimal Me

Hub pessoal do Autor, público, organizado em três Frentes. Este glossário fixa as palavras usadas em tickets, documentos e código. Os termos são em português, para a prosa; cada um traz a forma em inglês usada em código.

## Language

### Produto

**Frente**:
Uma das grandes áreas do hub, com nome, ilustração e Status de frente próprios. Hoje são três: Frames & Fables, Code & Share e Write & Learn.
_Em código_: `Front`
_Avoid_: funcionalidade (para a área inteira), espaço, seção, módulo

**Funcionalidade**:
Uma capacidade dentro de uma Frente, como curtidas, comentários ou música em Frames & Fables.
_Em código_: `Feature`
_Avoid_: recurso, frente

**Frames & Fables**:
A Frente de fotografia: fotos acompanhadas de histórias, compartilhadas com os Visitantes.
_Em código_: `FramesAndFables`
_Avoid_: álbum, galeria, F&F

**Code & Share**:
A Frente que mostra, sem atualização manual, o que o Autor faz no seu ambiente de desenvolvimento pessoal.
_Em código_: `CodeAndShare`
_Avoid_: painel, dashboard, portfólio

**Write & Learn**:
A Frente em que um agente de IA produz conteúdo de forma autônoma, para o Autor e os Visitantes aprenderem.
_Em código_: `WriteAndLearn`
_Avoid_: blog, assistente

**Home**:
A página de entrada do hub, que apresenta as três Frentes e o Status de cada uma.
_Em código_: `Home`
_Avoid_: landing page, portal, página inicial

**Status de frente**:
O estágio em que uma Frente se apresenta na Home: Disponível, Em desenvolvimento ou Em planejamento.
_Em código_: `FrontStatus`, com os valores `available`, `in-development` e `planned`
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
Frames & Fables com Status Disponível e pelo menos uma publicação real do Autor.
_Em código_: `Milestone 2`
_Avoid_: fase 2, v1

**MVP**:
O Marco 1 e o Marco 2 juntos.
