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
            learnCard.invoke.createJwe(cleartext, [learnCard.id.did(), ...recipients]),

        decryptJwe: async (_learnCard, jwe, jwks = []) =>
            learnCard.invoke.decryptJwe(jwe, [learnCard.id.keypair(), ...jwks]),

        createDagJwe: async (_learnCard, cleartext, recipients = []) =>
            learnCard.invoke.createDagJwe(cleartext, [learnCard.id.did(), ...recipients]),

        decryptDagJwe: async (_learnCard, jwe, jwks = []) =>
            learnCard.invoke.decryptDagJwe(jwe, [learnCard.id.keypair(), ...jwks]),
    },
});
