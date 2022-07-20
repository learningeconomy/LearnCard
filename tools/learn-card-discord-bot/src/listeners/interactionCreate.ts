import { BaseCommandInteraction, Client, Interaction } from 'discord.js';
import { Commands } from './../Commands';
import { UnlockedWallet } from '@learncard/types';

export default (client: Client, wallet: UnlockedWallet): void => {
    console.log('Initiating interactionCreate listener...');
    client.on('interactionCreate', async (interaction: Interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu()) {
            await handleSlashCommand(client, interaction, wallet);
        }
    });
};

const handleSlashCommand = async (
    client: Client,
    interaction: BaseCommandInteraction,
    wallet: UnlockedWallet
): Promise<void> => {
    console.log('Handling slash command', interaction);
    const slashCommand = Commands.find(c => c.name === interaction.commandName);
    if (!slashCommand) {
        interaction.followUp({ content: 'An error has occurred' });
        return;
    }

    await interaction.deferReply();

    slashCommand.run(client, interaction, wallet);
};
