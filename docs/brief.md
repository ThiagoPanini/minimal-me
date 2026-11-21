# Brief do Minimal Me

Este documento define o que o Minimal Me é. Foi reescrito do zero em 2026-11-09 e revisto em 2026-11-15, quando o MVP passou a ser só a Home e Frames & Fables virou Frames & Songs, fora do MVP; as versões anteriores ficam no histórico do git. Vale até segunda ordem.

O vocabulário está em `GLOSSARY.md`; a identidade visual, em `docs/design/`; as decisões de arquitetura, em `docs/adr/`.

## O produto

Minimal Me é um hub pessoal: um lugar onde o Autor reúne os temas de que gosta, para consumo próprio e, eventualmente, para a curiosidade de Visitantes. É público e tem um só Autor.

O hub tem quatro spaces, apresentados na Home sob o rótulo "Spaces". Cada um é pensado, discutido e construído em esforço próprio.

### Frames & Songs

O Autor posta fotos ou vídeos num carrossel, como no Instagram, e cada post leva uma música pessoal que representa o momento, como o trecho de música do Instagram. Na Home, aparece como "Em desenvolvimento". Fica fora do MVP: o conceito será especificado e prototipado em grilling futuro.

Até 2026-11-15, o space se chamava Frames & Fables e era uma grade de fotos. O que valia para essa versão está em "Pendente", como "a rever no grilling de Frames & Songs".

### Music & Feeling

Música: em sua maioria, vídeos do Autor tocando pequenos trechos de músicas no violão e na guitarra. Na Home, aparece como "Em planejamento".

### Code & Share

O ambiente de desenvolvimento pessoal do Autor, mostrado sem atualização manual. Os dados chegam em tempo real ou em pequenos lotes das APIs dos sistemas e ferramentas do dia a dia: GitHub e ferramentas de IA como Claude Code, Codex e ChatGPT.

A apresentação é uma narrativa, não uma tabela: quem visita entende o que o Autor está fazendo sem que ele atualize nada à mão. A viabilidade de coletar cada fonte ainda precisa ser analisada.

### Write & Learn

Um agente de IA que escreve por conta própria. Os assuntos vêm do interesse do Autor ou de sugestões do próprio agente, a partir do histórico e da base de conhecimento que se forma à medida que o conteúdo é gerado.

O agente deve ser capaz de produzir vários formatos: artigos, talvez áudio (podcasts) e vídeo. Boa parte disso fica para o futuro. O essencial é gerar conteúdo de forma autônoma, ajudando o Autor e os Visitantes a aprender.

## O MVP

O MVP é a primeira versão do Minimal Me: só a Home em Frestas II, como no protótipo que o Autor fez no Claude Design. Ele é o Marco 1 ([mapa #1](https://github.com/ThiagoPanini/minimal-me/issues/1)): a Home no ar no domínio próprio, sem nenhuma Funcionalidade e sem backend. Frames & Songs aparece como "Em desenvolvimento"; Music & Feeling, Code & Share e Write & Learn, como "Em planejamento". Todo "Acessar" mostra o aviso de que o space ainda não está disponível. O marco estabelece domínio, infraestrutura, CI/CD e a dinâmica de entrega.

Depois do MVP vem o Marco 2 ([mapa #34](https://github.com/ThiagoPanini/minimal-me/issues/34)): Frames & Songs no ar. O que ele inclui sai de um grilling futuro. Music & Feeling, Code & Share e Write & Learn também vêm depois do MVP.

## Confirmado, hipótese, pendente

**Confirmado**

- O hub tem quatro spaces.
- O MVP é só o Marco 1: a Home no ar.
- O protótipo do MVP é a Home em Frestas II, arquivada em `docs/design/prototype/mvp/` e publicada no Claude Design (ver `docs/design/README.md`).
- Na Home, a abertura e o rodapé ficam como na v2.3; muda da seção de spaces para baixo. O status aparece só no rótulo, e só "Em desenvolvimento" tem cor. Cada uma das quatro ilustrações tem um movimento, que acorda com o foco.
- Os textos dos spaces são em primeira pessoa.
- Frames & Songs: o Autor posta fotos ou vídeos num carrossel, e cada post leva uma música pessoal que representa o momento. Está fora do MVP.
- Write & Learn é um agente autônomo.

As decisões da Home estão em [Critérios de aceite da home](https://github.com/ThiagoPanini/minimal-me/issues/12). As de Frames & Songs ficam para o grilling futuro, no mapa #34.

**Hipóteses**

- Nenhuma por enquanto. As hipóteses anteriores eram do conceito antigo de Frames & Fables e estão em "Pendente".

**Pendente**

- Marco 1: a base técnica e a hospedagem, nos tickets do mapa #1.
- Frames & Songs: tudo além do conceito confirmado, no grilling futuro. O que valia para o conceito antigo (Frames & Fables) fica como **a rever no grilling de Frames & Songs**:
  - a página como grade de fotos e uma foto que se abre, com pouco texto: no máximo um título curto ou uma legenda de uma linha por Publicação, sem parágrafo de apresentação, contador nem número de vaidade;
  - curtidas, comentários e música ligada a uma foto fora do escopo;
  - o publicador como a própria página com uma camada do Autor, e só o Autor publicar;
  - Visitantes sem conta;
  - o desenho da Grade e do publicador, que era o da rodada 7 do protótipo antigo;
  - as decisões dos ADRs 0002, 0003 e 0004 e das pesquisas #35 a #37, que assumiam só fotos.
- Music & Feeling: tudo além do nome, do texto e do Status na Home.
- Code & Share: quais fontes entram e com que frequência os dados chegam.
- Write & Learn: como o agente publica (sozinho ou com revisão do Autor), em que formatos e a que custo.

## Restrições de engenharia

- Autor único. Repositório público: tickets, mapas e documentos não carregam segredos, dados pessoais nem valores de contrato. Fotos e originais nunca entram no repositório.
- Manutenção compatível com um projeto pessoal de uma pessoa só: sem microserviços e sem infraestrutura adicional antes de a necessidade aparecer.
- Stack e convenções herdadas dos projetos de referência do Autor; desvios exigem justificativa explícita.
- Web em Next e API interna em Python, que segue a skill `panlabs-python-standards` (`docs/adr/0002-backend-em-python.md`). A Home do Marco 1 não tem backend; a API, o banco e a guarda das fotos ficam para Frames & Songs, depois do MVP.
- Entrada do Autor por chave de acesso (`docs/adr/0003-entrada-do-autor.md`); fotos no Cloudflare R2 (`docs/adr/0004-guarda-das-fotos.md`). Os dois ADRs, como o 0002, estão a rever no grilling de Frames & Songs.
- Código em inglês, prosa em português: componentes, tokens, identificadores e arquivos de código têm nome em inglês; documentos, tickets, commits e textos da interface ficam em português do Brasil. A exceção é space, termo do domínio em inglês. A regra está em `CODING_STANDARDS.md`.
- Domínio próprio (`docs/adr/0001-dominio-proprio.md`), VPS Hostinger com Coolify e Cloudflare na frente. Sempre que possível, a configuração passa pelos MCPs de Hostinger, Coolify e Cloudflare, e não por passos manuais no painel.
- Documentação do produto, se vier a existir, segue o `panlabs-docs` (Docusaurus no GitHub Pages).

## Projetos de referência

O inventário de cada um está nos branches `research/*` deste repositório e resumido no mapa #1.

- Web e API: `life-under-control`, com `ethitorial` e `travelmanager` como irmãos do mesmo molde. O `apps/api` do life-under-control é o espécime da skill `panlabs-python-standards`.
- Python: `overpower` e a skill `panlabs-python-standards`.
- Terraform: `tfbox`.
- Documentação: `panlabs-docs`.

## Como o trabalho anda

- Claude Code e Codex, com as skills de Matt Pocock e a `panlabs-python-standards`. `AGENTS.md` é a única fonte de instruções; `CLAUDE.md` só o importa.
- O tracker é o GitHub Issues. O caminho até cada spec é um mapa do wayfinder: o do Marco 1 é a issue #1; o do Marco 2, que vem depois do MVP, a issue #34.
- Depois do mapa: `/to-spec` (uma spec por marco), `/to-tickets`, `/implement` (com `/tdd` e `/code-review`) e `/pr`. `/retro` ao fim das sessões.
- Em produto com interface, o protótipo vem antes de qualquer debate de funcionalidade em texto, e protótipo visual se faz no Claude Design.- `GLOSSARY.md` e os ADRs nascem quando um termo ou uma decisão fecha; nunca em lote, nunca antes.
- Em toda pergunta de decisão, o agente dá a recomendação e o impacto; "defaults" adota todas.

## Objetivo secundário

Este projeto deve servir de referência para os próximos projetos pessoais do Autor. A regra é construir bem o primeiro e extrair o template depois do MVP, nunca antes.

## Armadilhas

- Mapear além do destino ou fatiar em tickets o que ainda não tem tela.
- Debater funcionalidade em texto antes de existir protótipo.
- Produzir documentos, arquitetura ou ADRs em lote.
- Duplicar configuração entre os dois agentes.
