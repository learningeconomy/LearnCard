import {
    ModalBuilder,
    ApplicationCommandOptionType,
    SelectMenuBuilder,
    ActionRowBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { getDIDForSource } from '../accesslayer/didregistry/read';
import {
    getCredentialTemplates,
    getCredentialTemplateById,
} from '../accesslayer/credentialtemplates/read';

import { CredentialTemplate } from '../types';

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
        const templates = await getCredentialTemplates(context);
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

export const SendCredentialSelection = {
    component_id: 'credential-template',
    submit: async (context: Context, interaction: Interaction) => {
        const { client, wallet } = context;

        const credentialTemplateSelected = interaction.values[0];
        const subjectUserId = interaction.message.content;

        await interaction.deferReply();

        const credentialTemplate = await getCredentialTemplateById(
            credentialTemplateSelected,
            context
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

        const unsignedVc = constructCredentialForSubject(
            wallet.did('key'),
            credentialTemplate,
            subjectDID
        );

        const vc = await wallet.issueCredential(unsignedVc);
        const streamId = await wallet.publishCredential(vc);

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
