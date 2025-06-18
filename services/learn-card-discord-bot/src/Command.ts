import type { BaseCommandInteraction, ChatInputApplicationCommandData, Client } from 'discord.js';

export type Command = {
    run: (client: Client, interaction: BaseCommandInteraction) => void;
} & ChatInputApplicationCommandData
