import { ClaimableBoostsPlugin, ClaimableBoostsPluginDependentMethods } from './types';
import { LearnCard } from '@learncard/core';

export * from './types';

/**
 * @group Plugins
 */
export const getClaimableBoostsPlugin = (
    learnCard: LearnCard<any, any, ClaimableBoostsPluginDependentMethods>
): ClaimableBoostsPlugin => {
    return {
        name: 'ClaimableBoosts',
        displayName: 'Claimable Boosts',
        description:
            'Simple claimable boost creation plugin that handles signing authority management.',
        methods: {
            generateBoostClaimLink: async (_learnCard, boostURI) => {
                console.log('Generating boost claim link...', boostURI);
                return _generateBoostClaimLink(_learnCard, boostURI);
            },
        },
    };
};

const _generateBoostClaimLink = async (
    _learnCard: LearnCard<any, any, ClaimableBoostsPluginDependentMethods>,
    boostURI: string
): Promise<string> => {
    try {
        const rsas = await _learnCard.invoke.getRegisteredSigningAuthorities();
        console.log('Registered Signing Authorities', rsas);

        if (rsas?.length > 0) {
            const rsa = rsas[0];
            console.log('Using Existing Signing Authority', rsa);

            // generate claim link with existing rsa
            const _boostClaimLink = await _learnCard.invoke.generateClaimLink(boostURI, {
                name: rsa.relationship?.name || '',
                endpoint: rsa.signingAuthority?.endpoint || '',
            });

            if (!_boostClaimLink) {
                throw new Error('Failed to generate claim link');
            }

            return `https://learncard.app/claim/boost?claim=true&boostUri=${_boostClaimLink.boostUri}&challenge=${_boostClaimLink.challenge}`;
        }

        // find existing signing authority
        const signingAuthorities = await _learnCard.invoke.getRegisteredSigningAuthorities();
        console.log('Existing Signing Authorities', signingAuthorities);
        let sa = signingAuthorities.find(
            signingAuthority => signingAuthority.relationship?.name === 'lca-sa'
        );

        if (!sa) {
            // create signing authority
            const newSa = await _learnCard.invoke.createSigningAuthority('lca-sa');
            console.log('Creating New Signing Authority', newSa);
            if (!newSa) {
                throw new Error('Failed to create signing authority');
            }
            sa = {
                relationship: { name: newSa.name },
                signingAuthority: { endpoint: newSa.endpoint },
            };
        }

        // register signing authority
        const rsa = await _learnCard.invoke.registerSigningAuthority(
            sa.signingAuthority?.endpoint || '',
            sa.relationship?.name || '',
            '' // TODO: Get DID from somewhere
        );

        console.log('Registering Signing Authority', sa);

        if (!rsa) {
            throw new Error('Failed to register signing authority');
        }

        const _boostClaimLink = await _learnCard.invoke.generateClaimLink(boostURI, {
            name: sa.relationship?.name || '',
            endpoint: sa.signingAuthority?.endpoint || '',
        });

        console.log('Generating Claim Link', _boostClaimLink);

        if (!_boostClaimLink) {
            throw new Error('Failed to generate claim link');
        }

        return `https://learncard.app/claim/boost?claim=true&boostUri=${_boostClaimLink.boostUri}&challenge=${_boostClaimLink.challenge}`;
    } catch (error) {
        console.error('Error generateBoostClaimLink:', error);
        throw new Error('Failed to generate boost claim link: ' + (error as Error).message);
    }
};
