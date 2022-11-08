import { BaseCommandInteraction, Client, Interaction, InteractionType } from 'discord.js';
import { Commands, Modals, MessageComponents } from './../Commands';
import { UnlockedWallet } from '@learncard/types';
import { Context } from 'src/types/index';

export default (context: Context): void => {
    console.log('Initiating interactionCreate listener...');
    context.client.on('interactionCreate', async (interaction: Interaction) => {
        if (interaction.type === InteractionType.ApplicationCommand) {
            await handleSlashCommand(context, interaction);
        } else if (interaction.type === InteractionType.ModalSubmit) {
            await handleModalSubmit(context, interaction);
        } else if (interaction.type === InteractionType.MessageComponent) {
            await handleMessageComponentSubmit(context, interaction);
        }
    });
};

const handleSlashCommand = async (
    context: Context,
    interaction: BaseCommandInteraction
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
    slashCommand.run(context, interaction);
};

const handleModalSubmit = async (
    context: Context,
    interaction: BaseCommandInteraction
): Promise<void> => {
    console.log('Handling modal submit', interaction);

    const modal = Modals.find(c => c.modal_id === interaction.customId);

    if (!modal) {
        console.error('No modal found', interaction);
        await interaction.deferReply();
    }

    modal.submit(context, interaction);
};

const handleMessageComponentSubmit = async (
    context: Context,
    interaction: BaseCommandInteraction
): Promise<void> => {
    console.log('Handling message interaction submit', interaction);

    const messageHandler = MessageComponents.find(c => c.component_id === interaction.customId);

    if (!messageHandler) {
        console.error('No message component handler found', handler);
        await interaction.deferReply();
        return;
    }

    messageHandler.submit(context, interaction);
};
