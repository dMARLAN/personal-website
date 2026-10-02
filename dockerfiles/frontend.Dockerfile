# Tilt builds only the dev stage (target='dev' in the Tiltfile); plain builds run through to runner (prod).
FROM node:24-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM dev AS builder

# The /api rewrite's destination is baked in at build (next.config.ts): the API's in-cluster Service. The build itself
# never calls the API; content pages prerender from the committed seed snapshot (docs/design.md section 13.6).
ARG API_INTERNAL_URL=http://personal-website-api:8000
ENV API_INTERNAL_URL=${API_INTERNAL_URL}

RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
