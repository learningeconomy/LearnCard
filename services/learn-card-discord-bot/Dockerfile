FROM --platform=linux/amd64 node:16

RUN npm --global install bun@1.3.14
RUN npm install pm2 -g
RUN bun add esbuild
RUN bun add rollup-plugin-esbuild

WORKDIR /root/monorepo
COPY ../.. . 
# ↑ Copy the whole repository and let Bun filter what to run
RUN bun install
RUN bun --filter learn-card-discord-bot run build
RUN bun --filter learn-card-discord-bot run test

RUN ls -al -R

EXPOSE 8080
CMD [ "bun", "run", "start" ]