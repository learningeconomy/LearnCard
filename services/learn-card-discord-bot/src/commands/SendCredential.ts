import {
    ModalBuilder,
    ApplicationCommandOptionType,
    SelectMenuBuilder,
    ActionRowBuilder,
    SlashCommandBuilder,
    PermissionsBitField,
} from 'discord.js';
import { initLearnCard } from '@learncard/core';
import { getDIDForSource } from '../accesslayer/didregistry/read';
import {
    getCredentialTemplates,
    getCredentialTemplateById,
} from '../accesslayer/credentialtemplates/read';

import { CredentialTemplate, IssuerConfig } from '../types';
import { getIssuerConfigById, getIssuerConfigs } from '../accesslayer/issuers/read';

export const SendCredential: Command = {
    name: 'send-credential',
    description: 'Send a credential to another user.',
    type: ApplicationCommandOptionType.ChatInput,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'subject',
            required: true,
            description: 'Pick a user to issue a credential to.',
        },
    ],
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        const subject = interaction.options.getUser('subject');

        const user = await interaction.guild.members.fetch(interaction.user.id);
        if (!user.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({
                content:
                    'You do not have permission to send a credential on this server.\n *You need permission:* `Manage Server`',
            });
            return;
        }

        const templates = await getCredentialTemplates(context, interaction.guildId);
        const options = templates.map((t: CredentialTemplate) => {
            return {
                label: t.name,
                description: t.description,
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
    },
};

const constructCredentialForSubject = (
    issuer: string | object,
    template: CredentialTemplate,
    didSubject: string
) => {
    const { name, description, criteria, image } = template;
    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/jff-vc-edu-plugfest-1-context.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            type: 'AchievementSubject',
            id: didSubject,
            achievement: {
                type: 'Achievement',
                name,
                description,
                criteria: {
                    type: 'Criteria',
                    narrative: criteria,
                },
                image,
            },
        },
    };
};

export const PickIssuerSelection = {
    component_id: 'send-credential-issuer-selection',
    submit: async (context: Context, interaction: Interaction) => {
        const { client } = context;

        const issuerSelected = interaction.values[0];
        const subjectUserIdAndTemplateId = interaction.message.content;
        const [subjectUserId, templateId] = subjectUserIdAndTemplateId.split(':');

        await interaction.deferReply();

        const issuerConfig = await getIssuerConfigById(
            issuerSelected,
            context,
            interaction.guildId
        );
        const credentialTemplate = await getCredentialTemplateById(
            templateId,
            context,
            interaction.guildId
        );
        const subjectDID = await getDIDForSource(subjectUserId, context);

        console.log('Issuing credential for subject.', credentialTemplate, subjectDID);
        if (!subjectDID) {
            console.error(
                'Subject does not have an associated DID. Use the /register-did command.',
                subjectUserId
            );
            await interaction.followUp({
                ephemeral: true,
                content: `Subject user does not have an associated DID. Use the /register-did command.`,
            });
            return;
        }

        const issuer = await initLearnCard({ seed: issuerConfig.seed });

        const unsignedVc = constructCredentialForSubject(
            issuer.did('key'),
            credentialTemplate,
            subjectDID
        );

        const vc = await issuer.issueCredential(unsignedVc);
        const streamId = await issuer.publishCredential(vc);

        const claimCredentialLink = `https://learncard.app/claim-credential/${streamId}`;
        let subjectUser;
        try {
            subjectUser = await client.users.fetch(subjectUserId);

            subjectUser.send(
                `Hello! You have received a credential: ${credentialTemplate.name} 🎉 \n Click this link to claim: ${claimCredentialLink}`
            );
        } catch (e) {
            console.error('Error sending message to user.', e);
            await interaction.followUp({
                ephemeral: true,
                content: `**${credentialTemplate.name}** successfully issued to (${subjectDID}) ✅, but failed to send message to user 🔧. \n 
                            Share this link with them to claim: ${claimCredentialLink}} 🍄`,
            });
            return;
        }

        await interaction.followUp({
            ephemeral: true,
            content: `**${credentialTemplate.name}** successfully sent to @${subjectUser.username} 🎓✅`,
        });
    },
};

export const SendCredentialSelection = {
    component_id: 'credential-template',
    submit: async (context: Context, interaction: Interaction) => {
        const { client } = context;

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
