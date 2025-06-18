import { TRPCError } from '@trpc/server';
import type { AutoBoostConfig } from '@learncard/types';
import { ConsentFlowContract } from '../../../models/ConsentFlowContract';
import { QueryBuilder, BindParam } from 'neogma';
import { getIdFromUri } from '@helpers/uri.helpers';
import { getBoostByUri } from '@accesslayer/boost/read';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import type { ProfileType } from 'types/profile';
import { getAutoBoostsForContract } from './read';
import { Boost } from '@models';

/**
 * Adds multiple autoboosts to a contract, identified by its ID.
 * Ensures the signing authority belongs to the profile performing the action (owner or writer).
 */
export const addAutoBoostsToContractDb = async (
    contractId: string,
    autoboosts: AutoBoostConfig[],
    actorProfile: ProfileType,
    domain: string
): Promise<void> => {
    const existingAutoBoosts = await getAutoBoostsForContract(contractId, domain);

    await Promise.all(
        autoboosts.map(async autoboost => {
            if (existingAutoBoosts.includes(autoboost.boostUri)) return;

            const boost = await getBoostByUri(autoboost.boostUri);

            if (!boost || !boost.id) {
                console.warn(`Boost not found or invalid for AutoBoost: ${autoboost.boostUri}`);
                return;
            }

            // Pass actorProfile, assume underlying function handles ProfileType or expects .did
            const saForActor = await getSigningAuthorityForUserByName(
                actorProfile,
                autoboost.signingAuthority.endpoint,
                autoboost.signingAuthority.name
            );

            if (!saForActor) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: `Signing authority '${autoboost.signingAuthority.name}' at endpoint '${autoboost.signingAuthority.endpoint}' is not registered to the acting profile (${actorProfile.did}) or could not be found.`,
                });
            }

            await ConsentFlowContract.relateTo({
                alias: 'autoReceive',
                where: { source: { id: contractId }, target: { id: boost.id } },
                properties: {
                    signingAuthorityEndpoint: autoboost.signingAuthority.endpoint,
                    signingAuthorityName: autoboost.signingAuthority.name,
                    issuer: actorProfile.profileId,
                },
            });
        })
    );
};

/**
 * Removes specified autoboosts (by boost URI) from a contract, identified by its ID.
 */
export const removeAutoBoostsFromContractDb = async (
    contractId: string,
    boostUris: string[],
    domain: string
): Promise<void> => {
    const existingAutoBoosts = await getAutoBoostsForContract(contractId, domain);
    const urisToDelete = boostUris.filter(uri => existingAutoBoosts.includes(uri));
    const idsToDelete = urisToDelete.map(uri => getIdFromUri(uri));

    await new QueryBuilder(new BindParam({ boostIds: idsToDelete }))
        .match({
            related: [
                {
                    identifier: 'source',
                    model: ConsentFlowContract,
                    where: { id: contractId },
                },
                {
                    ...ConsentFlowContract.getRelationshipByAlias('autoReceive'),
                    identifier: 'autoReceive',
                },
                { identifier: 'target', model: Boost },
            ],
        })
        .where('target.id IN $boostIds')
        .delete({ detach: true, identifiers: ['autoReceive'] })
        .run();
};
