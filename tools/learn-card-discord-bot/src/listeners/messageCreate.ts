import { Client, Message } from 'discord.js';

export default (client: Client): void => {
    console.log('Initiating messageCreate listener...');
    client.on('messageCreate', async (message: Message) => {
        if (message.content === 'ping') {
            message.reply({
                content: 'pong',
            });
        }
    });
};
