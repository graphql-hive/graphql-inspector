FROM node:22-alpine AS build
ENV NODE_ENV=development
ENV DISTDIR=/usr/local/share/graphql-inspector

WORKDIR /app

COPY . .

RUN npm install -g pnpm@9.12.3
RUN pnpm install
RUN pnpm build

FROM node:22-alpine AS dist
ENV NODE_ENV=production
ENV DISTDIR=/usr/local/share/graphql-inspector

RUN mkdir /app
WORKDIR /app

COPY --from=build /app/packages "${DISTDIR}/packages"
COPY --from=build /app/package.json ${DISTDIR}
COPY --from=build /app/pnpm-workspace.yaml ${DISTDIR}

RUN npm install -g pnpm@9.12.3

WORKDIR ${DISTDIR}
RUN pnpm install --prod
RUN pnpm store prune

RUN ln -s "${DISTDIR}/packages/cli/dist/cjs/index.js" /usr/local/bin/graphql-inspector \
  && chmod +x /usr/local/bin/graphql-inspector
