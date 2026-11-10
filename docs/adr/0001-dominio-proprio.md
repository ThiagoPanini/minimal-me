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
