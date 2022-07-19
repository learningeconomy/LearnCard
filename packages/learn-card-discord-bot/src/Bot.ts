import { Client } from "discord.js";
import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";

console.log("Bot is starting...");

const token = process.env.TOKEN;

const client = new Client({
  intents: [],
});

ready(client);
interactionCreate(client);

client.login(token);
