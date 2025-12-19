FROM node:22-alpine

WORKDIR /app

COPY package.json ./

RUN npm i -g pnpm

RUN pnpm i --no-frozen-lockfile

COPY . .

EXPOSE 3100

CMD ["pnpm", "dev"]
