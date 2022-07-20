import { BaseCommandInteraction } from 'discord.js';

export const IssueCredential: Command = {
    name: 'issue_credential',
    description: 'Issues credential to DID.',
    type: 1,
    deferReply: true,
    run: async (client: Client, interaction: BaseCommandInteraction, wallet: UnlockedWallet) => {
        console.log(wallet);

        const unsignedVC = await wallet.getTestVc();
        const vc = await wallet.issueCredential(unsignedVC);

        const stringifiedVC = JSON.stringify(vc);
        const content = '```' + stringifiedVC + '```';
        console.log(vc);
        await interaction.followUp({
            ephemeral: true,
            content,
        });
    },
};
