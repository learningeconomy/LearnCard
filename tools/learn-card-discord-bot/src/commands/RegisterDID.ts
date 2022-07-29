import { ApplicationCommandOptionType } from 'discord.js';
import { createDIDAssociation } from '../accesslayer/didregistry/create';
import { DIDAssociationType } from '../types';

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

        await interaction.reply({ content: 'DID Registered Successfully. 🚀', ephemeral: true });
    },
};
