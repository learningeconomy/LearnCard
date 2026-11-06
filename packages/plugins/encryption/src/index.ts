import { EncryptionPluginType, EncryptionDependentLearnCard } from './types';

export * from './types';

/**
 * @group Plugins
 */
export const getEncryptionPlugin = async (
    learnCard: EncryptionDependentLearnCard
): Promise<EncryptionPluginType> => ({
    name: 'Encryption',
    displayName: 'Encryption Plugin',
    description: 'Exposes basic encryption methods',
    methods: {
        createJwe: async (_learnCard, cleartext, recipients = []) =>
            learnCard.invoke.createJwe(cleartext, [_learnCard.id.did(), ...recipients]),

        decryptJwe: async (_learnCard, jwe, jwks = []) =>
            learnCard.invoke.decryptJwe(jwe, [_learnCard.id.keypair(), ...jwks]),

        createDagJwe: async (_learnCard, cleartext, recipients = []) =>
            learnCard.invoke.createDagJwe(cleartext, [_learnCard.id.did(), ...recipients]),

        createDagJweExact: async (_learnCard, cleartext, recipients) => {
            if (recipients.length === 0 || new Set(recipients).size !== recipients.length) {
                throw new Error('Explicit encryption recipients must be nonempty and unique');
            }
            return learnCard.invoke.createDagJwe(cleartext, recipients);
        },

        decryptDagJwe: async (_learnCard, jwe, jwks = []) =>
            learnCard.invoke.decryptDagJwe(jwe, [_learnCard.id.keypair(), ...jwks]),
    },
});
