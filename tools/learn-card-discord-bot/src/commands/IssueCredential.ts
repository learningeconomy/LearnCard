import { BaseCommandInteraction } from 'discord.js';
import { Context } from 'src/types/index';

export const IssueCredential: Command = {
    name: 'issue_test_credential',
    description: 'Issues test credential to DID.',
    type: 1,
    deferReply: true,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        const { wallet } = context;

        const unsignedVC = await wallet.getTestVc();
        const vc = await wallet.issueCredential(unsignedVC);

        const stringifiedVC = JSON.stringify(vc);
        const content = '**Test Credential Success** 🎉✅\n ```' + stringifiedVC + '```';
        await interaction.followUp({
            ephemeral: true,
            content,
        });
    },
};
