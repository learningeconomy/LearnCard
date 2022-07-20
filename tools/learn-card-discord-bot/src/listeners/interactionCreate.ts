import { BaseCommandInteraction, Client, Interaction, InteractionType } from 'discord.js';
import { Commands, Modals } from './../Commands';
import { UnlockedWallet } from '@learncard/types';

export default (client: Client, wallet: UnlockedWallet): void => {
    console.log('Initiating interactionCreate listener...');
    client.on('interactionCreate', async (interaction: Interaction) => {
        if (interaction.type === InteractionType.ApplicationCommand) {
            await handleSlashCommand(client, interaction, wallet);
        } else if (interaction.type === InteractionType.ModalSubmit) {
            await handleModalSubmit(client, interaction, wallet);
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

    if (slashCommand.deferReply) {
        await interaction.deferReply();
    }
    slashCommand.run(client, interaction, wallet);
};

const handleModalSubmit = async (
    client: Client,
    interaction: BaseCommandInteraction,
    wallet: UnlockedWallet
): Promise<void> => {
    console.log('Handling modal submit', interaction);

    const modal = Modals.find(c => c.modal_id === interaction.customId);

    if (!modal) {
        console.error('No modal found', interaction);
        await interaction.deferReply();
    }

    modal.submit(client, interaction, wallet);
};
