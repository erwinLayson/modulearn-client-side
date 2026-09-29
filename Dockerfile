FROM node:24.18.0 AS client

RUN corepack enable

WORKDIR /client

COPY package*.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev"]