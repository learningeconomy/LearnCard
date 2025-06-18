import type { Message } from 'discord.js';
import type { Context } from 'src/types/index';

export default ({ client }: Context): void => {
    console.log('Initiating messageCreate listener...');
    client.on('messageCreate', async (message: Message) => {
        if (message.content === 'ping') {
            message.reply({
                content: 'pong',
            });
        }
    });
};
