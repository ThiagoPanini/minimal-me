# Minimal Me — brief para o /wayfinder

Como usar (Claude Code, em ~/workspaces/minimal-me no WSL):
1. Repositório público `minimal-me` já criado no GitHub e clonado (pré-requisito
   do tracker do wayfinder). Por ser público, mapa, tickets e resoluções não
   carregam segredos, dados pessoais nem valores de contrato; o que for sensível
   fica fora das issues e é referenciado por localização.
2. Plugin `mattpocock-skills` instalado; `/setup-matt-pocock-skills` executado
   com tracker GitHub e `AGENTS.md` como arquivo de instruções; `CLAUDE.md`
   apenas importa o `AGENTS.md`.
3. Linha "Projetos de referência" preenchida (PESQUISAS, item 1) em 2026-11-07.
4. Mensagem 1 = este brief. Mensagem 2 = `/wayfinder`.

---

Este brief é o contexto para mapear, com /wayfinder, o caminho até o spec do MVP do "Minimal Me". Nesta sessão de mapeamento: confirme o destino comigo, encontre as decisões em aberto, crie o mapa e os tickets no tracker, dispare as pesquisas e pare. Não produza arquitetura, documentos ou código. Responda em português do Brasil, direto. Diferencie sempre requisitos confirmados, hipóteses e decisões pendentes.

DESTINO
Um spec do MVP do Minimal Me pronto para /to-spec, sem perguntas em aberto, com a stack herdada confirmada, a estrutura de repositório decidida e a fronteira público/privado definida. Teste de chegada: /to-spec consegue escrever o spec sem me perguntar nada que o mapa não tenha respondido.
Fora do alcance deste mapa (fica no nevoeiro; não pré-fatiar em tickets): tudo além do MVP — jogos, viagens, WhatsApp, servidor MCP, consolidação automática avançada, novos espaços. Registre em "Out of scope" ou "Not yet specified".

O PRODUTO
Minimal Me é uma plataforma pessoal — um "sistema operacional pessoal" — para organizar conhecimentos, aprendizados e contextos de diferentes áreas da minha vida, com um assistente de IA calibrado ao meu contexto. Foco inicial: aprendizado técnico (tecnologia e IA). Depois: jogos (Pokémon TCG, Pokémon de console), viagens, lazer e outros interesses.
- Espaços distintos por contexto, com navegação coerente; nada de uma única tela ou conversa para tudo. "Espaço" deve ser uma abstração genérica: criar um novo espaço é configuração e conteúdo, não código novo. Precisamos definir quando o assistente consulta só um espaço e quando pode cruzar informações.
- O blog (antigo "Minimal Blog") é um componente público dentro do Minimal Me; eu sou o único autor. Todo o resto é privado.
- Não se trata de recriar um modelo: é construir a camada de dados, memória, ferramentas e fluxos sobre uma API de LLM.
- Já existem explorações iniciais no Claude Design para a versão anterior ("Minimal Blog"); servem apenas como ponto de partida.

VISÃO DE FUNCIONALIDADES (possibilidades de evolução, não requisitos do MVP)
- Registrar notas, artigos, referências e materiais de estudo; organizar por espaço, tema e categoria.
- Conversar com um assistente que consulta meus materiais e cita as fontes.
- Publicar conteúdos selecionados no blog.
- Consolidar periodicamente aprendizados, produzindo sínteses ou rascunhos.
- Atualizar as bases de conhecimento usadas pelo assistente.
- Manter preferências e memórias pessoais visíveis, revisáveis e removíveis.
- Enviar lembretes por e-mail e, futuramente, WhatsApp.
- Expor o próprio Minimal Me como servidor MCP para uso a partir do Claude Code e do Codex.
- Expandir para lazer, viagens e outros contextos.

REQUISITOS CONFIRMADOS
- Usuário único (eu); área privada autenticada; apenas o blog é público.
- Interface minimalista, predominantemente preto e branco, com boa tipografia, legibilidade e acessibilidade.
- Nada é publicado automaticamente pela IA: ela sugere ou rascunha, eu reviso e publico.
- Memória sobre mim sempre transparente, editável e removível.
- Manutenção compatível com um projeto pessoal de uma pessoa só. Sem microserviços, múltiplos agentes ou infraestrutura adicional sem necessidade demonstrada.
- Material excluído não pode continuar sendo recuperado pelo assistente; fontes preservadas; privado e público separados; o assistente diz quando não há evidência suficiente; proteção contra instruções maliciosas dentro dos documentos; limite de custo por chamada.
- A stack e as convenções do Minimal Me seguem as dos meus outros projetos (ver inventário). Desvios exigem justificativa explícita.

HIPÓTESES INICIAIS (desafie-as nos tickets de decisão)
- MVP: registrar um material, consultá-lo com respostas fundamentadas e com fontes, e publicar um aprendizado revisado no blog.
- Um único repositório `minimal-me` (o layout interno — aplicação única ou workspaces — é decidido pela stack herdada), com um GitHub Project para gestão. Compare com múltiplos repositórios e recomende a opção mais simples que atenda ao MVP.
- Chat por espaço, com consulta cruzada opcional e explícita, em vez de um agente global.
- E-mail antes de WhatsApp; revisão humana antes de qualquer publicação.

PESQUISAS — tickets research (AFK, subagentes em paralelo)
Cada pesquisa existe para destravar uma decisão nomeada. Salve o resultado como a skill research determina, com citações (caminhos de arquivo ou URLs). Não pesquise "melhores práticas" genéricas.
1. Inventário da stack herdada — um ticket por projeto de referência. Projetos de referência: Python `/home/paninit/workspaces/overpower`; front-end + API (principal) `/home/paninit/workspaces/panlabs-tech/life-under-control`, com `/home/paninit/workspaces/panlabs-tech/ethitorial` e `/home/paninit/workspaces/panlabs-tech/travelmanager` como irmãos do mesmo molde, lidos no mesmo ticket apenas para registrar divergências; Terraform `/home/paninit/workspaces/panlabs-tech/tfbox`; documentação `/home/paninit/workspaces/panlabs-docs` (Docusaurus; Mintlify existe apenas em `/home/paninit/workspaces/campfire/docs`, inventariado no mesmo ticket como fatia de comparação). Para cada um: linguagens e versões, frameworks, estrutura de pastas, gerenciadores de pacotes, lint/format/tipagem, testes, CI, Terraform (módulos, providers, estado), ferramenta de documentação, deploy, segredos, MCPs declarados (`.mcp.json`), convenções de commits e branches, arquivos de instrução para agentes. Destrava: stack do Minimal Me e layout do repositório.
2. Consolidação do inventário — compare os perfis e liste as divergências entre projetos. Destrava: o ticket de decisão "convenção canônica".
3. Higiene de repositório nos meus projetos — o que eles já fazem (templates de issue e PR, proteção de branch ou rulesets, CI, Dependabot ou Renovate, CODEOWNERS, GitHub Projects). Só depois, documentação oficial do GitHub para as lacunas. Destrava: configuração do repositório.
4. Coolify e Cloudflare com o layout candidato de repositório (deploy a partir do GitHub; diretório base por aplicação, se workspaces), na documentação oficial. Destrava: estrutura do repositório e deploy do MVP.
5. Estado atual das skills de Matt Pocock e dos MCPs com utilidade concreta no MVP (incluindo os de Hostinger, Coolify e Cloudflare, já declarados nos `.mcp.json` dos projetos panlabs-tech), em fontes oficiais; não presuma nada instalado. Destrava: AGENTS.md e configuração de desenvolvimento.

DECISÕES — tickets grilling (HITL, uma por sessão; em cada pergunta, dê sua recomendação e o impacto; "defaults" significa adotar suas recomendações)
- Escopo do MVP, critérios de aceite observáveis e uma forma simples de medir utilidade real.
- Significado de "consolidação" (resumos, duplicações, atualização de bases, rascunhos) e de "aprender sobre mim" (histórico, memória persistente, recuperação de documentos; sem fine-tuning por padrão).
- Espaços: modelo genérico e regra para o assistente cruzar espaços.
- Fronteira público/privado e autenticação single-user.
- Navegação, espaços e jornadas do MVP (antes de qualquer estética).
- Estrutura de repositório e layout interno.
- Convenção canônica onde meus projetos divergem.
- Hospedagem e orçamento mensal (depende da tarefa manual abaixo).
- Uso no celular (os lembretes sugerem que sim).

TAREFAS MANUAIS — tickets task (HITL)
- Confirmar o plano Hostinger e os recursos disponíveis (CPU, memória, Coolify instalado ou não, domínio na Cloudflare).

DIREÇÃO VISUAL (referências em docs/design/references/, com README do que extrair; não invente características além destas)
- Fundo preto puro; linhas e formas em branco puro; sem cor; "cinzas" apenas por hachura, retícula ou linhas de velocidade, em estilo mangá/ink.
- Muito espaço negativo; ilustração vale mais que "chrome" de interface; tipografia fina, leve, com espaçamento generoso.
- Elementos recorrentes: um gato preto de olhos grandes e redondos (candidato a mascote e presença do assistente); uma grade de painéis estilo mangá (candidata à representação dos espaços); uma figura ao centro de ondas concêntricas sob um céu de planetas (candidata à metáfora da home: eu no centro, os espaços ao redor).
- Tom: calmo, contemplativo, nostálgico e brincalhão. Referência de clima, não de reprodução: mascote e ilustrações do produto devem ser originais.
- O briefing para o Claude Design (até três direções visuais comparáveis sobre as mesmas telas, com estados vazio, carregando, erro e mobile) será gerado via /handoff depois que o ticket de navegação e jornadas fechar. Não é parte deste mapa.

DESENVOLVIMENTO ASSISTIDO
- Claude Code e Codex, com as skills de Matt Pocock (https://github.com/mattpocock/skills). Uma fonte de instruções: AGENTS.md (criado pelo setup); CLAUDE.md apenas o importa. Sem regras duplicadas ou conflitantes.
- Sempre que possível, usar os MCPs de Hostinger, Coolify e Cloudflare para configurar e hospedar o Minimal Me com segurança, em vez de passos manuais no painel. Herdar a declaração dos projetos panlabs-tech; nada está configurado neste repositório ainda.
- As resoluções dos tickets são o registro de decisões. CONTEXT.md e ADRs nascem preguiçosamente pela skill domain-modeling quando um ticket fecha uma decisão — nunca em lote, nunca antes.
- Depois do mapa: /to-spec → /to-tickets → /implement (com /tdd e /code-review) → /pr. /handoff para o briefing de design e para trocar de agente. /retro ao fim das sessões, anotando o que vale virar template.

OBJETIVO SECUNDÁRIO — PROJETO-REFERÊNCIA
Este projeto deve servir de exemplo e referência para meus próximos projetos pessoais. Regra: construir bem o primeiro e extrair o template depois do MVP, nunca antes. Manter separado o que é genérico (AGENTS.md, docs/agents/, convenções) do que é específico (este brief, CONTEXT.md, specs).

ARMADILHAS A EVITAR
- Mapear além do destino ou pré-fatiar o nevoeiro em tickets.
- Pesquisa sem uma decisão a destravar.
- Documentos, arquitetura ou ADRs em lote.
- Configurações duplicadas entre os dois agentes.
- Mais de um ticket de decisão por sessão; responder por mim em um ticket HITL.
- Se o mapeamento não encontrar nevoeiro suficiente para justificar um mapa, diga isso e proponha /grill-me em vez de forçar.

PRIMEIRA RESPOSTA (sessão de mapeamento)
Síntese curta do produto e das tensões de escopo; o destino, para eu confirmar; a lista de tickets proposta (research, grilling, task), com o que cada um destrava e o que bloqueia o quê. Só depois da minha confirmação: criar o mapa e os tickets no tracker, disparar as pesquisas e parar.