import {
    Client,
    BaseCommandInteraction,
    ModalBuilder,
    ApplicationCommandOptionType,
    TextInputBuilder,
    ActionRowBuilder,
    PermissionsBitField,
} from 'discord.js';
import { VC } from '@learncard/types';

import { createIssuerConfig } from '../accesslayer/issuers/create/index';
import { initLearnCard } from '@learncard/core';
import { generateRandomSeed } from '../wallet/learncard';

export const ConfigureIssuer: Command = {
    name: 'configure-issuer',
    description: "Sets up your community's issuing identity.",
    type: ApplicationCommandOptionType.ChatInput,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        const user = await interaction.guild.members.fetch(interaction.user.id);
        if (!user.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({
                content:
                    'You do not have permission to configure an issuer on this server.\n *You need permission:* `Manage Server`',
                ephemeral: true,
            });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('configure-issuer-modal')
            .setTitle('Configure Issuer');

        const credentialNameInput = new TextInputBuilder()
            .setCustomId('issuerName')
            .setLabel('Issuer Name')
            .setStyle('Short');

        const credentialDescriptionInput = new TextInputBuilder()
            .setCustomId('issuerUrl')
            .setLabel('Issuer URL')
            .setRequired(false)
            .setStyle('Short');

        const credentialCriteriaInput = new TextInputBuilder()
            .setCustomId('issuerImage')
            .setLabel('Issuer Image')
            .setRequired(false)
            .setStyle('Short');

        const firstActionRow = new ActionRowBuilder().addComponents([credentialNameInput]);
        const secondActionRow = new ActionRowBuilder().addComponents([credentialDescriptionInput]);
        const thirdActionRow = new ActionRowBuilder().addComponents([credentialCriteriaInput]);

        modal.addComponents([firstActionRow, secondActionRow, thirdActionRow]);

        await interaction.showModal(modal);
    },
};

export const ConfigureIssuerModal = {
    modal_id: 'configure-issuer-modal',
    submit: async (context: Context, interaction: Interaction) => {
        const issuerName = interaction.fields.getTextInputValue('issuerName');
        const issuerUrl = interaction.fields.getTextInputValue('issuerUrl');
        const issuerImage = interaction.fields.getTextInputValue('issuerImage');

        console.log('Add Issuer to DB', issuerName, issuerUrl, issuerImage);

        const seed = generateRandomSeed();
        const issuerWallet = await initLearnCard({ seed });
        const issuerId = issuerWallet.id.did();

        await createIssuerConfig(
            {
                seed,
                guildId: interaction.guildId,
                issuer: {
                    type: 'Profile',
                    id: issuerId,
                    name: issuerName,
                    url: issuerUrl,
                    image: issuerImage,
                },
            },
            context,
            interaction.guildId
        );

        await interaction.deferReply();
        await interaction.followUp({
            ephemeral: true,
            content: `**Issuer Configured** ✅ \n - ${issuerName} \n - ${issuerUrl} \n - ${issuerImage} \n - \`${issuerId}\``,
        });
    },
};