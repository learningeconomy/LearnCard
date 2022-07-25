import { BaseCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { getCredentialTemplates } from '../accesslayer/credentialtemplates/read';

export const ListCredentials: Command = {
    name: 'list-credentials',
    description: 'Lists all credential templates.',
    type: ApplicationCommandOptionType.ChatInput,
    deferReply: true,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        const credentialTemplates = await getCredentialTemplates(context);

        console.log(credentialTemplates);

        const stringifiedTemplates = JSON.stringify(credentialTemplates);

        const content = '```' + stringifiedTemplates + '```';
        await interaction.followUp({
            ephemeral: true,
            content,
        });
    },
};
