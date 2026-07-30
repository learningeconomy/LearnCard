FROM oven/bun:1.3.14

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

EXPOSE 3100

CMD ["bun", "run", "dev"]
