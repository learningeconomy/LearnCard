FROM --platform=linux/amd64 node:16

RUN npm --global install pnpm
RUN npm install pm2 -g
RUN pnpm install --save esbuild
RUN pnpm install --save rollup-plugin-esbuild

WORKDIR /root/monorepo
COPY ../.. . 
# ↑ Copy the whole repository and let pnpm filter what to run
RUN pnpm install --filter "learn-card-discord-bot..."
RUN pnpm build --filter "learn-card-discord-bot..."
RUN pnpm test --if-present --filter "learn-card-discord-bot"

RUN ls -al -R

EXPOSE 8080
CMD [ "pnpm", "start" ]