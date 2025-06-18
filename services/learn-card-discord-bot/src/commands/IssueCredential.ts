import type { BaseCommandInteraction } from 'discord.js';
import type { Context } from 'src/types/index';

export const IssueCredential: Command = {
    name: 'issue_test_credential',
    description: 'Issues test credential to DID.',
    type: 1,
    deferReply: true,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        try {
            const { wallet } = context;

            const unsignedVC = await wallet.invoke.getTestVc();
            const vc = await wallet.invoke.issueCredential(unsignedVC);

            const stringifiedVC = JSON.stringify(vc);
            const content = '**Test Credential Success** 🎉✅\n ```' + stringifiedVC + '```';
            await interaction.followUp({
                ephemeral: true,
                content,
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
