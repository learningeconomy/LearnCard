import { Client } from 'discord.js';
import dotenv from 'dotenv';
import ready from './listeners/ready';
import interactionCreate from './listeners/interactionCreate';

console.log('Bot is starting...');

dotenv.config();

const token = process.env.DISCORD_TOKEN;

const client = new Client({
    intents: [],
});

ready(client);
interactionCreate(client);

client.login(token);
