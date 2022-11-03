import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { getWallet } from './wallet/learncard';
import cache from './cache/index';
import ready from './listeners/ready';
import interactionCreate from './listeners/interactionCreate';
import messageCreate from './listeners/messageCreate';
import { LearnCardFromSeed } from '@learncard/core';
import { Context } from './types/index';

console.log('Bot is starting...');

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const seed = process.env.SEED;

if (!seed) {
    throw new Error('SEED not provided in .env');
}

if (!token) {
    throw new Error('DISCORD_TOKEN not provided in .env');
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

getWallet(seed).then((wallet: UnlockedWallet) => {
    const context: Context = {
        wallet,
        client,
        cache,
    };

    ready(context);
    interactionCreate(context);
    messageCreate(context);

    client.login(token);
});
