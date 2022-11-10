import {
    BaseCommandInteraction,
    ApplicationCommandOptionType,
    PermissionsBitField,
} from 'discord.js';
import { getCredentialTemplates } from '../accesslayer/credentialtemplates/read';

export const ListCredentials: Command = {
    name: 'list-credentials',
    description: 'Lists all credential templates.',
    type: ApplicationCommandOptionType.ChatInput,
    deferReply: true,
    dmPermission: false,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        try {
            const user = await interaction.guild.members.fetch(interaction.user.id);
            if (!user.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await interaction.followUp({
                    ephemeral: true,
                    content:
                        'You do not have permission to list credentials on this server.\n *You need permission:* `Manage Server`',
                });
                return;
            }

            const credentialTemplates = await getCredentialTemplates(
                context,
                interaction.guildId || 'default'
            );

            const listOfCredentials = credentialTemplates
                .map(t => t.name)
                .reduce((list, name) => '- ' + name + '\n' + list, '');

            if (!listOfCredentials) {
                await interaction.followUp({
                    ephemeral: true,
                    content:
                        "**Credential Templates**\n *You don't have any credential templates setup!*\n Use the `/add-credential` command to setup a credential template for your community. 🚀",
                });
            } else {
                await interaction.followUp({
                    ephemeral: true,
                    content: `**Credential Templates**\n ${listOfCredentials}`,
                });
            }
        } catch (e) {
            console.error(e);
            await interaction.reply({
                content: 'Woops, an error occured. Try that again 🫠.`',
                ephemeral: true,
            });
        }
    },
};