O status de um space em palavras: um ponto e a palavra, sem caixa, sobre a foto ou fora dela.

- **Você fornece**: o status do space, um de três: "Disponível", "Em desenvolvimento" ou "Em planejamento".
- **Quando usar**: em todo lugar que nomeia um space, ao lado do número. É o único lugar onde o status aparece: a foto, a luz, o texto e o link de um space não mudam com ele.
- O ponto tem 5px e diz qual é qual: cheio em "Disponível", cheio e pulsando em "Em desenvolvimento" (2,6s, `ease-io`), vazado em "Em planejamento" (um anel de 1px). Com movimento reduzido, o ponto não pulsa.
- A palavra vem 8px depois do ponto, em `status`, numa linha só.
- Cor: "Em desenvolvimento" em `status-in-development`, o ponto e a palavra; "Disponível" e "Em planejamento" em `body`. É a única cor da página, para o único status que está acontecendo agora.
- Sobre a foto, fica sob o véu do topo da `SpaceSlit`. Fora dela, sobre `ground`.
- Os três status têm o mesmo desenho: "Disponível" também leva o rótulo.
- Em fresta fechada e estreita (até 900px), só o ponto fica à vista; a palavra continua lá para leitores de tela.
- É informativo: não recebe foco nem clique. Não crie outras cores nem use o rótulo para categorias ou contadores.
