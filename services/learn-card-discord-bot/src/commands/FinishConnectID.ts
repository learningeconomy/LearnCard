import {
    ApplicationCommandOptionType,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
} from 'discord.js';
import { createDIDAssociation } from '../accesslayer/didregistry/create';
import { getDIDChallengeForSource } from '../accesslayer/didregistry/read';
import { DIDAssociationType } from '../types';
import { sendPendingVCsToSubject } from './helpers';
import { deletePendingVcs } from '../accesslayer/pendingvcs/delete';

export const FinishConnectID: Command = {
    name: 'finish-connect-id',
    description: 'Step 2: verify your DID to your Discord account connection.',
    type: ApplicationCommandOptionType.ChatInput,
    dmPermission: true,
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        try {
            const modal = new ModalBuilder()
                .setCustomId('finish-connect-id-modal')
                .setTitle('Verify Your DID ID');

            const streamVerificationInput = new TextInputBuilder()
                .setCustomId('streamVerification')
                .setLabel('Verification Code')
                .setStyle('Short');

            // const vpInput = new TextInputBuilder()
            //     .setCustomId('vp')
            //     .setLabel('Raw Proof (advanced)')
            //     .setStyle('Paragraph')
            //     .setRequired(false);

            const firstActionRow = new ActionRowBuilder().addComponents([streamVerificationInput]);
            // const secondActionRow = new ActionRowBuilder().addComponents([vpInput]);

            modal.addComponents([firstActionRow]);

            await interaction.showModal(modal);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Woops, an error occured. Try that again 🫠.`',
                ephemeral: true,
            });
        }
    },
};

export const FinishConnectIDModal = {
    modal_id: 'finish-connect-id-modal',
    submit: async (context: Context, interaction: Interaction) => {
        const { user } = interaction;
        const { wallet } = context;

        const streamVerificationInput = interaction.fields.getTextInputValue('streamVerification');
        // const vpInput = interaction.fields.getTextInputValue('vp');

        console.log('Finish Connect ID to DB', streamVerificationInput);

        const challenge = await getDIDChallengeForSource(user.id, context);

        if (!challenge) {
            await interaction.reply({
                content:
                    'Auth verification failed ❌.\n `Challenge Expired.`\n Please provide a valid verification code or presentation.\n If your code expired, use `/start-connect-id` to generate another.',
                ephemeral: true,
            });
            return;
        }

        const domain = 'discord-bot.learncard.com';
        let vp;

        try {
            vp = await wallet.invoke.readContentFromCeramic(streamVerificationInput);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content:
                    'Auth verification failed ❌.\n `Could not read VP from Ceramic.`\nPlease provide a valid verification code or presentation.\n If your code expired, use `/start-connect-id` to generate another.',
                ephemeral: true,
            });
            return;
        }

        if (!vp) {
            await interaction.reply({
                content:
                    'Auth verification failed ❌.\n `Could not read VP from Ceramic.`\nPlease provide a valid verification code or presentation.\n If your code expired, use `/start-connect-id` to generate another.',
                ephemeral: true,
            });
            return;
        }

        const verification = await wallet.invoke.verifyPresentation(vp, {
            challenge,
            domain,
            proofPurpose: 'authentication',
        });

        if (verification.warnings.length > 0 || verification.errors.length > 0) {
            await interaction.reply({
                content:
                    'Auth verification failed ❌.\n `Presentation Could Not Be Verified.`\n Please provide a valid verification code or presentation.\n If your code expired, use `/start-connect-id` to generate another.',
                ephemeral: true,
            });
            return;
        }

        const did = vp.proof?.verificationMethod?.split('#')[0];

        await createDIDAssociation(
            {
                type: DIDAssociationType.DiscordAccount,
                source: user.id,
                did,
            },
            context
        );

        await interaction.reply({
            content: `**DID Registered Successfully.** 🚀 \n \`${did}\` \n Now, I'll send you credentials pending for your user... one moment. 🕊`,
            ephemeral: true,
        });

        const pendingVCs = await sendPendingVCsToSubject(user.id, interaction, context);

        if (pendingVCs?.length > 0) {
            const successCount = pendingVCs.filter(p => !p.error).length;
            await interaction.followUp({
                content: `**(${successCount}/${pendingVCs.length}) pending credentials successfully sent. ✅** \n You're all set!`,
                ephemeral: true,
            });
        } else {
            await interaction.followUp({
                content: "**No pending credentials found.** \n You're all set!",
                ephemeral: true,
            });
        }

        await deletePendingVcs(context, user.id);
    },
};
