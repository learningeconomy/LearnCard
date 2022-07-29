import { BaseCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { getCredentialTemplates } from '../accesslayer/credentialtemplates/read';

export const ListCredentials: Command = {
    name: 'list-credentials',
    description: 'Lists all credential templates.',
    type: ApplicationCommandOptionType.ChatInput,
    deferReply: true,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        const credentialTemplates = await getCredentialTemplates(context);

        const listOfCredentials = credentialTemplates
            .map(t => t.name)
            .reduce((list, name) => '- ' + name + '\n' + list, '');

        await interaction.followUp({
            ephemeral: true,
            content: `**Credential Templates**\n ${listOfCredentials}`,
        });
    },
};
