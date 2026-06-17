FROM node:22-alpine

WORKDIR /app

COPY package.json ./

RUN npm i -g bun@1.3.14

RUN bun install

COPY . .

EXPOSE 3100

CMD ["bun", "run", "dev"]
