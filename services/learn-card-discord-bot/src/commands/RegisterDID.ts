import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js';
import { createDIDAssociation } from '../accesslayer/didregistry/create';
import { DIDAssociationType } from '../types';
import { sendPendingVCsToSubject } from './helpers';
import { deletePendingVcs } from '../accesslayer/pendingvcs/delete';

export const RegisterDID: Command = {
    name: 'register-did',
    description: 'Associate a did with your discord account.',
    type: ApplicationCommandOptionType.ChatInput,
    options: [
        {
            name: 'did',
            description: 'DID to associate with user.',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'holder',
            description: 'Select a user',
            type: ApplicationCommandOptionType.User,
        },
    ],
    run: async (context: Context, interaction: BaseCommandInteraction) => {
        const targetedUser = interaction.options.getUser('holder');
        const did = interaction.options.getString('did').replace('🔑', ':key:');
        const { user: currentUser } = interaction;

        if (targetedUser && targetedUser.id !== currentUser.id) {
            const initiator = await interaction.guild?.members.fetch(interaction.user.id);

            if (!initiator?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await interaction.reply({
                    content:
                        'You do not have permission to register a DID for another user on this server.\n *You need permission:* `Manage Server`',
                });
                return;
            }
        }

        console.log(
            `${currentUser.username} is registering DID for user`,
            targetedUser,
            did,
            interaction
        );

        const user = targetedUser ?? currentUser;
        await createDIDAssociation(
            {
                type: DIDAssociationType.DiscordAccount,
                source: user.id,
                did,
            },
            context
        );

        await interaction.reply({
            content:
                "**DID Registered Successfully.** 🚀 \n Now, I'll send you credentials pending for your user... one moment. 🕊",
            ephemeral: true,
        });

        const pendingVCs = await sendPendingVCsToSubject(user.id, interaction, context);

        if (pendingVCs?.length > 0) {
            const successCount = pendingVCs.filter(p => !p.error).length;
            await interaction.followUp({
                content: `**(${successCount}/${pendingVCs.length}) pending credentials successfully sent. ✅** \n You\'re all set!`,
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