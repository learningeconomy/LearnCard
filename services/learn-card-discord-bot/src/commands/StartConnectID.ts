import { randomUUID } from 'crypto';
import { ApplicationCommandOptionType } from 'discord.js';
import { DIDAssociationType } from '../types';
import { createDIDChallenge } from '../accesslayer/didregistry/create';
import { getDIDForSource } from '../accesslayer/didregistry/read';

export const StartConnectID: Command = {
    name: 'start-connect-id',
    description: 'Step 1: Connect your DID to your Discord account.',
    type: ApplicationCommandOptionType.ChatInput,
    dmPermission: true,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        try {
            const { user } = interaction;

            const existingDID = await getDIDForSource(user.id, context);

            const challenge = randomUUID();

            await createDIDChallenge(
                {
                    type: DIDAssociationType.DiscordAccount,
                    source: user.id,
                    challenge,
                },
                context
            );

            const authLink = `https://learncard.app/did-auth/${challenge}?domain=discord-bot.learncard.com`;

            if (existingDID) {
                await interaction.reply({
                    content: `**You already have a DID identity connected to your account.**\n \`${existingDID}\`\n\n *If you'd like, you can update your DID <> Discord connection.* ↔️ \n \n Use this link to update your DID:\n ${authLink} \n When you have finished this step, run the \`/finish-connect-id\` command with your verification code.`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: `**Great! Let's connect your DID with your Discord account.** ↔️ \n Use this link to setup your credential LearnCard:\n ${authLink} \n When you have finished this step, run the \`/finish-connect-id\` command with your verification code.`,
                    ephemeral: true,
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
