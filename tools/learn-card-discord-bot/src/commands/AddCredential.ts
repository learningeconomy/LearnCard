import {
    Client,
    BaseCommandInteraction,
    ModalBuilder,
    ApplicationCommandOptionType,
    TextInputBuilder,
    ActionRowBuilder,
} from 'discord.js';
import { VC } from '@learncard/types';

import { createCredentialTemplate } from '../accesslayer/credentialtemplates/create/index';

export const AddCredential: Command = {
    name: 'add-credential',
    description: 'Adds a credential template.',
    type: ApplicationCommandOptionType.ChatInput,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        const modal = new ModalBuilder()
            .setCustomId('add-credential-modal')
            .setTitle('Add Credential');

        const credentialNameInput = new TextInputBuilder()
            .setCustomId('credentialName')
            .setLabel('Credential Name')
            .setStyle('Short');

        const credentialDescriptionInput = new TextInputBuilder()
            .setCustomId('credentialDescription')
            .setLabel('Credential Description')
            .setStyle('Paragraph');

        const credentialCriteriaInput = new TextInputBuilder()
            .setCustomId('credentialCriteria')
            .setLabel('Credential Criteria')
            .setStyle('Paragraph');

        const credentialImageInput = new TextInputBuilder()
            .setCustomId('credentialImage')
            .setLabel('Credential Image')
            .setStyle('Short');

        const firstActionRow = new ActionRowBuilder().addComponents([credentialNameInput]);
        const secondActionRow = new ActionRowBuilder().addComponents([credentialDescriptionInput]);
        const thirdActionRow = new ActionRowBuilder().addComponents([credentialCriteriaInput]);
        const fourthActionRow = new ActionRowBuilder().addComponents([credentialImageInput]);

        modal.addComponents([firstActionRow, secondActionRow, thirdActionRow, fourthActionRow]);

        await interaction.showModal(modal);
    },
};

export const AddCredentialModal = {
    modal_id: 'add-credential-modal',
    submit: async (context: Context, interaction: Interaction) => {
        const credentialName = interaction.fields.getTextInputValue('credentialName');
        const credentialDescription = interaction.fields.getTextInputValue('credentialDescription');
        const credentialCriteria = interaction.fields.getTextInputValue('credentialCriteria');
        const credentialImage = interaction.fields.getTextInputValue('credentialImage');

        console.log(
            'Add Credential to DB',
            credentialName,
            credentialDescription,
            credentialCriteria,
            credentialImage
        );

        await createCredentialTemplate(
            {
                name: credentialName,
                description: credentialDescription,
                criteria: credentialCriteria,
                image: credentialImage,
            },
            context
        );

        await interaction.deferReply();
        await interaction.followUp({
            ephemeral: true,
            content: `Credential Added: \n - ${credentialName} \n - ${credentialDescription} \n - ${credentialCriteria} \n - ${credentialImage}`,
        });
    },
};
