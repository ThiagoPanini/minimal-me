---
status: accepted
date: 2026-11-15
---

# Home publicada como export estático do Next, servida por nginx

A Home do Marco 1 é escrita em Next, com App Router e Server Components, e vai ao ar como arquivos gerados no build (`output: "export"`), servidos por nginx numa imagem de contêiner, sem o servidor do Next em produção. A Home não tem Funcionalidade nem dado que mude de uma visita para outra, então os recursos de servidor do Next ficariam sem uso, e o servidor traria a obrigação de corrigir em horas as falhas críticas dele: foram seis RCEs de dezembro de 2025 a outubro de 2026, e nenhuma alcança um site exportado ([estudo de segurança e entrega](https://github.com/ThiagoPanini/minimal-me/blob/research/seguranca-e-entrega/docs/research/seguranca-e-entrega.md)). Decidido em [Base técnica do Marco 1](https://github.com/ThiagoPanini/minimal-me/issues/17).

## Considered Options

- **Servidor do Next (`output: "standalone"`)**, o molde da frota: libera Server Actions, Cache Components, `proxy` e a otimização de imagem sob demanda, e evita trocar de forma depois. Manteria em produção um servidor que nada na Home usa, com 384 MiB reservados em vez de 64 MiB ([Hospedagem e orçamento mensal](https://github.com/ThiagoPanini/minimal-me/issues/18)).
- **Export estático do Next servido por nginx** (escolhida).

## Consequences

- O projeto nasce com o Cache Components desligado, ao contrário do que o `create-next-app` 16.4 gera, porque ele não funciona com export estático ([documentação](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)). Server Actions, `after()` e `proxy` também ficam de fora ([static exports](https://nextjs.org/docs/app/guides/static-exports)).
- As ilustrações ganham tamanhos responsivos num passo do build, porque o `next/image` não otimiza num export. A página 404, o cache longo dos arquivos com hash e os cabeçalhos de segurança moram na configuração do nginx.
- O Autor, que quer se especializar em Next, aprende desde já o front end moderno do framework: App Router, Server Components renderizados no build, arquivos de metadados, `next/font/local`, React Compiler, rotas tipadas e `<ViewTransition>`. Os recursos de servidor entram com o space que precisar deles.
- **Gatilho para rever**: o primeiro space com recurso de servidor (formulário, login, dado por visita), provavelmente Frames & Songs. A troca para `standalone` muda a configuração de saída, o estágio final do Dockerfile, o tratamento das imagens e os limites de recursos, e traz de volta a urgência de patch para a esteira.
