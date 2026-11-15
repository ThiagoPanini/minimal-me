---
status: accepted
date: 2026-11-07
---

# Domínio próprio para o Minimal Me em vez de subdomínio de panlabs.tech

Os projetos da frota vivem em subdomínios de `panlabs.tech` por facilidade de deploy e economia de registro. O Minimal Me é um produto público com chat aberto a Visitantes, e nele esse padrão cobra caro: o Universal SSL gratuito da Cloudflare cobre um só nível de subdomínio, então `api.minimal-me.panlabs.tech` e previews por PR ficam sem certificado de borda, e as cotas do plano Free (uma regra de rate limiting e cinco de WAF por zona) ficariam partilhadas com os irmãos. Decidimos registrar um domínio próprio no Cloudflare Registrar, com zona própria no mesmo padrão da frota (proxy, Full (strict), origem fechada aos IPs da Cloudflare), porque o custo anual é da ordem de um mês do Advanced Certificate Manager e devolve ao produto certificado nativo em qualquer hostname de primeiro nível e cotas inteiras de proteção.

## Considered Options

- **Subdomínio com API interna ou em `/api` no mesmo host**: padrão do travelmanager e do life-under-control; zero custo, mas mantém cotas partilhadas e deixa previews por PR sem certificado.
- **Subdomínio com Advanced Certificate Manager**: resolve o certificado por US$ 10 ao mês por zona, dez vezes o custo anual de um domínio, e não resolve as cotas.
- **Domínio próprio** (escolhido).

## Consequences

- O nome e o TLD são escolhidos na tarefa de registro; a web fica no apex, a API, se for pública, em `api.<domínio>`, e previews por PR em hostnames de primeiro nível. A exposição da API continua decidida em Estrutura do repositório.
- `minimal-me.panlabs.tech` passa a redirecionar para o domínio próprio, para preservar a entrada pela frota.
- É um desvio explícito do padrão dos projetos de referência, exigido pelo brief; os demais projetos não mudam.
- Mais um item com renovação anual; a renovação automática fica ligada no registrador.

## Nota de 2026-11-09

O produto foi redefinido como um hub de três frentes, e o chat aberto a Visitantes, citado acima, deixou de existir. A decisão se mantém: um produto público continua precisando de certificado nativo em qualquer hostname de primeiro nível (API e previews por PR) e das cotas inteiras de proteção do plano Free.

## Nota de 2026-11-15

O domínio é `minimalme.dev`, registrado no Cloudflare Registrar, com a zona em Full (strict) e a origem ainda por fazer em Hospedagem e orçamento mensal. O `minimal.me` tem dono e está à venda; o `minmal.me`, registrado por engano, não renova. O TLD `.dev` força HTTPS no navegador (HSTS preload), o que reforça a decisão de HSTS em etapas só depois do deploy. A web fica no apex (`minimalme.dev`); o `api.minimalme.dev` do ADR 0002 segue sem uso no Marco 1.

## Nota de 2026-11-15, hospedagem

A Home roda na VPS Hostinger com Coolify, atrás da Cloudflare em modo proxied e em Full (strict). A origem usa um Cloudflare Origin Certificate para `minimalme.dev` e `*.minimalme.dev`, e não o Let's Encrypt: com Full (strict) e Always Use HTTPS ligados, a emissão por HTTP-01 atrás do proxy tende a falhar no primeiro pedido, e trocar o desafio do Traefik alteraria o proxy dos outros projetos da VPS. O `minimal-me.panlabs.tech` redireciona (301) por uma Regra de Redirecionamento da Cloudflare, e o `www.minimalme.dev` redireciona para o apex. O HSTS liga em um passo só, depois do primeiro deploy conferido: como o `.dev` já está na lista de pré-carga dos navegadores, escalonar o `max-age` não protege contra nada, e isso substitui o "HSTS em etapas" da nota anterior. As decisões completas estão em [Hospedagem e orçamento mensal](https://github.com/ThiagoPanini/minimal-me/issues/18).
