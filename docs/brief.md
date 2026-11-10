# Brief do Minimal Me

Este documento define o que o Minimal Me é. Ele foi reescrito do zero em 2026-11-09 e substitui tudo o que o brief anterior dizia sobre o produto; a versão antiga fica no histórico do git. Vale até segunda ordem.

O vocabulário está em `GLOSSARY.md`; a identidade visual, em `docs/design/`.

## O produto

Minimal Me é um hub pessoal: um espaço onde o Autor consolida frentes de que gosta, para consumo próprio e, eventualmente, para a curiosidade de Visitantes. É público e tem um só Autor.

O hub tem três Frentes. Cada uma é pensada, discutida e construída em esforço próprio.

### Frames & Fables

Um álbum de fotos com histórias, com clima de rede social, à maneira do Instagram. O objetivo é compartilhar momentos e reflexões com quem se interessar.

Interação (comentários, curtidas) e música vinculada a cada foto ou post são desejáveis e podem ficar fora do MVP.

É a primeira Frente a ser construída.

### Code & Share

Um painel do ambiente de desenvolvimento pessoal do Autor que se atualiza sozinho. Os dados chegam em tempo real ou em pequenos lotes das APIs dos sistemas e ferramentas do dia a dia: GitHub e ferramentas de IA como Claude Code, Codex e ChatGPT.

A apresentação é uma narrativa, não uma tabela: quem visita entende o que o Autor está fazendo sem que ele atualize nada à mão. A viabilidade de coletar cada fonte ainda precisa ser analisada.

### Write & Learn

Um agente de IA que escreve um blog autônomo. Os assuntos vêm do interesse do Autor ou de sugestões do próprio agente, a partir do histórico e da base de conhecimento que se forma à medida que o conteúdo é gerado.

O agente deve ser capaz de produzir vários formatos: artigos, talvez áudio (podcasts) e vídeo. Boa parte disso fica para o futuro. O essencial é gerar conteúdo de forma autônoma, ajudando o Autor e os Visitantes a aprender.

## O MVP, em dois marcos

1. **Marco 1**: a Home no ar no domínio próprio, fiel à Home v2.3 e sem nenhuma Funcionalidade. Frames & Fables aparece como "Em desenvolvimento"; Code & Share e Write & Learn, como "Em planejamento". O marco estabelece domínio, infraestrutura, CI/CD e toda a dinâmica de entrega.
2. **Marco 2**: Frames & Fables disponível, com pelo menos uma publicação real do Autor. Começa pelo protótipo das telas, feito pelo Autor no Claude Design, e ganha um mapa próprio.

Code & Share e Write & Learn vêm depois do MVP.

## Confirmado, hipótese, pendente

**Confirmado**

- O hub tem três Frentes, e Frames & Fables é a primeira.
- A Home v2.3 é a referência visual. O sistema de design extraído dela é vivo e pode mudar com o protótipo de Frames & Fables.
- Os textos da Home v2.3 valem como estão e podem ser ajustados a qualquer momento.
- Write & Learn é um agente autônomo.

**Hipóteses**

- Visitantes não têm conta no MVP; curtidas e comentários ficam para depois.
- O conceito de Frames & Fables (um feed de posts, ou séries que se leem como um conto) se decide sobre o protótipo das telas, não em texto.

**Pendente**

- Marco 2: como o Autor publica em Frames & Fables e onde as fotos ficam guardadas.
- Code & Share: quais fontes entram e com que frequência os dados chegam.
- Write & Learn: como o agente publica (sozinho ou com revisão do Autor), em que formatos e a que custo.
- A voz dos textos: primeira pessoa ou "você".

## Restrições de engenharia

- Autor único. Repositório público: tickets, mapa e documentos não carregam segredos, dados pessoais nem valores de contrato.
- Manutenção compatível com um projeto pessoal de uma pessoa só: sem microserviços e sem infraestrutura adicional antes de a necessidade aparecer.
- Stack e convenções herdadas dos projetos de referência do Autor; desvios exigem justificativa explícita.
- Código em inglês, prosa em português: componentes, tokens, identificadores e arquivos de código têm nome em inglês; documentos, tickets, commits e textos da interface ficam em português do Brasil. A regra está em `AGENTS.md`.
- Domínio próprio (`docs/adr/0001-dominio-proprio.md`), VPS Hostinger com Coolify e Cloudflare na frente. Sempre que possível, a configuração passa pelos MCPs de Hostinger, Coolify e Cloudflare, e não por passos manuais no painel.
- Documentação do produto, se vier a existir, segue o `panlabs-docs` (Docusaurus no GitHub Pages).

## Projetos de referência

O inventário de cada um está nos branches `research/*` deste repositório e resumido no mapa.

- Web e API: `life-under-control`, com `ethitorial` e `travelmanager` como irmãos do mesmo molde.
- Python: `overpower`.
- Terraform: `tfbox`.
- Documentação: `panlabs-docs`.

## Como o trabalho anda

- Claude Code e Codex, com as skills de Matt Pocock. `AGENTS.md` é a única fonte de instruções; `CLAUDE.md` só o importa.
- O tracker é o GitHub Issues. O caminho até cada spec é um mapa do wayfinder; o do Marco 1 é a issue #1.
- Depois do mapa: `/to-spec`, `/to-tickets`, `/implement` (com `/tdd` e `/code-review`) e `/pr`. `/retro` ao fim das sessões.
- Em produto com interface, o protótipo vem antes de qualquer debate de funcionalidade em texto, e protótipo visual se faz no Claude Design.
- `GLOSSARY.md` e os ADRs nascem quando um termo ou uma decisão fecha; nunca em lote, nunca antes.
- Em toda pergunta de decisão, o agente dá a recomendação e o impacto; "defaults" adota todas.

## Objetivo secundário

Este projeto deve servir de referência para os próximos projetos pessoais do Autor. A regra é construir bem o primeiro e extrair o template depois do MVP, nunca antes.

## Armadilhas

- Mapear além do destino ou fatiar em tickets o que ainda não tem tela.
- Debater funcionalidade em texto antes de existir protótipo.
- Produzir documentos, arquitetura ou ADRs em lote.
- Duplicar configuração entre os dois agentes.
