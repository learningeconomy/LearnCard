import { Client } from 'discord.js';
import { Commands } from '../Commands';
import { Tally, constructTallyMessage } from '../commands/Tally';
import { Context } from 'src/types/index';

export default async ({ client }: Context): Promise<void> => {
    client.on('ready', async () => {
        if (!client.user || !client.application) {
            return;
        }
        await client.application.commands.set(Commands);
        console.log(`${client.user.username} is online`);
    });
};
