FROM oven/bun:1.4.2

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

EXPOSE 3100

CMD ["bun", "run", "dev"]
