FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY src ./src
COPY public ./public

RUN npm prune --omit=dev

FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
