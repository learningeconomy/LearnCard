import {
    ModalBuilder,
    ApplicationCommandOptionType,
    TextInputBuilder,
    ActionRowBuilder,
    PermissionsBitField,
    SelectMenuBuilder,
    type BaseCommandInteraction,
} from 'discord.js';

import { createCredentialTemplate } from '../accesslayer/credentialtemplates/create/index';
import { getCredentialTypeOptions } from './helpers';

export const AddCredential: Command = {
    name: 'add-credential',
    description: 'Adds a credential template.',
    type: ApplicationCommandOptionType.ChatInput,
    dmPermission: false,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        try {
            const user = await interaction.guild.members.fetch(interaction.user.id);
            if (!user.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await interaction.reply({
                    content:
                        'You do not have permission to add a credential on this server.\n *You need permission:* `Manage Server`',
                    ephemeral: true,
                });
                return;
            }

            const options = getCredentialTypeOptions();

            const issuerSelectMenu = new SelectMenuBuilder()
                .setCustomId('credential-type-selection')
                .setPlaceholder('Select Credential Type')
                .addOptions(options);

            const firstActionRow = new ActionRowBuilder().addComponents([issuerSelectMenu]);

            await interaction.reply({
                content: `Great! Lets create a new credential template for your community ✏️`,
                components: [firstActionRow],
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Woops, an error occured. Try that again 🫠.`',
                ephemeral: true,
            });
        }
    },
};

export const CredentialTypeSelection = {
    component_id: 'credential-type-selection',
    submit: async (context: Context, interaction: Interaction) => {
        const credentialTypeSelected = interaction.values[0];

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

        const credentialTypeInput = new TextInputBuilder()
            .setCustomId('credentialType')
            .setLabel('Credential Type')
            .setStyle('Short')
            .setValue(credentialTypeSelected);

        const firstActionRow = new ActionRowBuilder().addComponents([credentialNameInput]);
        const secondActionRow = new ActionRowBuilder().addComponents([credentialDescriptionInput]);
        const thirdActionRow = new ActionRowBuilder().addComponents([credentialCriteriaInput]);
        const fourthActionRow = new ActionRowBuilder().addComponents([credentialImageInput]);
        const fifthActionRow = new ActionRowBuilder().addComponents([credentialTypeInput]);

        modal.addComponents([
            firstActionRow,
            secondActionRow,
            thirdActionRow,
            fourthActionRow,
            fifthActionRow,
        ]);

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
        const credentialType = interaction.fields.getTextInputValue('credentialType');

        console.log(
            'Add Credential to DB',
            credentialName,
            credentialDescription,
            credentialCriteria,
            credentialImage,
            credentialType
        );

        await createCredentialTemplate(
            {
                name: credentialName,
                description: credentialDescription,
                criteria: credentialCriteria,
                image: credentialImage,
                type: credentialType,
            },
            context,
            interaction.guildId
        );

        await interaction.deferReply();
        await interaction.followUp({
            ephemeral: true,
            content: `**Credential Added** ✅ \n - ${credentialName} \n - ${credentialDescription} \n - ${credentialCriteria} \n - ${credentialImage}\n -${credentialType}`,
        });
    },
};
