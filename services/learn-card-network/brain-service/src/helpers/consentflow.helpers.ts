import { DbContractType } from 'types/consentflowcontract';
import { getWritersForContract } from '@accesslayer/consentflowcontract/relationships/read';
import { getProfileIdFromString } from './did.helpers';
import { TRPCError } from '@trpc/server';

/**
 * Resolves and validates a list of denied writer identifiers against the actual writers of a contract.
 *
 * @param contract - The consent flow contract Neo4j object.
 * @param deniedWriters - An array of strings, each potentially a profile ID, did:web, or did:key.
 * @param domain - The application domain, used for resolving did:web.
 * @returns A promise that resolves to an array of validated denied writer profile IDs.
 * @throws Throws a TRPCError if validation fails (identifier not found, more denied than actual writers, denied writer not an actual writer).
 */
export const resolveAndValidateDeniedWriters = async (
    contract: DbContractType,
    deniedWriters: string[] | undefined | null,
    domain: string
): Promise<string[]> => {
    if (!deniedWriters || deniedWriters.length === 0) return [];

    const writers = await getWritersForContract(contract);

    if (deniedWriters.length > writers.length) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'There are more denied writers than writers in the contract',
        });
    }

    const resolvedDeniedWriters = (await Promise.all(
        deniedWriters.map(async writer => {
            return getProfileIdFromString(writer, domain);
        })
    )) as string[];

    if (resolvedDeniedWriters.some(id => !id)) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Could not find profile(s) for denied writer(s)',
        });
    }

    if (resolvedDeniedWriters.some(id => !writers.some(writer => writer.profileId === id))) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'There are denied writers that are not writers in the contract',
        });
    }

    return resolvedDeniedWriters;
};
