# Envio e conversão das fotos

Pesquisa do ticket [#36](https://github.com/ThiagoPanini/minimal-me/issues/36), parte do mapa do Marco 2 (Frames & Fables). Consultei a documentação do Cloudflare (R2 e proxy), do Pillow, do pillow-heif, do boto3, do Coolify, do MDN, do Next.js, do FastAPI, do Python e da glibc, e medi a conversão de fotos de 12 a 48 MP num venv descartável.

## Retomada

- **Estado**: completo.
- **Coberto**: seções 1–8 e a recomendação para a spec.
- **Pendente**:
  - vCPU e CPU reais da VPS (#11), para trocar as estimativas de tempo por medidas;
  - um teste com fotos reais de celular e com o seletor de fotos do iOS (as amostras daqui são sintéticas);
  - conferir num depósito R2 de verdade se ele cobra o `Content-Length` assinado e aceita `If-None-Match` em URL assinada (esta pesquisa não usou credenciais);
  - onde moram as cópias de rascunho, como viram públicas e se a imagem de compartilhamento pode ser WebP: tudo isso é da pesquisa de cópias e entrega;
  - o S3 real do contract test no CI, já que o MinIO foi arquivado.
- **Data**: 2026-11-14.

### O que esta pesquisa toma como dado

**Requisitos confirmados** (decididos pelo Autor em 2026-11-14; ver o [mapa #34](https://github.com/ThiagoPanini/minimal-me/issues/34)):

- web em Next e API interna em Python, na régua `panlabs-python-standards` ([ADR 0002](https://github.com/ThiagoPanini/minimal-me/blob/main/docs/adr/0002-backend-em-python.md));
- originais num depósito privado do R2, e cópias públicas só de publicação publicada ([ADR 0004](https://github.com/ThiagoPanini/minimal-me/blob/main/docs/adr/0004-guarda-das-fotos.md));
- o servidor aceita JPG, PNG, HEIC e WebP e converte na chegada, sem lugar nem aparelho nas cópias;
- cada foto sobe num pedido só dela, com progresso; "Publicar" espera todas, e uma falha se resolve na própria foto.

**Hipóteses** (do estúdio ou desta pesquisa):

- cópias de 480 px no lado menor e de 1400 px no lado maior (`#ff-bastidor`);
- só o Autor envia fotos, autenticado: a entrada é confiável, mas pode vir com defeito;
- a VPS tem 8 GB e, presumo, 2 vCPU. **Inferência**: é o que o plano de 8 GB da Hostinger costuma trazer; conferir no #11;
- a API roda num contêiner só, sem réplica.

---

## 1. Caminho do envio

Fontes:

- [R2 · Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) (atualizada em 12 nov 2026)
- [R2 · Configure CORS](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 · Limits](https://developers.cloudflare.com/r2/platform/limits/)
- [R2 · S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [R2 · Event notifications](https://developers.cloudflare.com/r2/buckets/event-notifications/)
- [Cloudflare · Connection limits](https://developers.cloudflare.com/fundamentals/reference/connection-limits/) (atualizada em 13 nov 2026)
- [Cloudflare · Error 524](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/)
- [Cloudflare · Default cache behavior, Upload limits](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
- [Next.js · proxyClientMaxBodySize](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize)
- [MDN · XMLHttpRequestUpload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequestUpload)
- [MDN · CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN · Forbidden request header](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header)
- [boto3 · generate_presigned_url](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3/client/generate_presigned_url.html)
- [botocore · Config](https://botocore.amazonaws.com/v1/documentation/api/latest/reference/config.html)
- Precedente da frota, lido localmente: ADR 0008 do LUC ("O upload é por URL assinada — o navegador sobe o arquivo direto pro R2, sem os bytes trafegarem pelo app") e `apps/api/src/luc_api/finance/adapters/r2_attachment_store.py`.

### O que as fontes dizem

URL assinada do R2 ([Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)):

- "Presigned URLs are generated server-side with no communication with R2": assinar é conta local, sem I/O. **Medido**: de 0,26 a 2,2 ms por URL com boto3 1.44.3; a primeira chamada é a mais lenta.
- Operações: GET, HEAD, PUT e DELETE. "`POST` (multipart form uploads via HTML forms) is not currently supported." Por isso não existe política de formulário com faixa de tamanho.
- Validade "from 1 second to 7 days (604,800 seconds)"; "The same presigned URL can be reused multiple times until it expires"; "Treat presigned URLs as bearer tokens."
- Com `ContentType` assinado, "uploads will fail with a `403/SignatureDoesNotMatch` error if the client sends a different `Content-Type`".
- "Presigned URLs work with the S3 API domain (`<ACCOUNT_ID>.r2.cloudflarestorage.com`) and cannot be used with custom domains."
- Limites do R2: "5 GiB (single-part)" por envio; e "Maximum concurrent writes to the same object name (key) | 1 per second", com 429 acima disso ([Limits](https://developers.cloudflare.com/r2/platform/limits/)).
- O `PutObject` aceita `If-None-Match`, avaliado "atomically against the committed bucket state" ([S3 API](https://developers.cloudflare.com/r2/api/s3/api/)).

CORS ([Configure CORS](https://developers.cloudflare.com/r2/buckets/cors/), [MDN · CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)):

- "Without a CORS policy, browser-based uploads and downloads using presigned URLs will fail, even though the presigned URL itself is valid."
- "Expired presigned URLs return a `403` `ExpiredRequest` response. R2 does not include CORS response headers on expired presigned URL responses, so browser JavaScript cannot read the error body."
- O exemplo oficial para PUT usa `AllowedMethods: ["PUT"]`, `AllowedHeaders: ["Content-Type"]`, `ExposeHeaders: ["ETag"]` e `MaxAgeSeconds: 3600`; "Browsers may limit this to 2 hours or less"; a regra pode levar "up to 30 seconds" para valer.
- Pelo MDN, um pedido simples precisa ser GET, HEAD ou POST e não pode ter ouvinte em `xhr.upload`. Um PUT com progresso, portanto, sempre faz preflight (OPTIONS).
- Também pelo MDN, o CORS vale para `fetch`, `XMLHttpRequest`, texturas WebGL e imagem lida de um canvas. Um `<img>` que só exibe a cópia não precisa de regra de GET.

Proxy da Cloudflare, pelo qual passaria o envio através da web:

- "Max upload size | 100 MB | 100 MB | 200 MB | Up to 5 GB" (Free, Pro, Business, Enterprise) ([Upload limits](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)).
- "Proxy Read Timeout | 125 | 524" e "Proxy Write Timeout | 30 | 524" ([Connection limits](https://developers.cloudflare.com/fundamentals/reference/connection-limits/)). A consolidação da frota (`consol` L3) registrou 100 s; a página atual diz 125 s.
- O 524 sai quando a origem "did not provide an HTTP response before the default 125 seconds". A saída sugerida é "Implement status polling of large HTTP processes" ([Error 524](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/)).
- No Next.js com `proxy` (o antigo middleware), "Next.js automatically clones the request body and buffers it in memory", e "By default, the maximum body size is **10MB**". Acima disso o corpo é cortado no limite ([proxyClientMaxBodySize](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize)).

Progresso e confirmação:

- `xhr.upload` emite `loadstart`, `progress` (com `loaded` e `total`), `loadend`, `error`, `abort` e `timeout`, e o exemplo do MDN enche uma barra com `event.loaded` ([XMLHttpRequestUpload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequestUpload)).
- `Content-Length` é cabeçalho proibido: quem o define é o navegador ([Forbidden request header](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header)).
- O R2 avisa quando um objeto chega, mas só para uma fila: "consume these messages with a consumer Worker or pull over HTTP" ([Event notifications](https://developers.cloudflare.com/r2/buckets/event-notifications/)).

boto3:

- "S3 presigned URLs use Signature Version 2 by default in regions where S3 supports it ... It is recommended to configure the S3 client with Signature Version 4 by setting signature_version='s3v4'" ([generate_presigned_url](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3/client/generate_presigned_url.html)). **Medido**: com `region_name="auto"` e o endpoint do R2, a URL já sai em SigV4. Fixar `s3v4` não custa nada.
- **Medido** com botocore 1.44.3: a URL de PUT não ganhou parâmetro de checksum, nem com o `Config()` padrão nem com `request_checksum_calculation="when_required"`. As opções estão em [botocore · Config](https://botocore.amazonaws.com/v1/documentation/api/latest/reference/config.html). O adapter do LUC fixa as duas opções em `when_required`, porque, segundo a docstring dele, versões recentes passaram a pedir cabeçalhos de checksum que o navegador não manda. Vale manter como defesa.
- **Medido**: `ContentLength` em `Params` entra na assinatura (`X-Amz-SignedHeaders=content-length;content-type;host`), e `IfNoneMatch="*"` também (`if-none-match`).

### Os dois caminhos

| | A. URL assinada, direto ao depósito privado | B. Pela web, que repassa à API |
|---|---|---|
| Teto por foto | 5 GiB do R2 | 100 MB do proxy da Cloudflare; 10 MB se a web tiver o `proxy` do Next, até mudar a configuração |
| Tempo | o PUT vai a `<ACCOUNT_ID>.r2.cloudflarestorage.com`. **Inferência**: esse endpoint não é a zona do hub, e os limites do proxy da zona não se aplicam a ele | o pedido inteiro fica sujeito ao 524: 125 s esperando resposta, 30 s escrevendo na origem |
| Banda da VPS | só a leitura do original pela API, uma vez | cada byte entra na VPS e sai de novo para o R2 |
| Processos presos | nenhum durante o envio | web e API presas a cada envio lento, até seis em paralelo |
| CORS | política no depósito privado | nenhuma, porque é a mesma origem |
| Cobrança dos 50 MB (seção 4) | depois do envio, com `HeadObject`. **Inferência**: com `Content-Length` assinado, o R2 recusaria antes | o servidor corta durante o fluxo |
| Precedente | LUC (ADR 0008) | nenhum na frota |
| Peças novas | assinatura, CORS e chamada de confirmação | multipart em fluxo, em duas camadas |

**Recomendação: A.** Ela tira o envio do proxy (o limite de 100 MB e o 524 deixam de valer) e da VPS, e repete o molde do LUC. O custo é a política de CORS, a rota de confirmação e a varredura da seção 6, que acha o `complete` perdido.

### Como fica o caminho A (proposta)

1. Escolhida a foto, o navegador confere tamanho e tipo (seção 4). Depois pede à web `POST /api/frames-and-fables/photos` com `{draftId, contentType, size}`, e a web repassa à API com o token curto ([ADR 0003](https://github.com/ThiagoPanini/minimal-me/blob/main/docs/adr/0003-entrada-do-autor.md)).
2. A API valida e cria a foto em `awaiting_upload`, presa ao rascunho. Depois assina um PUT para `originals/<photo_id>`, com `ContentType` e `ContentLength` declarados e validade de 15 min, e devolve `{photoId, uploadUrl, uploadHeaders, expiresAt}`.
   - O `ContentType` sai de uma lista fechada (`image/jpeg`, `image/png`, `image/heic`, `image/heif`, `image/webp`). Quando o navegador não informa o tipo, usa-se `application/octet-stream`. **Inferência**: navegadores fora do Safari podem dar tipo vazio a uma HEIC.
   - O formato de verdade sai do conteúdo, na conversão (seção 2).
3. O navegador faz o PUT com `XMLHttpRequest` e manda exatamente o `Content-Type` assinado. `xhr.upload.onprogress` enche o fio.
4. Com 200 do R2, o navegador chama `POST .../photos/{photoId}/complete`. A API faz `HeadObject` e confere se o objeto existe e se o tamanho é o declarado, até 50 MB. Então marca a foto como `received`, agenda a conversão e responde 202.
5. O navegador consulta `GET .../photos/{photoId}` a cada ~1 s até receber `ready` ou `rejected`:
   - `ready` traz largura, altura e URLs assinadas das cópias;
   - `rejected` traz o código do motivo.

   É o "status polling" que a própria Cloudflare recomenda contra o 524.
6. Se o PUT falhar (rede ou URL vencida, cujo erro chega ao JavaScript sem corpo legível por falta de CORS), o quadro diz "não chegou · tentar de novo". O toque pede URL nova (`POST .../photos/{photoId}/upload-url`) e repete.
   - A nova tentativa grava na mesma chave. O limite de uma escrita por segundo por chave não chega a pesar, porque repetir depende de um toque do Autor.

Política de CORS do depósito privado (proposta):

```json
[
  {
    "AllowedOrigins": ["https://<domínio do hub>"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

- Com `If-None-Match: *` assinado, que torna o original gravável uma vez só, entra `"If-None-Match"` em `AllowedHeaders`. Isso é opcional.
- `http://localhost:3000` entra só no depósito de desenvolvimento.
- As cópias, exibidas por `<img>` com URL assinada, não pedem GET na política.

Progresso por foto:

- O fio mede os bytes enviados (`loaded / total`).
- Proposta: o envio leva o fio até ~90%, e o resto enche quando a API responde `ready`. A conversão de uma HEIC de 48 MP leva segundos (seção 3), e um fio cheio que não revela parece travado. Fica como decisão de desenho para a rodada no Claude Design.
- A linha "Enviando N fotos…" conta as fotos que ainda não estão `ready`.
- **Inferência**: `fetch` não emite progresso de envio, por isso `XMLHttpRequest`.

Confirmação sem o navegador:

- Se o PUT terminou e o `complete` não veio (a aba fechou), a varredura da seção 6 acha a foto `awaiting_upload` antiga, faz `HeadObject` e, se o original estiver lá, marca `received` e converte.
- As event notifications do R2 fariam o mesmo sem depender do navegador, mas pedem uma fila do Cloudflare Queues e um consumidor. Ficam como gatilho de reabertura.

---

## 2. Conversão em Python

Fontes:

- [PyPI · pillow-heif (JSON)](https://pypi.org/pypi/pillow-heif/json) e [PyPI · Pillow (JSON)](https://pypi.org/pypi/pillow/json)
- [pillow-heif · LICENSES_bundled.txt](https://github.com/bigcat88/pillow_heif/blob/master/LICENSES_bundled.txt), [README](https://github.com/bigcat88/pillow_heif/blob/master/README.md) e [CHANGELOG](https://github.com/bigcat88/pillow_heif/blob/master/CHANGELOG.md)
- [pillow-heif · Installation](https://pillow-heif.readthedocs.io/en/stable/installation.html), [Pillow Plugin](https://pillow-heif.readthedocs.io/en/stable/pillow-plugin.html), [Options](https://pillow-heif.readthedocs.io/en/stable/options.html) e [Workarounds](https://pillow-heif.readthedocs.io/en/stable/workaround-orientation.html) (documentação da 1.8.1)
- [Pillow · 13.0.0](https://pillow.readthedocs.io/en/stable/releasenotes/13.0.0.html), [Image](https://pillow.readthedocs.io/en/stable/reference/Image.html), [ImageOps](https://pillow.readthedocs.io/en/stable/reference/ImageOps.html), [ImageCms](https://pillow.readthedocs.io/en/stable/reference/ImageCms.html), [Image file formats](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html) e [Security](https://pillow.readthedocs.io/en/stable/handbook/security.html)

### pillow-heif

- **Versão atual: 1.8.1**, de 2026-10-11. `requires_python >=3.10`, depende de `pillow>=11.1.0` ([PyPI](https://pypi.org/pypi/pillow-heif/json)).
- A 1.8.1 "is the last version that supports `Python 3.10` and `Pillow` `11`/`12`: version `1.9.0` will require `Pillow 13`" ([CHANGELOG](https://github.com/bigcat88/pillow_heif/blob/master/CHANGELOG.md)). **Medido**: a 1.8.1 importa e converte com Pillow 13.0.0.
- **Licença** ([LICENSES_bundled.txt](https://github.com/bigcat88/pillow_heif/blob/master/LICENSES_bundled.txt)):
  - "The "pillow-heif" source code is licensed under the BSD-3-Clause license";
  - "License for "pillow-heif" binary wheels: GPLv2, due to base library licenses": libheif e libde265 são LGPLv3, x265 é GPLv2;
  - a 1.6.0 tirou o classificador GPLv2 do pacote e passou a descrever as licenças embutidas nesse arquivo ([CHANGELOG](https://github.com/bigcat88/pillow_heif/blob/master/CHANGELOG.md)).
  - **Inferência, não é parecer jurídico**: rodar no servidor não é distribuir. Publicar a imagem Docker num registro público é distribuir, e aí a imagem deve levar os avisos de licença e o caminho do código-fonte. Com a imagem privada no GHCR, a questão não aparece.
- **Wheels**: a 1.8.1 publica wheels manylinux para x86_64 (`manylinux_2_27`/`manylinux_2_28`) e para aarch64 (`manylinux_2_26`/`manylinux_2_28`), mais musllinux para os dois, de cp310 a cp315, além das versões free-threaded cp314t e cp315t ([PyPI](https://pypi.org/pypi/pillow-heif/json)). O README resume: "x86_64, aarch64 wheels".
- **HEVC sem dependência do sistema**. **Medido**: a wheel traz `libheif 1.23.6`, `libde265 1.1.3` (o decodificador) e `libx265 4.3` (o codificador) em `pillow_heif.libs/`. O módulo só liga em glibc, libstdc++, libgcc_s e libm, e `libheif_info()` lista "libde265 HEVC decoder, version 1.1.3".
  - A documentação desaconselha a outra via: "Distro packages are too old: even the strukturag PPA tops out at libheif 1.19.x" ([Installation](https://pillow-heif.readthedocs.io/en/stable/installation.html)).
- **Segurança**: o README avisa que a variante leve pi-heif foi descontinuada e embute a libheif 1.23.0, "affected by CVE-2026-84383, a heap buffer overflow that can be triggered by decoding a crafted HEIC file", e manda migrar para a última pillow-heif.
- **Tipos**: `py.typed` desde a 1.7.0; a 1.8.0 corrigiu nomes que o Pyright tomava por privados ([CHANGELOG](https://github.com/bigcat88/pillow_heif/blob/master/CHANGELOG.md)). Serve ao pyright strict da régua.
- **Plugin** ([Pillow Plugin](https://pillow-heif.readthedocs.io/en/stable/pillow-plugin.html), [Options](https://pillow-heif.readthedocs.io/en/stable/options.html)):
  - "Currently all images are opened in RGB or RGBA 8 bit modes."
  - Liga com `register_heif_opener(thumbnails=False, depth_images=False, aux_images=False, decode_threads=N)`. `DECODE_THREADS` vale 4 por padrão; `DISABLE_SECURITY_LIMITS` vale `False` e deve ficar assim.
  - Desde a 1.8.0, `thumbnail()` e `draft` usam a miniatura embutida quando ela é "big enough". Com `thumbnails=False`, a decodificação é sempre da imagem inteira.
- **Orientação** ([Workarounds](https://pillow-heif.readthedocs.io/en/stable/workaround-orientation.html)): numa HEIF a rotação vem da propriedade `irot`, e a libheif a aplica. O plugin zera a tag EXIF ao abrir, "by calling set_orientation() function".
  - **Medido**: a HEIC de teste, gravada com orientação 6, abriu já em retrato (4284×5712), com a tag em 1, e `ImageOps.exif_transpose` não mudou nada.

### Pillow

- **Versão atual: 13.0.0**, de 2026-10-16. Licença MIT-CMU, `requires_python >=3.11` ([PyPI](https://pypi.org/pypi/pillow/json)).
- A 13.0.0 corrigiu, entre outras, "JPEG decoder buffer overflow from scanlines wider than tile extents" (crítica) e "Unbounded Exif header replacement loop" (alta) ([13.0.0](https://pillow.readthedocs.io/en/stable/releasenotes/13.0.0.html)). Por isso, fixar `pillow>=13.0.0`.
- JPG, PNG e WebP estão entre os "Fully supported formats" ([Image file formats](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html)). **Medido**: a wheel 13.0.0 traz libwebp 1.6.0, libavif 1.4.2 e LittleCMS 2.19.
- **Bomba de descompressão** ([Image](https://pillow.readthedocs.io/en/stable/reference/Image.html)):
  - `MAX_IMAGE_PIXELS` vem "Set to 89,478,485"; acima disso sai `DecompressionBombWarning`;
  - "If the number of pixels is greater than twice MAX_IMAGE_PIXELS, then a DecompressionBombError will be raised instead";
  - a página de segurança manda "treat Image.DecompressionBombWarning as an error" e "set a practical dimension ceiling below MAX_IMAGE_PIXELS" ([Security](https://pillow.readthedocs.io/en/stable/handbook/security.html)).
- **Formato pelo conteúdo**: "Image.open() detects format by magic bytes, not file extension or MIME type". A mitigação é "pass the formats argument with an allowlist" ([Security](https://pillow.readthedocs.io/en/stable/handbook/security.html)).
- **draft**: o método "is currently implemented only for JPEG and MPO images". No JPEG, reduz para "1/2, 1/4 or 1/8 of their original size while loading them" ([Image](https://pillow.readthedocs.io/en/stable/reference/Image.html), [Image file formats](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html)).
- **Orientação**: `ImageOps.exif_transpose`: "If an image has an EXIF Orientation tag, other than 1, transpose the image accordingly, and remove the orientation data" ([ImageOps](https://pillow.readthedocs.io/en/stable/reference/ImageOps.html)).
- **Redimensionar**: `resize(size, Resampling.LANCZOS, reducing_gap=...)`. Com `reducing_gap` de 3,0 ou mais, "the result is indistinguishable from fair resampling in most cases" ([Image](https://pillow.readthedocs.io/en/stable/reference/Image.html)).
- **sRGB**: `ImageCms.profileToProfile(im, inputProfile, outputProfile, renderingIntent=..., outputMode=...)`, com `ImageCms.createProfile("sRGB")` como destino ([ImageCms](https://pillow.readthedocs.io/en/stable/reference/ImageCms.html)).
- **WebP**: `quality` vale 80 por padrão; `method` vai de "0=fast" a "6=slower-better" e vale 4 por padrão; `icc_profile`, `exif` e `xmp` são opções de gravação ([Image file formats](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html)).
- **Metadados** ([Security](https://pillow.readthedocs.io/en/stable/handbook/security.html)):
  - "Pillow preserves EXIF, XMP, IPTC, ICC profiles, and comments when round-tripping images";
  - a página manda "explicitly strip EXIF and XMP on save (set exif=b"", icc_profile=None, omit pnginfo); verify output with exiftool in CI";
  - e também "create a new image instance via image.copy() and delete the image.info contents".

**Medido** sobre metadados, com um JPEG e uma HEIC que levavam orientação, aparelho, GPS, XMP com GPS e perfil ICC:

- `info` com `exif`, `xmp` e `icc_profile` atravessa o `resize`.
- Gravando WebP ou JPEG sem passar metadados, o Pillow 13.0.0 já entregou o arquivo limpo: sem EXIF, XMP, ICC nem GPS. Isso não vale como contrato, porque a página de segurança diz que o Pillow preserva metadados. O pipeline limpa `info`, passa `exif=b""`, `xmp=b""` e `icc_profile=None`, e um teste do adapter confere a saída.

### O pipeline proposto

A ordem difere da óbvia em três pontos, medidos na seção 3: `draft` no JPEG, e orientação e cor aplicadas só nas cópias.

1. Ler o original (até 50 MB) em memória.
2. Abrir com `Image.open(data, formats=["JPEG", "PNG", "WEBP", "HEIF"])`, com o plugin registrado com `thumbnails=False, depth_images=False, aux_images=False, decode_threads=2`. Abrir só lê o cabeçalho.
3. Conferir os limites da seção 4 com as dimensões já orientadas, antes de decodificar. JPG, PNG e WebP se orientam pela tag EXIF; a HEIC já vem orientada.
4. No JPEG, chamar `draft("RGB", ...)` pedindo pelo menos o dobro de cada cópia.
5. Decodificar com `load()` e converter para RGB só se o modo for outro.
   - **Inferência**: foto de celular não tem transparência. PNG com alfa é captura de tela e se compõe sobre um fundo fixo.
6. Fazer a cópia grande: LANCZOS com `reducing_gap=3.0` até 1400 px no lado maior. Depois, liberar a imagem cheia.
7. Na cópia grande, aplicar `exif_transpose` (a tag viaja em `info`) e converter para sRGB com o perfil do original, quando houver um e ele não for sRGB.
8. Fazer a cópia pequena a partir da grande: 480 px no lado menor, nunca maior que a grande.
9. Gravar cada cópia: `copy()`, `info.clear()`, WebP com `quality=80, method=4, exif=b"", xmp=b"", icc_profile=None`.
   - **Inferência**: sem perfil embutido, o navegador trata a imagem como sRGB.
10. Antes de descartar o original, ler `DateTimeOriginal` e `OffsetTimeOriginal` do EXIF dele, para o compositor oferecer a data do arquivo (caminho 7 do `#ff-autor`). A data fica no registro privado da foto, nunca nas cópias.

Esboço do núcleo do adapter (o limite de pixels e o filtro de aviso vão no `provide_image_processor`, porque mexem em estado global do Pillow):

```python
import io

from PIL import Image, ImageCms, ImageOps

_ALLOWED_FORMATS = ["JPEG", "PNG", "WEBP", "HEIF"]
_SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB"))


def _render(original: bytes, sizes: CopySizes) -> RenderedCopies:
    image = Image.open(io.BytesIO(original), formats=_ALLOWED_FORMATS)
    if image.format == "JPEG":
        image.draft("RGB", sizes.draft_request(image.size))
    icc = image.info.get("icc_profile")
    image.load()
    if image.mode != "RGB":
        image = image.convert("RGB")
    large = image.resize(sizes.large_stored, Image.Resampling.LANCZOS, reducing_gap=3.0)
    del image
    large = ImageOps.exif_transpose(large)
    if icc:
        source = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        large = ImageCms.profileToProfile(large, source, _SRGB, outputMode="RGB")
    small = large.resize(sizes.small, Image.Resampling.LANCZOS)
    return RenderedCopies(large=_encode(large), small=_encode(small))


def _encode(copy: Image.Image) -> bytes:
    clean = copy.copy()
    clean.info.clear()
    buffer = io.BytesIO()
    clean.save(buffer, format="WEBP", quality=80, method=4, exif=b"", xmp=b"", icc_profile=None)
    return buffer.getvalue()
```

### Formato das cópias

- **Recomendo WebP.** As amostras do protótipo já são WebP, o Pillow grava sem nada a mais e as duas cópias saíram em ~0,2 s. **Medido**: `method=6` dobrou esse tempo para ganhar ~1% em bytes.
- AVIF também grava no Pillow 13 (libavif 1.4.2). Não medi; fica como alternativa se o orçamento de carga apertar.
- A imagem de compartilhamento usa "a cópia cheia", como decidido no mapa #34. Se os leitores de link aceitam WebP é pergunta da pesquisa de cópias e entrega.
- **Sem medida**: uma HEIC de Android só com perfil nclx, sem ICC, seria tratada como sRGB. Se as primárias dela forem P3, a cor desvia. Conferir com um arquivo real.

---

## 3. Onde roda

Fontes:

- [Pillow · Security](https://pillow.readthedocs.io/en/stable/handbook/security.html) e [Block allocator](https://pillow.readthedocs.io/en/stable/reference/block_allocator.html)
- [Python · concurrent.futures](https://docs.python.org/3/library/concurrent.futures.html)
- [mallopt(3)](https://man7.org/linux/man-pages/man3/mallopt.3.html)
- [pillow-heif · Options](https://pillow-heif.readthedocs.io/en/stable/options.html)
- [FastAPI · Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)

### Medidas

**Ambiente**: WSL2 num Intel i7-12700H (20 threads lógicas), Python 3.12.3, Pillow 13.0.0 e pillow-heif 1.8.1 (libheif 1.23.6).

**Amostras**: sintéticas, um gradiente com ruído. Todas levam EXIF (orientação 6, aparelho, data e GPS), XMP com GPS e um perfil Display P3 montado à mão. As HEIC são gravadas em ladrilhos de 512 px, como as do iPhone.

**Método**: cada linha é um processo novo. O pico é `ru_maxrss`, e a base depois dos imports fica em 22 MB.

- O caminho "direto" decodifica, orienta e converte a cor na imagem cheia, e depois reduz.
- O caminho "proposto" é o da seção 2.

| Amostra | Caminho | Threads de decodificação | Pico | Total | Decodificação |
|---|---|---|---|---|---|
| HEIC 48 MP (8064×6048, 23,1 MB) | direto | 4 | 458 MB | 4,5 s | 2,5 s |
| HEIC 48 MP (23,1 MB) | proposto | 4 | 430–437 MB | 3,1–5,1 s | 2,1–3,6 s |
| HEIC 48 MP (23,1 MB) | proposto | 2 | 432 MB | 3,6 s | 2,8 s |
| HEIC 48 MP (23,1 MB) | proposto | 1 | 428 MB | 7,9 s | 7,1 s |
| HEIC 48 MP (mesmos pixels, 1,1 MB) | proposto | 2 e 4 | 360–365 MB | 1,5–1,6 s | 0,7–0,8 s |
| HEIC 24 MP (5712×4284, 11,6 MB) | direto / proposto | 4 / 2 | 259 / 240 MB | 2,4 / 2,2 s | 1,0 / 1,7 s |
| JPEG 48 MP (9,4 MB) | direto / proposto (draft para 4032×3024) | — | 396 / 93 MB | 2,7 / 0,67 s | 0,33 / 0,18 s |
| JPEG 12 MP (2,4 MB) | direto / proposto | — | 117 / 93 MB | 0,83 / 0,49 s | 0,08 / 0,07 s |

O que a tabela mostra:

- **A HEIC de 48 MP pesa ~430 MB, quase todos na decodificação.** São 7 a 8,4 bytes por pixel acima da base. **Inferência**, por extrapolação linear:
  - 64 MP ≈ 560 MB, mais o original em memória;
  - 89,5 MP, o limite padrão do Pillow, ≈ 770 MB;
  - 200 MP ≈ 1,7 GB.
- **No JPEG, `draft` derruba o pico de 396 para 93 MB** e o tempo de 2,7 para 0,67 s.
- **Orientar e converter a cor na imagem cheia custou 0,9 a 1,3 s; nas cópias, 0,05 a 0,08 s.** A conversão P3 → sRGB com o perfil do arquivo rodou sem erro.
- **Threads de decodificação**: com 1, a decodificação levou 7,1 s; com 2, 2,8 s; com 4, de 2,1 a 3,6 s (variou entre execuções). Numa VPS de 2 vCPU, `decode_threads=2`.
- **O tamanho do arquivo pesa na HEIC.** Os mesmos pixels decodificaram em 0,7–0,8 s com 1,1 MB e em 2,1–3,6 s com 23,1 MB. **Inferência**: uma HEIC real de 48 MP fica entre os dois extremos.
- **Gravar as duas cópias em WebP** custou 0,20–0,27 s com `method=4` e 0,47 s com `method=6`.
- **Cópias resultantes**: a grande sai com 1050×1400 px e a pequena com 480×640 px. Nas amostras sintéticas, a grande teve de 145 a 268 KB e a pequena de 61 a 111 KB; foto real comprime mais.

**GIL.** Medido com uma thread trabalhando e a thread principal acordando a cada 5 ms:

| Etapa (HEIC 48 MP, 23,1 MB) | Duração | Maior pausa da thread principal |
|---|---|---|
| decodificar | 3,4 s | 48 ms |
| LANCZOS, sem reducing gap | 1,2 s | 11 ms |
| WebP, `method=6` | 0,46 s | 8 ms |

No JPEG de 48 MP, nenhuma pausa passou de 8 ms. Decodificar, redimensionar e gravar liberam o GIL, então `asyncio.to_thread` não congela o laço de eventos.

**Memória devolvida.** Medido com quatro conversões seguidas da HEIC de 48 MP (`decode_threads=2`) num `ThreadPoolExecutor(max_workers=1)`, como faria `to_thread`, num processo que fica de pé:

| glibc | RSS depois de cada conversão | Pico |
|---|---|---|
| padrão | 132 → 160 → 167 → 191 MB | 431 → 485 MB |
| `MALLOC_ARENA_MAX=2` | 51 → 58 → 74 → 126 MB | 406 → 441 MB |
| `MALLOC_MMAP_THRESHOLD_=131072` | 33 → 30 → 30 → 30 MB | 398 MB, estável |

O motivo está no [mallopt(3)](https://man7.org/linux/man-pages/man3/mallopt.3.html):

- "Nowadays, glibc uses a dynamic mmap threshold by default ... when blocks larger than the current threshold ... are freed, the threshold is adjusted upward";
- "Dynamic adjustment of the mmap threshold is disabled if any of the M_TRIM_THRESHOLD, M_TOP_PAD, M_MMAP_THRESHOLD, or M_MMAP_MAX parameters is set";
- `MALLOC_MMAP_THRESHOLD_` é a variável de ambiente do mesmo parâmetro.

O Pillow aloca imagem grande em blocos de até 16 MB e não guarda blocos livres por padrão: `PILLOW_BLOCKS_MAX` "Defaults to 0" ([Block allocator](https://pillow.readthedocs.io/en/stable/reference/block_allocator.html)).

**Processo novo**: subir um interpretador e importar Pillow e pillow-heif custou 0,07 a 0,12 s e 22 MB (medido).

### As três opções

| | Thread dentro da API | Processo filho dentro da API | Worker à parte |
|---|---|---|---|
| Forma | `asyncio.to_thread` no adapter, atrás de um semáforo | `ProcessPoolExecutor(max_workers=1)` | segundo deployable, que lê uma fila no Postgres |
| Laço de eventos | livre: o GIL é liberado (medido) | livre | livre |
| Memória | o pico de ~430 MB cai no processo da API, e o RSS volta com `MALLOC_MMAP_THRESHOLD_` (medido) | o pico cai no filho, e o OOM leva o filho | contêiner com limite próprio |
| Queda no C (libheif, libde265) | derruba a API | `BrokenProcessPool`: recria-se o pool | derruba só o worker |
| Durabilidade | estado no banco e retomada (seção 7) | igual | igual |
| Peças novas | nenhuma | ciclo de vida do pool, serialização, recriação | contêiner, entry-point, fila e deploy |

Mais duas fontes pesam:

- A página de segurança do Pillow põe em primeiro lugar "Sandbox image processing — run Pillow workers in a seccomp/AppArmor restricted subprocess, isolated from the main application process".
- O espécime da régua usa Python 3.14, e a documentação do `ProcessPoolExecutor` registra só na versão 3.15 a correção de um travamento do `max_tasks_per_child`: "Fixed a deadlock (gh-115634) where the executor could hang after a worker process exited upon reaching its max_tasks_per_child limit while tasks remained queued" ([concurrent.futures](https://docs.python.org/3/library/concurrent.futures.html)).

**Recomendação: thread dentro da API**, com quatro travas:

- semáforo de 1: uma conversão por vez;
- `decode_threads=2`;
- `MALLOC_MMAP_THRESHOLD_=131072` no ambiente do contêiner;
- limite de 1 GB de memória no contêiner da API.

O cenário que justificaria o processo filho é uma queda no C derrubando a API. Com um único remetente autenticado, esse cenário é improvável, e o custo do filho é certo.

Como a conversão sai do pedido:

- O `complete` não espera a conversão. A borda agenda `process_photo` e responde 202. Serve o `BackgroundTasks` do FastAPI, que roda tarefas "after returning a response", no mesmo processo ([Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)).
- A mesma página avisa que, para "heavy background computation" fora do processo, ferramentas como o Celery são a saída. Aqui não compensam: é uma conversão por vez, de um único Autor.
- O agendamento não é durável. A durabilidade vem do estado da foto (`received`, ou `processing` com reserva), que a consulta, o arranque e a tarefa diária retomam (seção 7).

**Gatilhos de reabertura**:

- a primeira queda da API atribuída à decodificação;
- uma segunda fonte de envio, que traria entrada não confiável;
- latência visível nas leituras públicas durante uma conversão.

Se reabrir, vale o processo filho, sem `max_tasks_per_child` enquanto a base for 3.14, e com o mesmo `MALLOC_MMAP_THRESHOLD_` no filho.

### Concorrência e tempo na VPS (estimativa)

- **Concorrência**: uma conversão por vez. Com 2 vCPU, duas conversões não ficariam mais rápidas, porque cada uma já usa as duas, e dobrariam o pico para ~0,9 GB numa máquina dividida com outros projetos.
- **Memória reservada**: 1 GB no contêiner da API. **Inferência**: a base da API com FastAPI, SQLAlchemy e boto3 deve ficar em 100 a 200 MB; somando o pico de ~610 MB no limite de 64 MP (seção 4), sobra folga.
- **Tempo por foto, medido aqui**: 0,5 s num JPEG de 12 MP, 0,7 s num JPEG de 48 MP e de 1,5 a 5 s numa HEIC de 48 MP.
- **Tempo na VPS (inferência)**: num vCPU compartilhado, espere de 1,5 a 2 vezes isso, mais o download do original do R2. Uma série de 6 HEIC de 48 MP ficaria pronta em ~15 a 60 s, enquanto o Autor enquadra e escreve.
- Medir de novo na VPS quando o #11 trouxer a CPU.

---

## 4. Limites

Fontes: [Pillow · Image](https://pillow.readthedocs.io/en/stable/reference/Image.html) e [Security](https://pillow.readthedocs.io/en/stable/handbook/security.html) (`MAX_IMAGE_PIXELS`, formatos por lista fechada, teto de tamanho "before passing data to Pillow"), [R2 · Limits](https://developers.cloudflare.com/r2/platform/limits/) e as medidas da seção 3. Os valores são propostas desta pesquisa.

Cada limite é conferido em até três lugares:

- **No navegador**, antes de enviar: aviso imediato.
- **Na API, ao assinar**: valores declarados, e o `Content-Length` assinado.
- **Na conversão**: valores reais. A foto vira `rejected` com um código, o navegador recebe esse código na consulta e mostra o texto.

Como no protótipo, a falha aparece no quadro ("não chegou · tentar de novo") e numa mensagem curta no pé da tela. Os textos abaixo seguem o tom do protótipo ("Só fotos entram aqui.", "Uma das fotos não abriu neste navegador.") e vão à rodada do Claude Design.

| Limite | Valor proposto | Onde | Código | No quadro | Mensagem no pé da tela |
|---|---|---|---|---|---|
| Formato | JPG, PNG, HEIC/HEIF e WebP, pelo conteúdo (`formats=`), não pela extensão | navegador (tipo e extensão); conversão (conteúdo) | `unsupported_format` | "formato fora · remover" | "Só JPG, PNG, HEIC ou WebP entram aqui." |
| Não é imagem | — | navegador | — | — | "Só fotos entram aqui." (já existe no protótipo) |
| Tamanho do arquivo | 50 MB | navegador (`file.size`); assinatura; `complete` (`HeadObject`) | `file_too_large` | "grande demais · remover" | "Uma foto passa de 50 MB e ficou de fora." |
| Pixels | 64 MP, com `Image.MAX_IMAGE_PIXELS = 64_000_000` e o aviso tratado como erro | conversão, ainda no cabeçalho | `too_many_pixels` | "grande demais · remover" | "Uma foto passa de 64 megapixels. Envie uma versão menor." |
| Proporção | até 3 por 1, nos dois sentidos | navegador, se ele abre a foto; conversão | `aspect_ratio_out_of_range` | "estreita demais · remover" | "Uma foto é mais comprida que 3 por 1. Recorte e envie de novo." |
| Lado menor | pelo menos 480 px | conversão | `too_small` | "pequena demais · remover" | "Uma foto tem menos de 480 px no lado menor." |
| Arquivo com defeito | — | conversão (`UnidentifiedImageError`, erro de decodificação) | `unreadable` | "não abriu · remover" | "Uma foto não abriu. Remova e escolha outra." |
| Envio que falhou | — | navegador (XHR) | — | "não chegou · tentar de novo" (já existe) | "Uma foto não chegou. Toque nela para tentar de novo, ou remova." (já existe) |

Por que esses valores:

- **50 MB.** Cobre com folga JPG, HEIC e WebP de qualquer modo comum de celular. Só um PNG enorme passa disso, e para ele a saída é exportar em JPG.
  - O teto também limita o que a API põe na memória ao ler o original. A página de segurança do Pillow pede "enforce a file-size limit before passing data to Pillow".
  - **Inferência**: os tamanhos típicos de arquivo por modo de câmera não vêm de fonte.
- **64 MP.** **Inferência** sobre as resoluções:
  - cobre os modos padrão (12, 24, 48 e 50 MP; por exemplo 8064×6048 no iPhone e 8160×6144 nos 50 MP do Pixel);
  - recusa os modos opcionais de 108 e 200 MP.

  A memória decide: ~560 MB de pico no limite (seção 3) cabem em 1 GB com uma conversão por vez, e 200 MP pediriam ~1,7 GB.
  - O limite padrão do Pillow, 89,5 MP com o aviso como erro, também serviria, mas com ~770 MB de pico.
  - Fixar o valor no `MAX_IMAGE_PIXELS` faz o próprio Pillow cobrar o teto já no `Image.open`, que só lê o cabeçalho.
  - **Medido**: com o teto em 40 MP e o aviso como erro, a HEIC e o JPEG de 48 MP levantaram `DecompressionBombWarning` na abertura, e a HEIC de 24 MP abriu. Com o teto em 20 MP (menos da metade de 48), saiu `DecompressionBombError`. E uma HEIC aberta com `formats=["JPEG"]` deu `UnidentifiedImageError`.
  - O adapter traduz as duas exceções em `too_many_pixels`. A regra de domínio repete o teto, para que o fake e o adapter real recusem igual.
- **3 por 1.** Com as cópias de 480 px no lado menor e 1400 px no lado maior, a partir de ~2,92:1 a cópia "pequena" passa a ser maior que a "grande" (480 × 2,92 ≈ 1400).
  - Por isso a regra "a pequena nunca passa da grande" (passo 8 da seção 2).
  - Uma foto mais comprida que 3:1 aparece como faixa fina na foto aberta a 390 px. O panorama do celular quase sempre passa disso e terá de ser recortado.
- **480 px.** É o lado menor da cópia pequena; abaixo disso seria preciso ampliar.
- **Animação.** Um WebP ou PNG animado entra pelo primeiro quadro, que é o que o `Image.open` entrega por padrão. **Inferência**: celular não grava esses formatos animados no modo foto.

---

## 5. Enquadrar uma HEIC num navegador que não a mostra

Fontes:

- [Safari 17 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-17-release-notes) (lida pelo JSON da página): "Added support for HEIC/HEIF images."
- [MDN · image-orientation](https://developer.mozilla.org/en-US/docs/Web/CSS/image-orientation): `from-image` é o "Default initial value. The EXIF information contained in the image is used to rotate the image appropriately."
- [pillow-heif · Workarounds](https://pillow-heif.readthedocs.io/en/stable/workaround-orientation.html)
- O protótipo: "As ferramentas só aparecem com a foto pronta" (protótipo arquivado, camada do Autor). O enquadramento é `[x, y, z]`: posição relativa na folga e aproximação de 1 a 3, com o lado do quadrado igual ao menor lado dividido por `z` (protótipo arquivado, camada do Autor).

**Medido**: no Chromium headless (Chrome for Testing 153.0.8010.12), um `<img>` com HEIC deu `error`, e WebP e JPEG abriram. **Inferência**: o Firefox também não abre HEIC; o Safari abre desde a versão 17, pelas notas da Apple.

Fluxo proposto:

1. Escolhida a foto, o compositor tenta abri-la no próprio navegador (`createImageBitmap(file)` ou um `<img>` com URL de objeto).
   - Se abrir (Safari, ou qualquer JPG, PNG e WebP), a prévia local serve para enquadrar, como no protótipo. O navegador já aplica a orientação do EXIF por padrão (`image-orientation: from-image`), então a prévia e as cópias do servidor ficam na mesma orientação.
   - Se não abrir, o quadro mostra só o fio do envio, sem a mensagem "Uma das fotos não abriu neste navegador.", porque ela foi enviada mesmo assim.
2. A foto sobe e é convertida (seções 1 e 3). Ao chegar a `ready`, a API devolve URLs assinadas das duas cópias, já orientadas e em sRGB.
3. O compositor troca a prévia que faltou pela **cópia grande** e então mostra as ferramentas de enquadrar.
   - Com a grande, uma aproximação de 3× numa foto 3:4 ainda mostra 350 px de lado. Na pequena seriam 160 px, o mesmo conflito entre a aproximação e a cópia pequena que a varredura de 2026-11-14 achou no protótipo.
   - A fita usa a pequena.
4. O enquadramento `[x, y, z]` é relativo, então vale igual para o original e para as duas cópias, desde que a cópia mantenha a proporção e a orientação do original. As duas condições o pipeline garante.
5. Para uma HEIC no Chrome ou no Firefox, enquadrar espera o envio e a conversão, alguns segundos. O protótipo já admite essa espera, porque só mostra as ferramentas com a foto pronta.

Alternativa descartada: converter a HEIC no aparelho com um decodificador em WebAssembly. Ela pesaria no peso da página e na bateria do celular, de onde se publica, para resolver um caso que a cópia do servidor já resolve.

**Inferência a conferir no aparelho**: o seletor de fotos do iOS pode entregar um JPEG em vez da HEIC ao formulário. Se entregar, o caso HEIC fica para quem envia do computador ou do Android.

---

## 6. Fotos órfãs

Fontes:

- [Coolify · Scheduled tasks overview](https://coolify.io/docs/core/automation/scheduled-tasks/overview), [Create a task](https://coolify.io/docs/core/automation/scheduled-tasks/create-a-task) e [Cron syntax](https://coolify.io/docs/core/automation/cron-syntax)
- [R2 · Pricing](https://developers.cloudflare.com/r2/pricing/) (atualizada em 30 out 2026), [Object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) e [Configure CORS](https://developers.cloudflare.com/r2/buckets/cors/)
- O protótipo arquivado, na camada do Autor: o que "Fechar" faz em cada situação; as fotos órfãs, que ele não trata.

### O que as fontes dizem

Coolify:

- A tarefa roda "a command inside an application or service container on a recurring schedule". Tem nome, comando, "Run in a shell" (`sh -c`), frequência ("a five-field cron expression or a supported named schedule"), tempo limite e contêiner.
- "Do not include docker exec": o Coolify entra no contêiner.
- O tempo limite aceita "values from 60 to 36000 and uses 300 seconds by default".
- "Coolify evaluates the schedule in the timezone configured for the server that runs the resource."
- Sem contêiner de pé, a execução vira "Skipped".
- Falhas: "notifies the team on the first failure, then at most once a day. After 10 failures in a row, when the first failure is more than 24 hours old, Coolify disables the task."

R2:

- Classe A inclui `ListObjects` e `PutObject`; classe B inclui `HeadObject` e `GetObject`; "Free operations include `DeleteObject`, `DeleteBucket` and `AbortMultipartUpload`". O plano gratuito dá 1 milhão de classe A e 10 milhões de classe B por mês.
- As regras de ciclo de vida apagam por prefixo e idade, mas "Objects will typically be removed from a bucket within 24 hours"; e "Buckets have a default lifecycle rule to expire multipart uploads seven days after initiation".
- Um PUT único que não termina não deixa objeto. **Inferência** pelo modelo do S3: o objeto só existe quando o PUT completa.
- A URL assinada continua válida até vencer, mesmo que a foto tenha sido apagada no banco. Um PUT atrasado pode, então, criar um original sem registro.

### De onde vêm as órfãs

Pelo comportamento do protótipo, o que pode sobrar:

- uma foto enviada numa publicação já publicada e descartada em "Fechar de novo descarta";
- uma foto removida de uma série que depois foi salva sem ela;
- uma foto enviada num rascunho de que se tiraram todas as fotos e que "fecha sem guardar";
- uma foto cujo `complete` nunca chegou: o original pode estar no R2 sem que a API saiba;
- um original gravado por uma URL ainda válida depois que a foto sumiu do banco.

O que **não** é órfã é a foto que não chegou e segue num rascunho. Ela fica no quadro como "não chegou" até o Autor remover, e não ocupa espaço no R2.

A regra que cobre todos os casos: **uma foto é órfã quando nenhuma série salva (de rascunho ou de publicada) a referencia e ela tem mais de 7 dias**.

- A regra só funciona se a série mudar apenas ao salvar (fechar, "Guardar rascunho", "Publicar", "Salvar"), como no protótipo.
- O prazo de 7 dias cobre um compositor aberto por dias antes de salvar. Mesmo assim, salvar deve recusar uma foto que não existe mais e devolver quais sumiram.
- **Inferência**: o custo de esperar 7 dias é desprezível; uma HEIC de 48 MP ocupa alguns MB.

"Excluir" apaga na hora (seção 7), e a varredura é só a rede de segurança.

### A tarefa

| Item | Proposta |
|---|---|
| Onde | tarefa agendada do Coolify no contêiner da API |
| Comando | `python -m <pacote>.jobs.sweep_orphan_photos`, segundo entry-point da API (posição 22) |
| Frequência | `0 4 * * *`: todo dia às 4h, no fuso do servidor; conferir se o servidor está em `America/Sao_Paulo` |
| Tempo limite | 300 s, o padrão |
| Avisos | a notificação de falha do Coolify basta |

O que ela faz, em ordem:

1. **Retoma o que ficou no meio.**
   - Fotos em `deleting` (uma exclusão que falhou no meio): apaga de novo os objetos e o registro.
   - Fotos em `received`, ou em `processing` com a reserva vencida: converte de novo (seção 7).
2. **Confere envios sem `complete`.** Para cada foto em `awaiting_upload` com mais de 24 h, faz um `HeadObject`. Se o original estiver lá, marca `received` e converte. Se não estiver e a foto estiver numa série, não mexe. Se não estiver e a foto estiver solta, apaga o registro.
3. **Apaga as órfãs.** Para cada foto que nenhuma série salva referencia e que foi criada há mais de 7 dias: CAS para `deleting`, `DeleteObject` do original e das duas cópias, e por fim apaga o registro.
4. **Uma vez por semana, aos domingos, confere os depósitos contra o banco.** Lista as chaves de `originals/` e `copies/` e apaga as que não têm registro e têm mais de 1 dia. É isso que pega o PUT atrasado de uma URL ainda válida.

Custo no R2, para ~1.000 fotos (a estimativa de 10 GB do `#ff-bastidor`):

| Operação | Classe | Por execução | Por mês |
|---|---|---|---|
| `DeleteObject` (3 por foto órfã) | grátis | algumas | — |
| `HeadObject` (envio sem `complete`) | B | poucas | < 100 |
| `ListObjectsV2` (1 por 1.000 chaves; 1.000 originais e 2.000 cópias) | A | 3 | ~13, semanal |
| Total | | | ~13 classe A e < 100 classe B: menos de 0,01% do plano gratuito, ou seja, US$ 0 |

Para comparar, cada foto enviada custa ~3 classe A (o PUT do original e os dois PUTs de cópia) e ~2 classe B (`HeadObject` e `GetObject` do original). Cada vez que o compositor mostra uma cópia por URL assinada, soma 1 classe B.

**Alternativa descartada**: uma regra de ciclo de vida num prefixo de entrada (`incoming/`), copiando para o lugar definitivo ao confirmar. Ela apaga sem depender da tarefa, mas cobra um `CopyObject` (classe A) por foto e duplica o espaço enquanto a cópia não sai. E não resolve as fotos removidas de uma série, que já estariam no lugar definitivo.

---

## 7. Como isso cabe na régua

Fontes: `panlabs-python-standards`, `SKILL.md` (posições 1–44) e as referências `02-composicao-e-forma.md` (§1–§20) e `03-topologia-e-kernel.md` (§1–§10). O espécime é o LUC, em `apps/api/src/luc_api/finance/adapters/r2_attachment_store.py` e no fluxo de confirmação de `whatsapp/application/respond_to_proposal.py`, lidos localmente.

### Onde mora (posições 13, 14, 16, 17, 19, 20 e 22)

```
<pacote>/
  settings.py                 # credenciais e nomes dos depósitos, lidos no boot (posição 12)
  composition.py              # provide_photo_repository, provide_original_store, provide_copy_store,
                              # provide_image_processor, provide_clock (posição 7)
  main.py                     # entry-point ASGI
  jobs/
    sweep_orphan_photos.py    # entry-point da tarefa do Coolify (03 §10)
  http/                       # problem+json, token interno, health (03 §4)
  publishing/                 # contexto (posição 13)
    domain/
      photo.py                # Photo, PhotoState, PhotoFacts, RejectionCode
      copy_sizes.py           # copy_sizes(), check_photo_limits(): regras puras
    application/
      ports/                  # (posições 6 e 14)
        photo_repository.py
        original_store.py
        copy_store.py
        image_processor.py
      use_cases/
        request_upload.py
        confirm_upload.py
        process_photo.py
        sweep_orphan_photos.py
    adapters/
      http.py                 # rotas de /photos (posição 16)
      tables.py               # photos (posição 19)
      postgres_photo_repository.py
      r2_original_store.py
      r2_copy_store.py
      pillow_image_processor.py
  shared/
    application/clock.py      # Clock + SystemClock (posição 17)
    adapters/db/              # engine e metadata vazio
migrations/                   # na raiz, um head (posição 20)
```

- As três camadas valem pela posição 15. Existe núcleo que se testa sem infra: tamanhos das cópias, limites, transições de estado e a regra de órfã. E a fronteira fica a cargo do import-linter, que a régua manda instalar antes da forma (03, "Ordem de adoção").
- A publicação, a série e o rascunho moram no mesmo contexto `publishing`. Os tipos ficam nos nomes do GLOSSARY: `Publication`, `Series`, `Draft`, `Framing`.

### Ports (posições 1, 5, 6 e 10)

| Port | Métodos | Síncrono ou assíncrono | Adapter real |
|---|---|---|---|
| `PhotoRepository` | `add`, `mark_received`, `claim_for_processing`, `mark_ready`, `mark_rejected`, `release_claim`, `claim_for_deletion`, `delete`, `list_orphans`, `list_stale` | assíncrono (banco) | `PostgresPhotoRepository` |
| `OriginalStore` | `sign_upload` · `stat`, `read`, `delete`, `list_keys` | `sign_upload` **síncrono**, porque "no communication with R2"; o resto assíncrono, com boto3 em `to_thread` | `R2OriginalStore` |
| `CopyStore` | `put`, `delete`, `sign_read`, `list_keys`; publicar e despublicar vêm da pesquisa de cópias | `sign_read` síncrono, o resto assíncrono | `R2CopyStore` |
| `ImageProcessor` | `inspect(original) -> PhotoFacts` · `render(original, sizes) -> RenderedCopies` | `inspect` síncrono (só lê o cabeçalho, sem I/O); `render` assíncrono, porque o adapter espera uma thread (`to_thread` atrás do semáforo) | `PillowImageProcessor` |
| `Clock` | `now()` | síncrono (posições 10 e 36) | `SystemClock`, no kernel |

- **Dois ports de objeto, um por papel** (posição 6), em vez de um `ObjectStore` genérico. Assim o checker impede que uma cópia vá ao depósito privado ou um original ao caminho público. É a fronteira do ADR 0004 como tipo, e não como cuidado de quem escreve.
- **`ImageProcessor.render` assíncrono não é "async de mentira"** (posição 10; 02 §10). A mentira é `async def` com chamada bloqueante dentro, e aqui o adapter faz `await asyncio.to_thread(...)`, a forma que a própria régua manda para lib bloqueante; o adapter de R2 do LUC faz o mesmo.
  - **Inferência**: a régua fala de I/O, e aqui a espera é por CPU numa thread. Entendo que o critério de 02 §10 ("Lib bloqueante vai no driver async de verdade ou em `asyncio.to_thread`") cobre o caso.
  - O vice seria `render` síncrono, com `to_thread` no use-case. Ele perde porque leva a decisão de infra para a camada de aplicação, e cada chamador teria de lembrar de não bloquear o laço.
- **A assinatura fica síncrona**, ao contrário do port do LUC (`async def upload_url`, sem I/O). A posição 10 manda declarar o que é verdade, e assinar é conta local.
- **A config não se lê no adapter**: o adapter do LUC lê o ambiente por conta própria (`_read_env`), que é o caso que a régua usa como contraexemplo da posição 12 (02 §18: "explode no primeiro upload"). Aqui `provide_original_store(settings)` passa conta, chaves, endpoint e depósito por parâmetro (02 §20).
- O limite global de pixels do Pillow, o filtro de aviso e o registro do plugin HEIF vão no `provide_image_processor`, um ponto só no boot. Os valores dos limites (50 MB, 64 MP, 3:1, 480 px) são regra de produto e moram no domínio, não no ambiente.

### Transação, concorrência e compensação (posição 9; 02 §5 a §8)

- **A transação mora no adapter, uma por método, sem Unit of Work.** Nenhum port recebe sessão. O fluxo cruza Postgres e R2, que é o caso em que, segundo a régua, o UoW "entregaria ilusão de atomicidade" (02 §5).
- **A concorrência se decide no banco**, por CAS.
  - `claim_for_processing` é um `UPDATE photos SET state='processing', lease_until=:t WHERE id=:id AND (state='received' OR (state='processing' AND lease_until < :now)) RETURNING ...`. Se não devolve nada, o port devolve `None` (02 §6). Dois `complete` ou duas consultas ao mesmo tempo não convertem duas vezes.
  - "Publicar" é um CAS que só passa se todas as fotos da série estiverem `ready`. É o lado do servidor do "Publicar espera todas".
- **`process_photo` segue claim → send → release** (02 §8: efeito caro primeiro, commit por último):
  1. *claim*: `claim_for_processing` com reserva de 2 min, pelo `Clock`;
  2. *send*: `read` do original; `inspect`; `check_photo_limits` (domínio puro); `copy_sizes`; `render`; dois `put` no `CopyStore`;
  3. *release*: `mark_ready(id, facts, keys)` como CAS de `processing` para `ready`. É o commit, e vem por último.
- **Desfazer.** Se algo falha depois do primeiro `put`, ou se o `mark_ready` devolve `None` porque a foto foi removida no meio, apagam-se as cópias gravadas, na ordem inversa e com cada passo best-effort, sem relançar (02 §8). Depois:
  - recusa (um limite, `unreadable`): `mark_rejected(id, code)` e `delete` do original, que não serve para nada;
  - falha passageira (o R2 fora): `release_claim` volta a foto a `received`, para a retomada.
- **Retomada.**
  - **Inferência**: o processo pode cair no meio, num deploy por exemplo.
  - Quem vê a reserva vencida retoma: a consulta `GET /photos/{id}`, o arranque da API e a tarefa diária. O CAS garante que só um consegue.
- **Excluir** segue o mesmo molde: claim (CAS para `deleting`) → send (`DeleteObject` das cópias e do original; a limpeza do cache vem da pesquisa de cópias) → release (apaga os registros).
  - Apagar no R2 não tem volta, e por isso vem antes do commit. Uma falha no meio deixa `deleting`, que a varredura termina.
  - **Inferência** pelo modelo do S3, que a docstring do adapter do LUC também registra: o `DeleteObject` de uma chave que não existe não falha, então repetir é seguro.
- **`request_upload` não tem compensação**: grava uma linha e assina localmente, uma operação de um store só (02 §8, "Excluir").
- A chave do objeto sai do id da foto (`originals/<photo_id>`, `copies/<photo_id>/large.webp`, `copies/<photo_id>/small.webp`). É única pela chave primária, sem leitura prévia (02 §7).

### Forma, erros e borda (posições 7, 8, 11, 24, 27 e 43)

- **Use-cases são funções de módulo, com os ports primeiro.** `process_photo` recebe cinco ports (repositório, originais, cópias, processador e relógio), aridade que pede `ProcessPhotoDeps` congelado (posição 8; 02 §4).
- **O núcleo usa `@dataclass(frozen=True)`, e o Pydantic fica só na borda** (posição 11). O pedido de envio passa por `UploadRequestRaw → validate_upload_request → UploadRequest`, com `FieldError(field, code)` (02 §13–§14).
- **O insucesso da conversão não é exceção HTTP.** Vira o estado `rejected` com um `RejectionCode`, que a consulta devolve.
  - Dentro do adapter, a recusa é a exceção nomeada `PhotoRejected(code)` (posição 24), traduzida uma vez no use-case.
  - O texto em português mora na web, que é quem fala com o Autor (posição 43; 02 §14).
- **A borda é uma só e é HTTP**, então o status sai acoplado ao erro (posição 27). O `complete` de uma foto que não chegou responde 409.

### Testes (posições 3, 4, 29 a 33 e 36)

- **Os fakes moram em `tests/publishing/fakes.py`**: `FakePhotoRepository`, `FakeOriginalStore`, `FakeCopyStore`, `FakeImageProcessor` e o relógio fixo, todos herdando o port (posições 1 e 4).
- **Os use-cases se testam com esses fakes**, incluindo cada caminho de desfazer (02 §8: "existe um teste que falha se o undo sumir").
- **Contract tests** (posições 3, 31 e 32):
  - `ImageProcessor` roda real e barato, sem infra. O mesmo teste de adapter confere que as cópias saem sem EXIF, XMP, ICC e GPS. A página de segurança do Pillow sugere ainda o exiftool no CI.
  - `OriginalStore` e `CopyStore` precisam de um S3 real fora do processo, chaveado por uma variável do projeto (posição 30). O MinIO, que a frota usava, foi arquivado; a documentação do R2 cita um endpoint S3 local para desenvolvimento ([Presigned URLs · Local development](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)). **Decisão pendente**: qual serviço roda no CI.
- **O tempo entra pelo `Clock`** (reserva, prazos da varredura), nunca por congelamento global (posição 36).

### Nomes novos propostos

Em inglês no código; os termos de domínio ainda não estão no GLOSSARY:

- Contexto e entry-point: `publishing`; `jobs/sweep_orphan_photos.py`.
- Ports: `PhotoRepository`, `OriginalStore`, `CopyStore`, `ImageProcessor`; `Clock` no kernel.
- Adapters: `PostgresPhotoRepository`, `R2OriginalStore`, `R2CopyStore`, `PillowImageProcessor`, `SystemClock`.
- Use-cases: `request_upload`, `confirm_upload`, `process_photo`, `sweep_orphan_photos`; e o bundle `ProcessPhotoDeps`.
- Domínio:
  - `Photo`, `PhotoFacts`, `CopySizes`, `copy_sizes`, `check_photo_limits`, `RenderedCopies`, `PhotoRejected`;
  - `PhotoState`, com os valores `awaiting_upload`, `received`, `processing`, `ready`, `rejected` e `deleting`;
  - `RejectionCode`, com os valores `unsupported_format`, `file_too_large`, `too_many_pixels`, `aspect_ratio_out_of_range`, `too_small` e `unreadable`.
- Chaves: `originals/<photo_id>`, `copies/<photo_id>/large.webp`, `copies/<photo_id>/small.webp`.
- Rotas: `POST /photos`, `POST /photos/{photo_id}/upload-url`, `POST /photos/{photo_id}/complete`, `GET /photos/{photo_id}`.
- Candidatos ao GLOSSARY: Foto (`Photo`), Original (`Original`) e Cópia (`Copy`).

---

## 8. Como as medidas foram feitas

- **Versões**: venv descartável com Python 3.12.3, Pillow 13.0.0, pillow-heif 1.8.1 (libheif 1.23.6, libde265 1.1.3, x265 4.3) e boto3/botocore 1.44.3, instalados com `pip --no-cache-dir`. O navegador foi o Chromium headless do Playwright, Chrome for Testing 153.0.8010.12.
- **Máquina**: WSL2 num Intel i7-12700H, que não é a VPS. Os tempos servem para comparar caminhos entre si, não para prometer prazo na VPS.
- **Amostras sintéticas**, todas com EXIF de orientação 6, aparelho, data e GPS, XMP com GPS e perfil Display P3:
  - HEIC de 48 MP com 23,1 MB (q80) e com 1,1 MB (q45), e HEIC de 24 MP com 11,6 MB, em ladrilhos de 512 px;
  - JPEG de 48 MP com 9,4 MB e de 12 MP com 2,4 MB, ambos q90.

  O conteúdo é ruído sobre gradiente, que comprime pior que foto de verdade e infla os tamanhos de arquivo e de cópia.
- **Memória**: o pico é o `ru_maxrss` de um processo novo por caso; o RSS corrente vem de `/proc/self/status`.
- **GIL**: a maior pausa da thread principal, que acorda a cada 5 ms enquanto outra thread trabalha.
- **URL assinada**: gerada offline, com credenciais fictícias, só para ler os parâmetros. Nenhum pedido foi feito ao R2.
- Os scripts e as amostras ficaram fora do repositório, no espaço de rascunho da sessão.

---

## Recomendação para a spec

1. **Caminho do envio.**
   - **Recomendação**: PUT por URL assinada, direto ao depósito privado. A URL é pedida à API através da web e vale 15 min, com `Content-Type` e `Content-Length` assinados e SigV4. O progresso vem de `xhr.upload`; depois, `complete` com `HeadObject`, resposta 202 e consulta até `ready` ou `rejected`. O CORS do depósito libera só PUT, a partir da origem do hub.
   - **Impacto**: o envio sai do proxy (sem 100 MB, sem 524) e da banda da VPS, no molde do LUC. Em troca, entram uma política de CORS, duas rotas a mais e a dependência da varredura para o `complete` perdido.
2. **Conversão.**
   - **Recomendação**: `pillow-heif==1.8.1` com `pillow>=13.0.0`. Abrir com lista fechada de formatos; `draft` no JPEG; LANCZOS com `reducing_gap=3.0`; orientação e sRGB nas cópias; `info` limpo e metadados vazios passados de forma explícita, com teste; WebP `quality=80, method=4`.
   - **Impacto**: HEIC sem pacote do sistema, em x86_64 e arm64. A wheel é GPLv2 por causa do x265, o que só pesa se a imagem Docker for pública. JPEG de 48 MP sai em ~0,7 s com 93 MB.
3. **Onde roda.**
   - **Recomendação**: na API, numa thread (`asyncio.to_thread` no adapter), com semáforo de 1, `decode_threads=2`, `MALLOC_MMAP_THRESHOLD_=131072` e 1 GB de limite no contêiner. A durabilidade fica no estado da foto com reserva e retomada. Processo filho só se houver queda ou uma segunda fonte de envio.
   - **Impacto**: ~430 MB de pico por HEIC de 48 MP, de volta a ~30 MB depois (medido), sem travar o laço de eventos (medido). Uma série de 6 HEIC de 48 MP fica pronta em ~15 a 60 s na VPS (estimativa).
4. **Limites.**
   - **Recomendação**: 50 MB por arquivo; 64 MP (`MAX_IMAGE_PIXELS` e o aviso como erro); JPG, PNG, HEIC e WebP pelo conteúdo; proporção até 3:1; pelo menos 480 px no lado menor. Os códigos e os textos são os da tabela da seção 4.
   - **Impacto**: os modos de 108 e 200 MP e os panoramas longos ficam de fora, com mensagem na própria foto, e o pico de memória fica abaixo de ~610 MB.
5. **HEIC no navegador.**
   - **Recomendação**: prévia local quando o navegador abre o arquivo (Safari 17+, JPG, PNG, WebP). Quando não abre, o quadro espera a cópia grande do servidor, já orientada, e as ferramentas aparecem sobre ela. O `[x, y, z]` relativo vale igual para o original e as cópias.
   - **Impacto**: no Chrome e no Firefox, enquadrar uma HEIC espera alguns segundos de conversão, o que o protótipo já admite ("só com a foto pronta"). Não entra decodificador no aparelho.
6. **Fotos órfãs.**
   - **Recomendação**: tarefa diária do Coolify às 4h, `python -m <pacote>.jobs.sweep_orphan_photos`, com 300 s de limite. Ela retoma `deleting` e conversões vencidas, confere com `HeadObject` os envios sem `complete` com mais de 24 h e apaga as fotos que nenhuma série salva referencia, criadas há mais de 7 dias. Uma vez por semana, apaga chaves sem registro com mais de 1 dia.
   - **Impacto**: custo zero (~13 classe A e < 100 classe B por mês; `DeleteObject` é grátis). A regra exige que a série só mude ao salvar, e que salvar recuse foto que já sumiu.
7. **Régua.**
   - **Recomendação**: contexto `publishing` com os ports `PhotoRepository`, `OriginalStore`, `CopyStore` e `ImageProcessor`, e `Clock` no kernel. Assinatura e `inspect` síncronos; rede e `render` assíncronos. Transação por método, com CAS. `process_photo` e "Excluir" em claim → send → release, com desfazer das cópias. `jobs/` como segundo entry-point. Config passada por parâmetro, sem copiar o `_read_env` do LUC.
   - **Impacto**: cabe nas posições 1, 5 a 17, 19, 20, 22, 24, 27, 36 e 43 sem exceção. Fica pendente o S3 real do contract test (posições 3 e 30–32), porque o MinIO foi arquivado.
