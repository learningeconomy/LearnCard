FROM oven/bun:1.4.4

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

EXPOSE 3100

CMD ["bun", "run", "dev"]
