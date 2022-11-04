import {
    ModalBuilder,
    ApplicationCommandOptionType,
    SelectMenuBuilder,
    ActionRowBuilder,
    SlashCommandBuilder,
    PermissionsBitField,
} from 'discord.js';

import { getCredentialTemplates } from '../accesslayer/credentialtemplates/read';

import { CredentialTemplate, IssuerConfig } from '../types';
import { getIssuerConfigs } from '../accesslayer/issuers/read';
import { sendCredentialToSubject } from './helpers';

export const SendCredential: Command = {
    name: 'send-credential',
    description: 'Send a credential to another user.',
    type: ApplicationCommandOptionType.ChatInput,
    dmPermission: false,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'subject',
            required: true,
            description: 'Pick a user to issue a credential to.',
        },
    ],
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        try {
            const subject = interaction.options.getUser('subject');

            const user = await interaction.guild.members.fetch(interaction.user.id);
            if (!user.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await interaction.reply({
                    content:
                        'You do not have permission to send a credential on this server.\n *You need permission:* `Manage Server`',
                    ephemeral: true,
                });
                return;
            }

            const templates = await getCredentialTemplates(context, interaction.guildId);
            const options = templates.map((t: CredentialTemplate) => {
                return {
                    label: t.name?.slice(0,90),
                    description: t.description?.slice(0,90),
                    value: t._id || t.name,
                };
            });

            if (options?.length <= 0) {
                console.error(
                    'No credential templates exist yet. Please create one using /add-credential.'
                );
                await interaction.reply({
                    content:
                        'No credential templates exist yet. Please create one with /add-credential command.',
                    ephemeral: true,
                });
                return;
            }

            const credentialTemplate = new SelectMenuBuilder()
                .setCustomId('credential-template')
                .setPlaceholder('Select Credential')
                .addOptions(options);

            const firstActionRow = new ActionRowBuilder().addComponents([credentialTemplate]);

            await interaction.reply({
                content: `${subject.id}`,
                components: [firstActionRow],
            });
        } catch (e) {
            console.error(e);
            await interaction.reply({
                content: 'Woops, an error occured. Try that again 🫠.`',
                ephemeral: true,
            });
        }
    },
};

export const SendCredentialSelection = {
    component_id: 'credential-template',
    submit: async (context: Context, interaction: Interaction) => {
        const credentialTemplateSelected = interaction.values[0];
        const subjectUserId = interaction.message.content;

        const issuers = await getIssuerConfigs(context, interaction.guildId);
        const options = issuers.map((t: IssuerConfig) => {
            return {
                label: t.issuer.name,
                description: t.issuer.id,
                value: t._id,
            };
        });

        if (options?.length <= 0) {
            console.error('No issuers exist yet. Please configure one using /configure-issuer.');
            await interaction.reply({
                content:
                    'No issuers exist yet. Please create one with `/configure-issuer` command.',
            });
            return;
        }

        const issuerSelectMenu = new SelectMenuBuilder()
            .setCustomId('send-credential-issuer-selection')
            .setPlaceholder('Select Issuer')
            .addOptions(options);

        const firstActionRow = new ActionRowBuilder().addComponents([issuerSelectMenu]);

        await interaction.reply({
            content: `${subjectUserId}:${credentialTemplateSelected}`,
            components: [firstActionRow],
        });
    },
};

export const PickIssuerSelection = {
    component_id: 'send-credential-issuer-selection',
    submit: async (context: Context, interaction: Interaction) => {
        const issuerSelected = interaction.values[0];
        const subjectUserIdAndTemplateId = interaction.message.content;
        const [subjectUserId, templateId] = subjectUserIdAndTemplateId.split(':');

        await interaction.deferReply();

        const { data, error } = await sendCredentialToSubject(
            issuerSelected,
            subjectUserId,
            templateId,
            interaction,
            context
        );

        if (error) {
            if (data.pendingVc) {
                await interaction.followUp({
                    ephemeral: true,
                    content: `**${data.credentialTemplate?.name}** successfully issued to (${data.subjectUserName}) ✅, but failed to send message to user 🔧. \n 
                                User must register their DID identity to claim, with \`/start-connect-id\` ❌`,
                });
            } else {
                await interaction.followUp({
                    ephemeral: true,
                    content: `**${data.credentialTemplate?.name}** successfully issued to ${data.subjectUserName} (${data.subjectUserName}) ✅, but failed to send message to user 🔧. \n 
                            Share this link with them to claim: ${data.claimCredentialLink}} 🍄`,
                });
            }
            return;
        }

        await interaction.followUp({
            ephemeral: true,
            content: `**${data.credentialTemplate?.name}** successfully sent to @${data.subjectUserName} 🎓✅`,
        });
    },
};