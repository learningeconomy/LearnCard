FROM --platform=linux/amd64 oven/bun:1.3.14

WORKDIR /root/monorepo
COPY . .

RUN cd services/learn-card-discord-bot

# ↑ Copy the whole repository and install dependencies with Bun
RUN bun install --ignore-scripts --frozen-lockfile

EXPOSE 8080
CMD [ "bun", "--filter", "learn-card-discord-bot", "run", "start" ]