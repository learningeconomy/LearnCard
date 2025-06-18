import type { LCNBoostClaimLinkOptionsType } from '@learncard/types';
import type {
    ClaimableBoostsPlugin,
    ClaimableBoostsPluginDependentMethods,
    SigningAuthorityType,
} from './types';

import type { LearnCard } from '@learncard/core';

export * from './types';

const DEFAULT_RELATIONSHIP_NAME = 'lca-sa';

/**
 * @group Plugins
 */
export const getClaimableBoostsPlugin = (
    _learnCard: LearnCard<any, any, ClaimableBoostsPluginDependentMethods>
): ClaimableBoostsPlugin => {
    return {
        name: 'ClaimableBoosts',
        displayName: 'Claimable Boosts',
        description:
            'Simple claimable boost creation plugin that handles signing authority management.',
        methods: {
            generateBoostClaimLink: async (
                _learnCard: LearnCard<any, any, ClaimableBoostsPluginDependentMethods>,
                boostURI: string,
                options?: LCNBoostClaimLinkOptionsType
            ) => {
                _learnCard.debug?.('Generating boost claim link...', boostURI, options);
                return _generateBoostClaimLink(_learnCard, boostURI, options);
            },
        },
    };
};

const _generateBoostClaimLink = async (
    _learnCard: LearnCard<any, any, ClaimableBoostsPluginDependentMethods>,
    boostURI: string,
    options?: LCNBoostClaimLinkOptionsType
): Promise<string> => {
    try {
        const rsas = await _learnCard.invoke.getRegisteredSigningAuthorities();
        _learnCard.debug?.('Registered Signing Authorities', rsas);

        if (rsas?.length > 0) {
            const rsa = rsas[0];
            _learnCard.debug?.('Using Existing Signing Authority', rsa);

            // generate claim link with existing rsa
            const _boostClaimLink = await _learnCard.invoke.generateClaimLink(
                boostURI,
                {
                    name: rsa?.relationship?.name || '',
                    endpoint: rsa?.signingAuthority?.endpoint || '',
                },
                options
            );

            if (!_boostClaimLink) {
                throw new Error('Failed to generate claim link');
            }

            return `https://learncard.app/claim/boost?claim=true&boostUri=${_boostClaimLink.boostUri}&challenge=${_boostClaimLink.challenge}`;
        }

        // find existing signing authority
        const signingAuthorities = await _learnCard.invoke.getSigningAuthorities();
        _learnCard.debug?.('Existing Signing Authorities', signingAuthorities);

        let sa: SigningAuthorityType | undefined;
        if (signingAuthorities && Array.isArray(signingAuthorities)) {
            sa = signingAuthorities.find(
                (signingAuthority: SigningAuthorityType) =>
                    signingAuthority.name === DEFAULT_RELATIONSHIP_NAME
            );
        }

        if (!sa) {
            // create signing authority
            const newSa = await _learnCard.invoke.createSigningAuthority(DEFAULT_RELATIONSHIP_NAME);
            _learnCard.debug?.('Creating New Signing Authority', newSa);
            if (!newSa) {
                throw new Error('Failed to create signing authority');
            }
            sa = {
                ownerDid: newSa.ownerDid,
                name: DEFAULT_RELATIONSHIP_NAME,
                endpoint: newSa.endpoint,
                did: newSa.did,
            };
        }

        // register signing authority
        const rsa = await _learnCard.invoke.registerSigningAuthority(
            sa?.endpoint || '',
            sa?.name || '',
            sa?.did || ''
        );

        _learnCard.debug?.('Registering Signing Authority with Network', sa);

        if (!rsa) {
            throw new Error('Failed to register signing authority');
        }

        const _boostClaimLink = await _learnCard.invoke.generateClaimLink(
            boostURI,
            {
                name: sa?.name || '',
                endpoint: sa?.endpoint || '',
            },
            options
        );
        _learnCard.debug?.('Generating Claim Link', _boostClaimLink);

        if (!_boostClaimLink) {
            throw new Error('Failed to generate claim link');
        }

        return `https://learncard.app/claim/boost?claim=true&boostUri=${_boostClaimLink.boostUri}&challenge=${_boostClaimLink.challenge}`;
    } catch (error) {
        _learnCard.debug?.('Error generateBoostClaimLink:', error);
        throw new Error('Failed to generate boost claim link: ' + (error as Error).message);
    }
};
