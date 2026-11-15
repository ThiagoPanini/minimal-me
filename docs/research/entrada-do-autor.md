# Entrada do Autor

Pesquisa do ticket [#37](https://github.com/ThiagoPanini/minimal-me/issues/37), parte do mapa do Marco 2 (Frames & Fables). Consultei a documentação e o código publicado no npm do better-auth 1.7.25 e do `@better-auth/passkey` 1.7.25, o guia de passkeys do SimpleWebAuthn, a documentação do Next.js 16, as regras de rate limiting da Cloudflare, a documentação e a página de preços do Resend, a documentação do PyJWT 2.15.1 e o código do FastAPI (com um experimento na 0.139.0 e na 0.163.0), contra a régua `panlabs-python-standards`.

## Retomada

- **Estado**: completo.
- **Coberto**: seções 1–9, os nomes novos (seção 10) e a recomendação para a spec.
- **Pendente**: nada que bloqueie a spec. Ficam para a execução: conferir no painel quais operadores a regra de rate limiting aceita no plano Free (a documentação lista só os campos); criar o banco do better-auth no Postgres do Coolify e incluí-lo no backup; o caminho do endereço de entrada, que é decisão da spec.
- **Data**: 2026-11-14.

## Como ler

- Cada seção abre com as fontes, e cada fato traz a etiqueta da fonte entre colchetes. "Código" é o pacote baixado do npm, citado por arquivo e linha.
- **(inferência)** marca o que não vem de fonte: proposta, consequência deduzida ou número sugerido.
- `<domínio>` é o domínio próprio do Minimal Me e `<entrada>` é o caminho do endereço de entrada, ainda sem nome.
- A decisão 28 está fechada; esta pesquisa responde como fazer.

## 1. better-auth na web

Fontes:

- [índice] https://better-auth.com/llms.txt e https://better-auth.com/docs/llms.txt
- [npm] https://registry.npmjs.org/better-auth, https://registry.npmjs.org/@better-auth/passkey, https://registry.npmjs.org/auth/latest, https://registry.npmjs.org/@better-auth/cli/latest, https://registry.npmjs.org/-/package/@simplewebauthn/server/dist-tags, https://registry.npmjs.org/-/package/next/dist-tags
- [passkey] https://better-auth.com/docs/plugins/passkey
- [magic-link] https://better-auth.com/docs/plugins/magic-link
- [database] https://better-auth.com/docs/concepts/database
- [cli] https://better-auth.com/docs/concepts/cli
- [postgres] https://better-auth.com/docs/adapters/postgresql
- [options] https://better-auth.com/docs/reference/options
- [simplewebauthn] https://simplewebauthn.dev/docs/advanced/passkeys
- [#4] https://github.com/ThiagoPanini/minimal-me/issues/4 (inventário do LUC e irmãos)
- [código] https://registry.npmjs.org/better-auth/-/better-auth-1.7.25.tgz e https://registry.npmjs.org/@better-auth/passkey/-/passkey-1.7.25.tgz

### 1.1 Versões em 2026-11-14

- `better-auth` **1.7.25** é a `latest`, publicada em 2026-11-14 às 17:49 UTC. A linha 1.7 começou em 2026-08-18 e já soma 26 versões; a `beta` é 1.8.0-beta.9 e a `release-1.6` é 1.6.34 [npm]. O ethitorial usa 1.6.16, de 2026-06-10 [#4; data do npm].
- O índice da documentação diz "Use the documentation version that matches the Better Auth version installed in the project" e marca a v1.7 como "Latest" [índice].
- `@better-auth/passkey` **1.7.25**, publicada no mesmo minuto. Depende de `@simplewebauthn/server ^13.3.2` e `@simplewebauthn/browser ^13.3.0`; a `latest` do SimpleWebAuthn é 14.1.0 [npm].
- O `better-auth` 1.7.25 aceita como peer `next ^14 || ^15 || ^16` e `pg ^8`, e já traz `jose ^6.2.3` e `kysely` [npm]. A `latest` do Next é 16.4.6 [npm].
- O CLI agora é o pacote `auth` (1.7.25, "The CLI for Better Auth"), chamado como `npx auth@latest <comando>`. O `@better-auth/cli` parou na 1.4.21, marcado "Package no longer supported" [npm; cli].
- (inferência) Com uma versão a cada três ou quatro dias, pinar a versão exata dos dois pacotes, como o LUC pina o `next-auth`, e subir por PR com `npx auth upgrade`.

### 1.2 Plugin de passkey

- Instalação: `passkey()` de `@better-auth/passkey` nos `plugins` do servidor e `passkeyClient()` de `@better-auth/passkey/client` no cliente. O plugin "is powered by SimpleWebAuthn" [passkey].
- `registration.requireSession`: "Default: true. Set false for passkey-first onboarding" [passkey]. No código, com `requireSession`, os dois endpoints de registro (`/passkey/generate-register-options` e `/passkey/verify-registration`) passam por `sensitiveSessionMiddleware` e `freshSessionMiddleware`. A sessão precisa estar no banco e ter nascido há menos de `freshAge` (1 dia por padrão); fora disso, a resposta é 403 `SESSION_NOT_FRESH` [código: `passkey/dist/index.mjs` l.168–172 e 406–410; `better-auth/dist/api/routes/session.mjs` l.307–345].
- Padrões no código: `attestationType: "none"`, `residentKey: "preferred"`, `userVerification: "preferred"`, `excludeCredentials` com as chaves que a conta já tem, e o desafio num cookie assinado de 300 s. O `rpID` padrão é o hostname do `baseURL` [código: l.18, 250–275, 869].
- Sem sessão, as opções de entrada saem sem `allowCredentials`: o navegador oferece qualquer chave descobrível do site, e ninguém digita e-mail [código: l.350–365]. Para passkeys, o SimpleWebAuthn recomenda `residentKey: 'required'` no registro e `allowCredentials: []` no botão de entrar [simplewebauthn].
- Rotas: `POST /passkey/add-passkey` (`addPasskey`), `POST /sign-in/passkey` (`signIn.passkey`), `GET /passkey/list-user-passkeys`, `POST /passkey/delete-passkey` e `POST /passkey/update-passkey` [passkey]. Por baixo, o cliente chama `/passkey/generate-authenticate-options` e `/passkey/verify-authentication` [código: `passkey/dist/client.mjs` l.8 e 39].
- Tabela `passkey`: `name`, `publicKey`, `userId` (referência a `user.id`), `credentialID`, `counter`, `deviceType`, `backedUp`, `transports`, `createdAt` e `aaguid` [código: l.764–812].
- `origin` padrão: a origem do `baseURL`, mais uma origem listada exatamente em `trustedOrigins` [passkey].
- (inferência) Para o Minimal Me: `rpID` igual ao `<domínio>` (a web fica no apex, ADR 0001), `rpName: "Minimal Me"` e `authenticatorSelection: { residentKey: "required", userVerification: "required" }`. O `required` na verificação casa com a dica da tela "A digital ou o rosto, neste aparelho." e faz o servidor recusar resposta sem ela: o código só passa `requireUserVerification: true` nesse caso (l.444 e 577). O SimpleWebAuthn prefere `preferred` para não travar aparelho sem biometria; o Autor publica do celular, então o custo é baixo.

### 1.3 Plugin de magic link com `disableSignUp`

- Vem no pacote principal: `magicLink` de `better-auth/plugins` e `magicLinkClient` de `better-auth/client/plugins` [magic-link].
- Opções [magic-link]:
  - `sendMagicLink({ email, url, token, metadata }, ctx)`;
  - `expiresIn`: 300 s por padrão;
  - `disableSignUp`: "If set to `true`, the user will not be able to sign up using the magic link. The default value is `false`";
  - `rateLimit`: `{ window: 60, max: 5 }` para `/sign-in/magic-link` e `/magic-link/verify`;
  - `storeToken`: `"plain"` por padrão, ou `"hashed"`;
  - `allowedAttempts` ficou obsoleto: "Each verification call now consumes the token atomically on the first attempt".
- No código, `POST /sign-in/magic-link` não consulta se a conta existe. Gera um token de 32 letras, grava `magic-link:<token>` na tabela `verification` e **chama `sendMagicLink` para qualquer e-mail válido** [código: `dist/plugins/magic-link/index.mjs` l.87–115].
- O `disableSignUp` só age em `GET /magic-link/verify`: e-mail sem conta volta com `error=new_user_signup_disabled` [código: l.173–192].
- O `verify` passa por `originCheck` em `callbackURL`, `newUserCallbackURL` e `errorCallbackURL`, e grava o cookie de sessão no navegador que abriu o link [código: l.134–138 e 198–210].
- (inferência) Consequência: com a rota HTTP aberta, qualquer pessoa faz o servidor mandar e-mail do domínio para endereços arbitrários, gastando a cota do Resend e a reputação do domínio. Fecha-se em duas camadas:
  - `disabledPaths: ["/sign-in/magic-link"]`. O código só barra a rota HTTP (`dist/api/index.mjs` l.169–171), então `auth.api.signInMagicLink` continua funcionando no servidor;
  - um `sendMagicLink` que só envia quando o destino é o e-mail do Autor.

### 1.4 Banco próprio: como as tabelas nascem e quem é o dono do DDL

- Com Postgres, o adaptador embutido (Kysely) recebe um `Pool` do `pg`; `database.schemaName` escolhe um schema [postgres].
- `npx auth@latest migrate` aplica o schema direto no banco, e só "if you're using the built-in Kysely adapter". `npx auth@latest generate` gera o schema do Prisma ou do Drizzle ou, com Kysely, "an SQL file you can run directly" (`schema.sql`). Em CI, `--yes` dispensa a confirmação [cli].
- Migração programática: `getMigrations(auth.options)`, de `better-auth/db/migration`, devolve `toBeCreated`, `toBeAdded` e `runMigrations()`. Também só com o Kysely embutido [database].
- `npx auth@latest check schema` confere se o schema "can hold what Better Auth writes", lendo o banco vivo quando o adaptador é Kysely [cli]. Em execução, o better-auth confere as tabelas no primeiro uso e falha com erro explicativo; a chave é `advanced.database.validateSchema` [database].
- Tabelas: `user`, `session`, `account` e `verification` no núcleo, mais `passkey`. A `rateLimit` só existe com `rateLimit.storage: "database"`, e a `jwks` só com o plugin JWT [database; passkey; seção 6; seção 5].
- Régua, posição 20: "Dono do DDL é único e declarado [...] Código de migração sem chamador é proibido: ou liga no arranque, guardado por lock, ou apaga".
- Na frota: no LUC, o Drizzle da web é o dono do DDL, roda pelo `migrate.mjs` no arranque com advisory lock, e o Alembic da API tem só um baseline que não faz nada; no ethitorial e no travelmanager, o Alembic da API é o dono [#4].
- (inferência) O dono: a aplicação web, pelo better-auth, é a dona única do DDL do banco de entrada, e a API nem abre conexão com ele. A API é a dona única do DDL do próprio banco, com Alembic, como no ethitorial e no travelmanager. Com bancos separados, some o baseline no-op que o LUC precisou.
- (inferência) Como as tabelas nascem:
  - um script `migrate-auth` roda no arranque do container da web, antes do `server.js`, e chama `getMigrations(...).runMigrations()` dentro de um `pg_advisory_lock`, como o `migrate.mjs` do LUC. O `getMigrations` vem no pacote de runtime, então a imagem standalone não precisa do CLI;
  - a CI roda `npx auth check schema` contra o Postgres de teste;
  - o `schema.sql` do `generate` não entra no repositório: seria código de migração sem chamador.

## 2. Primeiro aparelho

Fontes:

- [security] https://better-auth.com/docs/reference/security
- [hooks] https://better-auth.com/docs/concepts/hooks
- [admin] https://better-auth.com/docs/plugins/admin
- [cli], [passkey], [magic-link], [simplewebauthn] e [código], como na seção 1

### 2.1 Como nasce a conta única

- Com `disableSignUp: true`, o link não cria conta (seção 1.3). A conta precisa existir antes do primeiro link.
- O comando `create-admin` do CLI e o `createUser` do plugin admin exigem o plugin admin e uma senha (`password`, marcado "required") [cli; admin]. Não servem: trazem senha e papéis que a entrada não tem.
- Para criar a conta pelo servidor, há duas superfícies documentadas:
  - `auth.$context`, usado na página de segurança [security];
  - `ctx.context.internalAdapter`, com "`createUser`, `createSession`, `updateSession`...", que respeita os `databaseHooks` [hooks].
- É o mesmo `createUser` que o link usa quando o cadastro está aberto, com `emailVerified: true` [código: magic-link l.179–183]. Ele grava o e-mail em minúsculas [código: `dist/db/internal-adapter.mjs` l.159–165].
- (inferência) A semente `seed-author` é idempotente e roda no arranque da web, logo depois do `migrate-auth`:
  - lê `AUTHOR_EMAIL` do ambiente, como segredo no Coolify e nunca no repositório. Sem ela, a web não sobe;
  - sem nenhuma conta: cria `{ email, name: "Autor", emailVerified: true }`;
  - com uma conta do mesmo e-mail: não faz nada;
  - com uma conta de outro e-mail, ou mais de uma conta: não mexe em nada e registra o erro. A entrada fica fechada até o comando da seção 3.2 resolver, e a página pública segue no ar.

```ts
// apps/web/scripts/seed-author.ts (esboço)
const ctx = await auth.$context;
const email = env.AUTHOR_EMAIL.toLowerCase();
const found = await ctx.internalAdapter.findUserByEmail(email);
if (!found) {
  await ctx.internalAdapter.createUser({ email, name: "Autor", emailVerified: true });
}
```

### 2.2 O primeiro acesso, passo a passo

1. O Autor abre o endereço de entrada e toca "Receber um link por e-mail". A tela não tem campo de texto (protótipo do MVP, versão Autor). Uma Server Action chama `auth.api.signInMagicLink({ body: { email: AUTHOR_EMAIL, callbackURL: "/<entrada>/novo-aparelho" }, headers: await headers() })`. A forma da chamada está em [magic-link]; usar o e-mail do servidor é inferência.
2. O `sendMagicLink` manda o e-mail pelo Resend (seção 8). O link vale 300 s e serve uma vez [magic-link].
3. O Autor abre o link **no aparelho em que vai criar a chave**. O `verify` grava o cookie de sessão no navegador que abriu o link e redireciona para o `callbackURL` [código: magic-link l.198–210]. (inferência) A confirmação na tela, depois do toque, diz isso.
4. A página de destino oferece a chave: `authClient.passkey.addPasskey({ name })`. A sessão acabou de nascer, então passa pelo `requireSession` e pela frescura de 1 dia [passkey; código].
5. Daí em diante, "Entrar com chave de acesso" chama `authClient.signIn.passkey()` por botão, sem autofill: o autofill pede um `input` com `autocomplete="... webauthn"`, e a tela não tem campo [passkey].

- O SimpleWebAuthn descreve esse mesmo arranjo: o link por e-mail "can perform double duty", porque prova o contato e abre o registro da chave [simplewebauthn].
- Registrar de novo num aparelho que já tem a chave esbarra no próprio autenticador, porque o plugin manda `excludeCredentials` [código: passkey l.258–261].
- Nome da chave: sem `name`, fica vazio. Os aparelhos Apple mandam AAGUID zerado, que o `getAuthenticatorName` não resolve [passkey]. (inferência) A página sugere um nome a partir do navegador ("iPhone", "Mac"), útil para a revogação da seção 3.3.

### 2.3 Aparelho novo

- O caminho é o do primeiro acesso: link aberto no aparelho novo, sessão nova, chave nova. Nada muda no servidor (inferência a partir de 2.2).

### 2.4 Risco do link

- (inferência) Antivírus de e-mail corporativo às vezes abre os links antes da pessoa e gasta o token de uso único, porque o `verify` é um GET que consome o token na primeira chamada [magic-link; código]. Em e-mail pessoal o risco é baixo. Se acontecer, o link passa a apontar para uma página da web com um botão que chama o `verify`.

## 3. Recuperação

Fontes: [passkey], [magic-link], [hooks], [simplewebauthn] e [código], como nas seções 1 e 2; [session] https://better-auth.com/docs/concepts/session-management

### 3.1 Perder todas as chaves

- O link por e-mail resolve: é o caminho do aparelho novo (2.3), e pedir o link não exige chave.

### 3.2 Perder também o e-mail: recuperação manual no servidor

Proposta (inferência): um comando `recover-author`, rodado no terminal do container da web pelo Coolify. Ter acesso ao Coolify é a prova de posse. As opções:

- `--email <novo>`: troca o e-mail da conta única pelo `internalAdapter.updateUser` (a mesma família de [hooks]) com `emailVerified: true`. O Autor atualiza `AUTHOR_EMAIL` no Coolify.
- `--revoke-sessions`: apaga todas as sessões da conta, como o `revokeSessions` [session].
- `--revoke-passkeys`: apaga todas as chaves. Serve quando a conta da nuvem que sincroniza as chaves também caiu.
- `--link`: imprime no terminal um link de entrada de 5 minutos. O comando monta a instância do better-auth com a mesma configuração e um `sendMagicLink` que escreve no terminal em vez de chamar o Resend, e então chama `auth.api.signInMagicLink`, a API pública do plugin [magic-link].

Depois, o Autor abre o link no aparelho novo e cria a chave (2.2, passos 3 a 5). O impacto: nenhuma tela nova, e a recuperação depende do Coolify, que o Autor já administra.

(inferência) O comando não grava a linha de `verification` direto: o formato do identificador mudou na 1.7 ("purpose-prefixed verification identifiers") [magic-link], e a API pública absorve essas mudanças.

### 3.3 Revogar a chave de um aparelho perdido

- O plugin lista, renomeia e apaga chaves: `listUserPasskeys` (`auth.api.listPasskeys` no servidor), `updatePasskey` e `deletePasskey`. As três exigem sessão, e as duas últimas conferem que a chave é da conta [passkey; código: l.627–735].
- Apagar a chave não fecha sessão: o `deletePasskey` só remove a linha da tabela `passkey` [código]. Para fechar a sessão aberta no aparelho perdido há `revokeSession({ token })`, `revokeOtherSessions()` e `revokeSessions()` [session]. O `listSessions` exige sessão fresca [código: `session.mjs` l.350–353], e a tabela `session` guarda `ipAddress` e `userAgent` [session].
- Sem `cookieCache`, que é o padrão, a revogação vale na hora. Com ele, "revoked sessions may remain active on other devices until the cookie cache expires" [session].
- Uma chave sincronizada (`deviceType: multiDevice`, `backedUp: true`) vive em todos os aparelhos da mesma conta Apple ou Google [simplewebauthn; tabela `passkey`]. (inferência) Apagar o registro dela no servidor tira a entrada de todos esses aparelhos. Se o aparelho perdido está bloqueado, o urgente é fechar a sessão dele; a chave só sai se a conta da nuvem também estiver comprometida.
- (inferência) No MVP, o mesmo comando faz a revogação (`--revoke-sessions`, `--revoke-passkeys`). Uma tela "Aparelhos", com a lista e "Sair deste aparelho", fica como opção para a rodada do publicador no Claude Design.

## 4. Sessão

Fontes:

- [session] https://better-auth.com/docs/concepts/session-management
- [cookies] https://better-auth.com/docs/concepts/cookies
- [security] https://better-auth.com/docs/reference/security
- [options] https://better-auth.com/docs/reference/options
- [next-ba] https://better-auth.com/docs/integrations/next
- [fastapi] https://raw.githubusercontent.com/fastapi/fastapi/0.163.0/fastapi/routing.py
- [código], como na seção 1

### 4.1 Duração e renovação

- `expiresIn`: 7 dias (604800 s). `updateAge`: 1 dia, e "whenever the session is used and the `updateAge` is reached, the session expiration is updated to the current time plus the `expiresIn` value". `freshAge`: 1 dia. Há `disableSessionRefresh` e `deferSessionRefresh` para quem quiser mudar isso [session; options]. Os mesmos números estão no código [código: `dist/context/create-context.mjs` l.147–149].
- O `cookieCache` vem desligado (default `false`) [options].
- (inferência) Na prática, a sessão "fica aberta naquele aparelho" enquanto o Autor usar o site ao menos uma vez por semana. Depois de sete dias sem uso, ele entra de novo com um toque na chave.

### 4.2 Atributos do cookie

- Nome: `better-auth.session_token`, com o prefixo `__Secure-` quando o `baseURL` é `https` [cookies; código: `dist/cookies/index.mjs` l.23 e 32].
- Atributos: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` e `Max-Age` igual ao `expiresIn`. Não tem `Domain`, então vale só para o host, a menos que se ligue `crossSubDomainCookies`. O valor é assinado com o segredo [código: l.32–37, 49 e 170–178].
- A documentação diz o mesmo: "All cookies are `httpOnly` and `secure` when the server is running in production mode" [cookies] e "Session cookies use the `SameSite=Lax` attribute by default" [security].
- O segredo vem de `BETTER_AUTH_SECRET`: "In production, if it's not set, it will throw an error". O `baseURL` deve ser explícito, por `BETTER_AUTH_URL`: "Relying on request inference is not recommended" [options].

### 4.3 Envio em curso quando a sessão vence

Fatos:

- A web confere a sessão no começo de cada pedido, com `auth.api.getSession({ headers })` [next-ba].
- Quando a rota declara parâmetro de corpo (`UploadFile`, `Form`, modelo), o FastAPI lê o corpo inteiro antes de resolver as dependências: `await request.form()` vem antes de `solve_dependencies` [fastapi: l.450–520].
- Experimento desta pesquisa, no FastAPI 0.139.0 (a versão do LUC) e no 0.163.0, com CPython 3.12. Com `UploadFile`, a dependência roda depois de o corpo de 1 MB ter sido lido. Numa rota sem parâmetro de corpo, que lê `request.stream()`, a dependência roda antes. O núcleo do teste:

```python
async def check_token(request: Request) -> None:
    observed["form_parsed_before_dependency"] = getattr(request, "_form", None) is not None

@app.post("/upload", dependencies=[Depends(check_token)])
async def upload(file: UploadFile = File(...)) -> dict[str, int]: ...
# 0.139.0 e 0.163.0: /upload -> True; /stream (sem parâmetro de corpo) -> False
```

Consequências e proposta (inferência):

- A sessão do better-auth dura dias e se renova com o uso. Ela só vence no meio de um envio numa aba parada há uma semana, ou quando o Autor revoga a sessão.
- O ponto frágil é o token interno de 60 s (seção 5). Se passar mais de 60 s entre a web cunhar o token e a API terminar de receber o corpo, o `exp` já venceu, e a API recusa depois de ter recebido tudo. Há duas saídas:
  - validar o token antes de ler o corpo, com uma rota de envio sem parâmetro de corpo que lê o stream, ou com a validação num middleware ASGI;
  - não passar o arquivo pela API (assunto da pesquisa [#36](https://github.com/ThiagoPanini/minimal-me/issues/36)).
- A resposta: `401` com `application/problem+json` e um `type` próprio de sessão vencida, que a web repassa ao navegador (régua, posições 25, 27 e 28, no lado da API). Nada é gravado, porque a recusa vem antes do caso de uso.
- O que o compositor preserva:
  - o que está na tela (palavras, data, enquadramento, ordem);
  - os arquivos ainda não enviados, que estão na memória da aba;
  - as fotos que já chegaram, guardadas no rascunho do servidor.
- O que o compositor faz: cobre a tela com "Entrar" (chave de acesso, sem sair da página) e, com a sessão de volta, refaz só o pedido recusado. Uma chave de idempotência por foto evita duplicar.
- Fechar a aba perde os arquivos ainda não enviados, porque não há cópia local; o rascunho do servidor fica.
- Texto sugerido: "A sessão terminou. Entre de novo para continuar; o que já foi enviado está no rascunho." Os textos finais saem das rodadas no Claude Design.

## 5. Token interno para a API em Python

Fontes:

- [jwt] https://better-auth.com/docs/plugins/jwt
- [pyjwt-usage] https://pyjwt.readthedocs.io/en/stable/usage.html
- [pyjwt-api] https://pyjwt.readthedocs.io/en/stable/api.html
- [pypi] https://pypi.org/pypi/PyJWT/json
- [régua] skill `panlabs-python-standards`: posições do `SKILL.md` e as referências `02-composicao-e-forma`, `03-topologia-e-kernel`, `04-modelo-de-erro`, `05-doutrina-de-testes` e `06-regua-de-maquina`
- [#4] https://github.com/ThiagoPanini/minimal-me/issues/4 (inventário do LUC e irmãos)
- [código], como na seção 1

### 5.1 O precedente

- No LUC, o BFF cunha um JWT interno HS256 com `iss luc-web`, `aud luc-api`, segredo `LUC_INTERNAL_JWT_SECRET` e cerca de 60 s de vida. "Python não decripta a sessão do Auth.js" é regra dos três irmãos [#4].

### 5.2 O plugin JWT do better-auth

- O próprio plugin avisa que "is not meant as a replacement for the session. It's meant to be used for services that require JWT tokens" [jwt].
- Chaves: par assimétrico, EdDSA/Ed25519 por padrão, com a chave privada cifrada em AES256-GCM numa tabela `jwks`. A rotação (`rotationInterval`, `gracePeriod`) é opcional [jwt].
- Verificação: pela JWKS em `/api/auth/jwks`, que "can be cached indefinitely"; quando chega um `kid` novo, busca-se de novo [jwt].
- Padrões do token: `iss` e `aud` iguais ao `BASE_URL`, validade de 15 min e `sub` com o id da conta. Além disso, "By default the entire user object is added to the JWT payload" [jwt].
- O token chega ao navegador por padrão, por `GET /token` e pelo cabeçalho `set-auth-jwt` em toda chamada a `getSession`. Para tirá-lo de lá: `disabledPaths: ["/token"]` e `disableSettingJwtHeader: true` [jwt; código: `dist/plugins/jwt/index.mjs` l.141–158 e 195–205].
- Para cunhar só no servidor, há `auth.api.signJWT({ body: { payload, overrideOptions } })`, declarado como `createAuthEndpoint.serverOnly` [código: l.160–173]. Ele não aparece na página do plugin.
- No Python, EdDSA exige o módulo `cryptography` no PyJWT [pyjwt-usage].

### 5.3 Segredo compartilhado (HS256)

- Para HS256, o PyJWT pede chave HMAC "at least as long as the hash output (32 [...] bytes)", conforme a RFC 7518, §3.2. Por padrão ele só avisa (`InsecureKeyLengthWarning`); com `enforce_minimum_key_length` ligado, recusa [pyjwt-usage].
- Sobre o algoritmo: "Do not compute the algorithms parameter based on the alg from the token itself [...] hard-code a fixed value", conforme a RFC 8725, §2.1 [pyjwt-api].
- (inferência) Na web, o `jose`, que já é dependência do better-auth, assina HS256: `new SignJWT({}).setProtectedHeader({ alg: "HS256" })` com `setIssuer`, `setAudience`, `setSubject`, `setIssuedAt` e `setExpirationTime("60s")`.

### 5.4 Comparação

| | HS256 com segredo compartilhado | Plugin JWT com JWKS |
|---|---|---|
| Precedente na frota | LUC [#4] | nenhum |
| O que a API guarda | o segredo, que também cunha token | só a chave pública |
| Banco | nada | tabela `jwks` no banco de entrada |
| Algoritmo | HS256 | EdDSA (exige `pyjwt[crypto]`) |
| Distribuição da chave | variável nos dois containers | a API busca a JWKS na web, ou guarda uma cópia fixa e perde a rotação |
| Navegador | não vê o token: ele nasce no servidor | `/token` e `set-auth-jwt` ligados por padrão, com o usuário inteiro (e-mail incluso) no payload |
| Validade | definida no código (60 s) | 15 min por padrão; ajustável |
| Rotação | troca manual nos dois e novo deploy | `rotationInterval` com `gracePeriod` |

(inferência) A recomendação é HS256, como no LUC:

- O que se ganha: nenhuma tabela, nenhuma chamada da API para a web, nada do token no navegador e o mesmo desenho que a frota já opera.
- O que se aceita: a API guarda um segredo que também cunharia token. Como a API é a única consumidora e é o próprio recurso protegido, quem roubar esse segredo já tem a API.
- O que reabre: um segundo serviço consumindo o token, a API ficar pública, ou a exigência de a API não guardar segredo.

### 5.5 O que a API valida

```python
claims = jwt.decode(
    token,
    key=secret,                        # Settings.internal_jwt_secret, >= 32 bytes
    algorithms=["HS256"],              # fixo, nunca lido do token
    audience="minimal-me-api",
    issuer="minimal-me-web",
    leeway=5,
    options={
        "require": ["exp", "iat", "iss", "aud", "sub"],
        "strict_aud": True,
        "enforce_minimum_key_length": True,
    },
)
```

- `exp`, `iat`, `jti`, `nbf` e `sub` "will only be verified if present", daí o `require` [pyjwt-api, aviso em `jwt.types.Options`].
- `verify_sub` confere que `sub` é string; passando `subject=`, confere também o valor [pyjwt-api].
- `strict_aud` exige um `aud` único e igual ao esperado [pyjwt-api].
- `leeway` dá folga ao `exp` [pyjwt-usage]. (inferência) Web e API rodam na mesma VPS, com o mesmo relógio: 5 s bastam.
- (inferência) `sub` é o id da conta no better-auth. A API não o compara com um valor fixo, porque só há uma conta e quem barra é a web, mas pode gravá-lo como autoria.
- (inferência) A web só cunha o token depois de conferir a sessão e conferir que o e-mail da sessão é o `AUTHOR_EMAIL`. É uma lista de um item, que nega quando a configuração falta, no molde do ADR-0004 do LUC [#4].
- (inferência) O payload leva só as cinco claims, sem e-mail nem nome.
- Nas rotas de envio, a validação vem antes da leitura do corpo (seção 4.3).
- A `latest` do PyJWT é 2.15.1, de 2026-09-28, para Python 3.9 ou mais novo [pypi].

### 5.6 Onde isso mora na régua

Os números são as posições do `SKILL.md` de `panlabs-python-standards`.

- **Contexto `identity`** no primeiro nível (13), com o port em `application/ports/` (6). A borda HTTP de cada contexto mora nele (16), e a referência de topologia guarda no pacote HTTP central só o transversal, inclusive as "dependências compartilhadas (identidade, token interno)". É lá que fica a dependência `current_author`: ela lê o `Authorization: Bearer` e chama a camada `application` do `identity`, porque a borda só alcança um contexto pela `application` (40).
- **Port**: `InternalTokenVerifier` é um `Protocol`, e o adapter `PyJwtInternalTokenVerifier` herda dele (1). É síncrono, porque conferir HS256 não faz I/O (10). A exceção `InvalidInternalTokenError` mora no módulo do port (28).
- **Camadas**: as três só valem com lógica que mereça teste sem infraestrutura (15). O `identity` deve nascer sem `domain/`; o gatilho da própria posição diz que "Contexto novo que seja CRUD puro não ganha camadas".
- **`Settings` fail-closed** (12): `internal_jwt_secret` é obrigatório e lido uma vez, no boot. Se faltar, ou tiver menos de 32 bytes, o processo não sobe. É o cenário que a régua cita: "no espécime gateado, o segredo do JWT interno está no `Settings` e sua ausência derruba o boot". O `ruff` TID251 proíbe `os.environ` e `os.getenv` fora do módulo de settings (12; baseline da régua de máquina). A topologia põe esse módulo na raiz e o baseline, em `composition/settings.py`: escolher um e travar no TID251.
- **Composição** (7 e 22): `provide_internal_token_verifier(settings) -> InternalTokenVerifier`, tipado, no composition root. O adapter recebe o segredo como argumento.
- **Erro** (25, 27 e 28): a falha de autenticação entra no registro único e vira `401` em `problem+json` na borda. A referência de erro diz que "um `AuthenticationError` não deve herdar de `DomainError` (autenticação é protocolo de borda, não conceito de domínio), mas deve estar no registro". O `detail` sai em inglês, para quem consome a API, que é a web (43).
- **Tempo** (36): o PyJWT lê o relógio dentro do adapter, o único ponto com tempo real nesse fluxo. Nos testes de borda, "cunhar um token com `now` real [...] é legítimo".
- **Testes** (3, 4 e 31): se os casos de uso usarem `FakeInternalTokenVerifier`, em `tests/identity/fakes.py`, o contract test roda contra o fake e o real. O real não precisa de infraestrutura.
- A régua "não cobre segurança de borda": a escolha entre HS256 e JWKS fica fora dela, que só diz onde o código mora.

```
apps/api/src/<pacote>/
  settings.py            # internal_jwt_secret (obrigatório, >= 32 bytes)
  composition.py         # provide_internal_token_verifier
  http/dependencies.py   # current_author
  identity/
    application/ports/internal_token_verifier.py   # InternalTokenVerifier, InvalidInternalTokenError
    adapters/pyjwt_internal_token_verifier.py      # PyJwtInternalTokenVerifier
apps/api/tests/identity/
  fakes.py               # FakeInternalTokenVerifier
  contracts/             # a mesma suíte contra o fake e o real
```

## 6. Limites de tentativa

Fontes:

- [rate-limit] https://better-auth.com/docs/concepts/rate-limit
- [options] e [magic-link], como na seção 1
- [cf-rl] https://developers.cloudflare.com/waf/rate-limiting-rules/ (atualizada em 2026-08-25)
- [cf-params] https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/ (atualizada em 2026-11-04)
- [cf-how] https://developers.cloudflare.com/waf/rate-limiting-rules/request-rate/
- [cf-dash] https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/
- [cf-custom] https://developers.cloudflare.com/waf/custom-rules/
- [next-sa] https://nextjs.org/docs/app/guides/server-actions
- [#8] https://github.com/ThiagoPanini/minimal-me/issues/8 (Coolify e Cloudflare na frota)
- [código], como na seção 1

### 6.1 O rate limit embutido do better-auth

- Liga só em produção, com janela de 10 s e máximo de 100 pedidos [rate-limit; options; código: `create-context.mjs` l.170–175].
- Regras especiais no código [código: `dist/api/rate-limiter/index.mjs` l.306–319]:
  - `/sign-in*`, `/sign-up*`, `/change-password*` e `/change-email*`: 3 pedidos em 10 s;
  - recuperação de senha e envio de verificação: 3 pedidos em 60 s.
- A regra de um plugin vale por cima dessas: o magic link usa 5 pedidos em 60 s [magic-link; código].
- As rotas de chave (`/passkey/*`) não casam com nenhuma regra especial e ficam no padrão de 100 em 10 s [código].
- O contador é por IP e caminho, e o IPv6 é agrupado por /64 [rate-limit; código: l.237–250].
- O IP vem, por padrão, do `X-Forwarded-For`, que o cliente pode forjar. Atrás de um proxy que põe o IP num cabeçalho próprio, lista-se só esse cabeçalho; o exemplo da documentação é `ipAddressHeaders: ["cf-connecting-ip"]`, com o aviso "make sure that clients can reach your server only through it" [rate-limit].
- Onde guarda: em memória, por padrão. Há também `"database"` (tabela `rateLimit`), `"secondary-storage"` e `customStorage.consume`, que conta de forma atômica [rate-limit].
- Ao passar do limite, a resposta é `429` com `X-Retry-After` [rate-limit].
- "Server-side requests made using `auth.api` aren't affected by rate limiting" [rate-limit]. No código, o limitador roda no `onRequest` do roteador HTTP [código: `dist/api/index.mjs` l.168–176].

### 6.2 A regra de rate limiting da Cloudflare no plano Free

- No Free: uma regra por zona, contagem por IP, período de 10 s e bloqueio de 10 s, aplicado durante todo o período de bloqueio. A expressão só pode usar os campos Path e Verified Bot [cf-rl].
- Ações possíveis: `block`, desafios ou `log`. O bloqueio responde `429` por padrão; resposta personalizada só do Pro em diante [cf-params; cf-dash].
- Os contadores são por data center: "Counters are not shared across data centers" [cf-how]. A regra "not designed to allow a precise number of requests", e a contagem pode atrasar alguns segundos [cf-rl].
- Regras personalizadas de WAF: cinco no Free [cf-custom], como o ADR 0001 já registrou ("uma regra de rate limiting e cinco de WAF por zona").
- Uma Server Action "runs as a POST request against the page that invokes it" [next-sa]. Logo, a regra no caminho da entrada cobre a página e o pedido de link.

### 6.3 Proposta (inferência)

- **Cloudflare**, a única regra da zona:
  - expressão: `http.request.uri.path in {"/<entrada>" "/api/auth/passkey/generate-authenticate-options" "/api/auth/passkey/verify-authentication" "/api/auth/magic-link/verify"}`;
  - por IP, 10 pedidos em 10 s, com bloqueio de 10 s;
  - ela só amortece rajadas; o teto por hora mora na aplicação;
  - falta conferir no painel se o Free aceita o operador `in` no campo Path, porque a documentação lista campos e não operadores.
- **better-auth**:
  - `ipAddressHeaders: ["cf-connecting-ip"]`, válido porque a origem só aceita IPs da Cloudflare, como na frota [#8];
  - `customRules: { "/passkey/*": { window: 60, max: 10 } }`;
  - manter os 5 pedidos em 60 s do magic link, que agora só valem para o `verify`;
  - guardar em memória: há um container só, e o contador zera a cada deploy.
- **Pedido de link**, que passa por `auth.api` e por isso escapa do limitador embutido:
  - por IP (`cf-connecting-ip`), um pedido a cada 60 s e três por hora;
  - no total, dez por dia, longe dos 100 por dia do Resend;
  - contado em memória, no processo da web;
  - quem passa do limite vê a mesma mensagem neutra.
- **Impacto**: ninguém esgota a cota do Resend nem enche a caixa do Autor. No pior caso, um ataque trava o registro de aparelho novo por algumas horas; as chaves já registradas continuam entrando, e o comando da seção 3.2 fica de pé.

## 7. CSRF

Fontes:

- [security] https://better-auth.com/docs/reference/security
- [next-ds] https://nextjs.org/docs/app/guides/data-security (atualizada em 2026-10-06)
- [next-sa-config] https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions (atualizada em 2026-08-26)
- [next-blog] https://nextjs.org/blog/security-nextjs-server-components-actions
- [#8] https://github.com/ThiagoPanini/minimal-me/issues/8 (Coolify e Cloudflare na frota)
- [#10] https://github.com/ThiagoPanini/minimal-me/issues/10 (consolidação do inventário)

### 7.1 A proteção do better-auth

- As camadas [security]:
  - preferir pedidos não simples, como `application/json`;
  - validar o `Origin` contra `trustedOrigins`, que por padrão tem só o `baseURL`;
  - cookies `SameSite=Lax`;
  - Fetch Metadata no primeiro login;
  - GET sem efeito colateral, salvo callbacks com `state` e `nonce`.
- O item 6 da página: "These checks run only for requests that reach `auth.handler`. A direct `auth.api` call skips them, even when you pass the browser's headers". A chamada direta também pula a checagem de `callbackURL`. A página traz o teste para rotas próprias, com `(await auth.$context).isTrustedOrigin(origin)` [security].
- `disableCSRFCheck` e `disableOriginCheck` desligam essas proteções e ficam fora [security].
- "Do not leave the localhost origin in a trusted origins list of a production auth instance" [security].

### 7.2 Server Actions

- Só aceitam POST. O Next compara o `Origin` com o `Host` (ou com o `X-Forwarded-Host`) e aborta quando diferem [next-ds]. Um pedido sem `Origin` "is allowed through with a warning rather than rejected" [next-sa-config].
- `serverActions.allowedOrigins` só faz falta quando o proxy repassa outro host: "Behind a reverse proxy, no entry is needed as long as the proxy forwards the public host in `x-forwarded-host`" [next-sa-config].
- Toda ação exportada é alcançável por POST direto, então é preciso "verify authentication and authorization inside each one" [next-ds].
- O corpo de uma Server Action tem 1 MB por padrão (`bodySizeLimit`) [next-sa-config]. (inferência) O envio de foto não passa por Server Action.

### 7.3 Route handlers

- "When Custom Route Handlers (`route.tsx`) are used instead, extra auditing can be necessary since CSRF protection has to be done manually there" [next-blog].
- (inferência) Todo route handler da web que muda estado e chama a API (envio, rascunho, publicar), nesta ordem:
  1. aceita só POST, PUT ou DELETE;
  2. confere a sessão;
  3. confere o `Origin` com o `isTrustedOrigin` da seção 7.1;
  4. só então cunha o token interno.
- O `SameSite=Lax` já impede que o cookie vá num POST vindo de outro site; o `Origin` fecha o caso de um subdomínio irmão.

### 7.4 A API interna

- A API fica na rede interna do Coolify, sem rota pública, e o `api.<domínio>` do ADR 0001 fica sem uso (decisão 8). O ethitorial e o travelmanager já deixam a API interna, com só a web pública [#10], e o travelmanager registra que "A API nunca é pública" [#8].
- (inferência) Como nenhum navegador chega à API, CSRF não se aplica a ela: a credencial é o token interno, não um cookie. Fora o `/health`, a API não responde nada sem token.

## 8. E-mail do link pelo Resend

Fontes:

- [resend-node] https://resend.com/docs/send-with-nodejs
- [resend-domains] https://resend.com/docs/dashboard/domains/introduction
- [resend-cloudflare] https://resend.com/docs/knowledge-base/cloudflare
- [resend-dmarc] https://resend.com/docs/dashboard/domains/dmarc
- [resend-tracking] https://resend.com/docs/dashboard/domains/tracking
- [resend-quotas] https://resend.com/docs/knowledge-base/account-quotas-and-limits
- [resend-pricing] https://resend.com/pricing (lida em 2026-11-14)
- [npm] https://registry.npmjs.org/resend/latest
- [código], como na seção 1

### 8.1 SDK

- `resend` 6.38.1 é a `latest` e pede Node 20 ou mais novo [npm].
- Uso: `new Resend(process.env.RESEND_API_KEY)` e `const { data, error } = await resend.emails.send({ from, to, subject, html, text })`. O `text` é "Auto-generated from html if omitted", e o `idempotencyKey` vale 24 h, com até 256 caracteres [resend-node].
- O limite da API é de 10 pedidos por segundo por time; acima disso, `429` [resend-node; resend-quotas].
- O better-auth espera o `sendMagicLink` terminar (`await`) [código: magic-link l.108]. (inferência) O `sendMagicLink` lança erro quando o `error` vem preenchido, e a Server Action mostra "Não deu para enviar o link agora. Tente de novo em alguns minutos."

### 8.2 Domínio de envio e registros DNS na Cloudflare

- O Resend recomenda enviar de um subdomínio "to isolate your sending reputation", e dá `auth.example.com` como exemplo para e-mail transacional [resend-domains].
- Configuração automática: o botão "Sign in to Cloudflare" usa o Domain Connect e cria os registros [resend-cloudflare].
- Configuração manual [resend-cloudflare]:

| Tipo | Nome | Conteúdo | Observação |
|---|---|---|---|
| MX | `send` | `feedback-smtp.<região>.amazonses.com` | prioridade 10 |
| TXT (SPF) | `send` | `"v=spf1 include:amazonses.com ~all"` | |
| TXT (DKIM) | `resend._domainkey` | `p=...`, copiado do Resend | DNS only |

- Num subdomínio de envio, os nomes ganham o sufixo: `send.<sub>` e `resend._domainkey.<sub>` [resend-cloudflare].
- DMARC: um TXT em `_dmarc`, começando por `v=DMARC1; p=none; rua=mailto:...` e endurecendo depois [resend-dmarc].
- O rastreamento de abertura e clique é "disabled by default for all domains" [resend-tracking]. (inferência) Fica desligado: com o clique ligado, o link com o token passaria pelo domínio de rastreamento.
- (inferência) Proposta: enviar de `auth.<domínio>`, com o remetente `Minimal Me <entrar@auth.<domínio>>`.

### 8.3 Camada gratuita

- Página de preços, lida em 2026-11-14 [resend-pricing]:
  - US$ 0 por mês;
  - 3.000 e-mails por mês, no máximo 100 por dia;
  - 3 domínios e 3 caixas de entrada;
  - 10.000 automation runs;
  - retenção de 30 dias;
  - suporte por ticket e um endpoint de webhook;
  - autenticação DKIM, SPF e DMARC.
- Detalhes das cotas [resend-quotas]:
  - a cota diária conta o dia UTC, e e-mails recebidos também contam;
  - com a cota esgotada, a API responde `429` com `daily_quota_exceeded` ou `monthly_quota_exceeded`, e o e-mail não entra em fila;
  - a taxa de rejeição precisa ficar abaixo de 4% e a de spam, abaixo de 0,08%.
- (inferência) O Minimal Me manda poucos links por mês, e a cota sobra.

### 8.4 O que o e-mail diz (proposta, em português)

- **Assunto**: Seu link para entrar no Minimal Me
- **Prévia**: Vale por 5 minutos, no aparelho em que você abrir.
- **Corpo**:

> **Entrar no Minimal Me**
>
> Você pediu um link para entrar no Minimal Me. Abra-o no aparelho em que vai publicar: é nele que a chave de acesso vai ficar.
>
> [Entrar no Minimal Me]
>
> O link vale por 5 minutos e funciona uma vez só.
>
> Se não foi você, ignore este e-mail. Sem o link, ninguém entra.

- **Versão em texto**: os mesmos parágrafos, com o URL inteiro no lugar do botão.
- (inferência) O e-mail não traz o endereço do Autor, IP nem localização, e não tem rastreamento. Os textos finais saem das rodadas no Claude Design.

## 9. `noindex` e o endereço sem link

Fontes:

- [next-metadata] https://nextjs.org/docs/app/api-reference/functions/generate-metadata (atualizada em 2026-11-06)
- [next-headers] https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- [next-robots] https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- [google] https://developers.google.com/search/docs/crawling-indexing/block-indexing (atualizada em 2025-12-10)

- `metadata.robots`, com `index`, `follow`, `nocache` e `googleBot`, gera a tag `<meta name="robots">` [next-metadata].
- Campos aninhados, como `robots`, "are **overwritten** by the last segment to define them" [next-metadata]. O segmento da entrada pode, então, declarar o próprio `robots`.
- `headers()`, no `next.config`, põe cabeçalhos por caminho [next-headers]. O `robots.txt` é um arquivo em `app/` [next-robots].
- O Google aceita o `noindex` por `<meta>` ou pelo cabeçalho `X-Robots-Tag`. "For the noindex rule to be effective, the page or resource must not be blocked by a robots.txt file", e "Specifying the noindex rule in the robots.txt file is not supported by Google" [google].
- (inferência) Proposta:

```ts
// app/<entrada>/layout.tsx (esboço)
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};
```

- (inferência) O mesmo vale para a página de aparelho novo. Some-se o `X-Robots-Tag: noindex, nofollow` por `headers()` nesses caminhos. O caminho não entra no `robots.txt`, porque o bloqueio esconderia o `noindex` e o arquivo publicaria o caminho. Também não entra no sitemap, no 404 nem em link de página pública.
- O repositório é público, então o caminho está no código. "Sem link" não quer dizer secreto: quem protege a entrada é o servidor (sessão, chave e limites), e o critério de aceite é o servidor recusar (inferência, com a varredura do protótipo).

## 10. Nomes novos propostos

Nomes em código em inglês. `Author` segue o `GLOSSARY.md` ("Autor"; evitar "admin" e "usuário").

| Nome | Onde | O que é |
|---|---|---|
| `AUTHOR_EMAIL` | ambiente da web | e-mail da conta única (segredo) |
| `AUTH_DATABASE_URL` | ambiente da web | conexão com o banco do better-auth |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | ambiente da web | nomes do próprio better-auth |
| `RESEND_API_KEY`, `EMAIL_FROM` | ambiente da web | os mesmos do travelmanager |
| `INTERNAL_JWT_SECRET` | ambiente da web e da API | segredo HS256, com 32 bytes ou mais |
| `minimal-me-web`, `minimal-me-api` | claims `iss` e `aud` | emissor e público do token interno |
| `migrate-auth`, `seed-author`, `recover-author` | scripts da web | migração, semente e recuperação |
| `requestSignInLink` | Server Action da web | pedido de link |
| `mintInternalToken` | módulo `server-only` da web | cunha o token interno |
| `identity` | contexto da API | identidade do Autor na API |
| `InternalTokenVerifier`, `InvalidInternalTokenError` | port e erro do `identity` | conferência do token |
| `PyJwtInternalTokenVerifier` | adapter do `identity` | conferência com PyJWT |
| `FakeInternalTokenVerifier` | `tests/identity/fakes.py` | dublê do port |
| `current_author` | `http/dependencies.py` da API | dependência que devolve o Autor |
| `internal_jwt_secret` | campo do `Settings` | o segredo, lido no boot |

## Recomendação para a spec

1. **better-auth na web**: `better-auth` e `@better-auth/passkey` 1.7.25 pinados. Kysely com `pg`, num banco só do better-auth, migrado no arranque da web por `getMigrations` sob advisory lock e conferido na CI por `npx auth check schema`. Magic link com `disableSignUp: true` e `storeToken: "hashed"`, e a rota HTTP `/sign-in/magic-link` em `disabledPaths`. Impacto: a web é a dona única do DDL da entrada, a API é a dona do dela, e ninguém de fora dispara e-mail.
2. **Primeiro aparelho**: semente idempotente com `AUTHOR_EMAIL` no arranque, por `auth.$context` e `internalAdapter.createUser` com `emailVerified: true`. O primeiro aparelho e cada aparelho novo entram pelo link e registram a chave na página de destino, com a sessão ainda fresca. Impacto: nenhuma tela de cadastro, e o e-mail do Autor fica só no ambiente e no banco.
3. **Recuperação**: quem perde as chaves usa o link. Quem perde também o e-mail usa o comando `recover-author` no container da web, que troca o e-mail, fecha as sessões, apaga as chaves se for preciso e imprime um link de 5 minutos. No MVP, o mesmo comando revoga aparelho, com `deletePasskey` e `revokeSessions`; uma tela "Aparelhos" fica opcional. Impacto: nenhuma tela nova, e a recuperação depende do Coolify.
4. **Sessão**: os padrões do better-auth (7 dias, renovação diária, frescura de 1 dia, sem cache em cookie). O cookie `__Secure-better-auth.session_token` é `HttpOnly`, `Secure`, `SameSite=Lax` e só do host. Um envio recusado volta `401` em `problem+json`, e o compositor mantém a tela, os arquivos e o rascunho, cobre com "Entrar" e refaz só o pedido recusado. Impacto: revogação imediata, e nenhum trabalho perdido enquanto a aba estiver aberta.
5. **Token interno**: HS256 com segredo compartilhado, no molde do LUC. A web cunha um token por pedido, com `iss minimal-me-web`, `aud minimal-me-api`, `sub` igual ao id da conta e 60 s de vida. A API confere com PyJWT (`algorithms=["HS256"]`, `require` das cinco claims, `strict_aud`, chave de 32 bytes ou mais) no contexto `identity`, com o port `InternalTokenVerifier` (posições 1, 6, 10, 13 e 28) e o segredo no `Settings` fail-closed (12), antes de ler corpo grande. Impacto: sem tabela `jwks`, sem chamada da API para a web, nada no navegador, e um envio longo não esbarra no `exp`.
6. **Limites de tentativa**: a única regra da Cloudflare cobre o endereço de entrada e as rotas de chave e de `verify`, com 10 pedidos em 10 s por IP e bloqueio de 10 s. O better-auth lê o IP do `cf-connecting-ip` e limita `/passkey/*` a 10 pedidos por minuto. O pedido de link, que escapa do limitador embutido, tem limite próprio: um por minuto e três por hora por IP, dez por dia no total. Impacto: rajadas param na borda, a cota do Resend fica protegida, e o Autor nunca fica trancado sem saída.
7. **CSRF**: confiar no `Origin` do better-auth (sem `trustedOrigins` extras em produção) e na comparação de `Origin` com `Host` das Server Actions, e conferir o `Origin` com `isTrustedOrigin` em todo route handler que muda estado. A API, sem rota pública, autentica só pelo token. Impacto: uma checagem a mais por route handler, e nada na API.
8. **E-mail do link**: SDK `resend` 6.38.1, enviando de um subdomínio (proposta: `auth.<domínio>`) com MX e SPF em `send`, DKIM em `resend._domainkey`, DMARC começando por `p=none` e rastreamento desligado. A camada gratuita basta (100 por dia, 3.000 por mês, 3 domínios), e o texto está em 8.4. Impacto: custo zero e quatro registros DNS na zona.
9. **`noindex` e endereço sem link**: `metadata.robots = { index: false, follow: false }` no segmento da entrada e no da página de aparelho novo, mais `X-Robots-Tag` por `headers()`. O caminho fica fora do `robots.txt`, do sitemap e de qualquer link. Impacto: a entrada some da busca sem anunciar o caminho, e a segurança continua no servidor.
