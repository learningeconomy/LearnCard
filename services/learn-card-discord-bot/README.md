### LearnCard Discord Bot

For documentation on using the LearnCard Discord Bot, check out the official docs:
https://docs.learncard.com/learncard-services/discord-bot

## To run your own bot:

Add a `.env` file to root of project, and include the following keys:

```
DISCORD_TOKEN=<token>
SEED=<wallet_seed>
REDIS_HOST=<redis_host>
REDIS_PORT=<redis_port>
REDIS_PW=<redis_pw>
```

Run:

```
pnpm build
pnpm start
```

Or:

```
 docker build -t learn-card-discord-bot .
 docker run --restart unless-stopped learn-card-discord-bot
```