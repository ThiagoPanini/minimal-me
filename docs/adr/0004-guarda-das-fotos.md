---
status: accepted
date: 2026-11-14
---

# Fotos de Frames & Fables no Cloudflare R2, com originais privados

Frames & Fables guarda o original de cada foto que o Autor envia e serve aos Visitantes cópias menores, sem os dados do arquivo (lugar, aparelho). Decidimos guardar tudo no Cloudflare R2: os originais num depósito privado, e as cópias públicas num depósito servido por um endereço da própria zona do Minimal Me. Uma cópia só fica pública enquanto a Publicação dela está publicada: um Rascunho nunca tem cópia alcançável, e despublicar ou excluir tira as cópias do ar e limpa o cache. O backup do banco também vai para o R2.

## Considered Options

- **MinIO na VPS**: nenhum serviço novo, mas prende as fotos ao disco e ao backup da VPS compartilhada. Na frota, o MinIO só roda em ambiente local, e o repositório dele foi arquivado em 2026-04-25 como "no longer maintained".
- **Disco da VPS, sem object storage**: o mais simples, com o mesmo problema de backup e sem caminho para servir as cópias pela borda da Cloudflare.
- **Cloudflare R2** (escolhida): o object storage de produção do life-under-control. A camada gratuita dá 10 GB-mês, 1 milhão de operações Classe A e 10 milhões Classe B por mês, com saída de dados grátis (developers.cloudflare.com/r2/pricing, lido em 2026-11-14).

## Consequences

- São dois depósitos, um privado e um público, onde o life-under-control tem um só, com URL assinada. A fronteira entre Rascunho e publicada vira regra da guarda, e não só da página.
- As fotos ficam fora do disco e do backup da VPS. O R2 vira um serviço a configurar na conta da Cloudflare, de preferência pelo MCP.
- Quantas cópias, em que formato e por qual endereço ficam na [pesquisa das cópias](https://github.com/ThiagoPanini/minimal-me/issues/35); como a foto chega ao R2 e é convertida, na [pesquisa do envio](https://github.com/ThiagoPanini/minimal-me/issues/36).
- O ambiente local precisa de um armazenamento compatível com S3. O MinIO, que a frota usa nisso, está arquivado: a escolha fica para a spec do Marco 2.
- Acima da camada gratuita, o custo cresce por GB guardado e por milhão de operações. A regra de orçamento fica com a [hospedagem](https://github.com/ThiagoPanini/minimal-me/issues/18).
