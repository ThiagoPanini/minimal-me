# syntax=docker/dockerfile:1
# Imagem da Home: o build do Next roda aqui dentro, e o nginx serve o export.
# Contexto de build: a raiz do repositório (a web lê `docs/design/system/`).

FROM node:24.22.3-trixie-slim@sha256:af02d57b57719b9657a45199a79264a9437940cd55b3c7b3fc99615654f124a0 AS build
# Na `main`, a SBOM da imagem publicada cobre também este estágio, com as dependências da build.
ARG BUILDKIT_SBOM_SCAN_STAGE=true
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1

# O pnpm vem da versão fixada em `packageManager`, a mesma da máquina e da CI.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN npm install --global "$(node -p "require('./package.json').packageManager")"
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --filter web --store-dir /pnpm-store

COPY docs/design/system docs/design/system
COPY apps/web apps/web
RUN pnpm --filter web build

# O commit entra depois do build, para não invalidar o cache do passo acima.
ARG COMMIT
RUN printf '%s' "$COMMIT" | grep -Eq '^[0-9a-f]{40}$' \
      || { echo "COMMIT precisa ser o SHA de 40 caracteres do commit" >&2; exit 1; } \
 && printf '{"commit":"%s"}\n' "$COMMIT" > apps/web/out/version.json

FROM ghcr.io/nginx/nginx-unprivileged:1.31.9-alpine-slim@sha256:75e85a09b0f25bd46d49a9fd85589ffa70b0459c8ed5ee0dc6596fd642e1f829
COPY apps/web/nginx/ /etc/nginx/conf.d/
COPY --from=build /repo/apps/web/out/ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
