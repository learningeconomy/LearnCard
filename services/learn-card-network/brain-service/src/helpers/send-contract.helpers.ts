import { TRPCError } from '@trpc/server';
import type { BoostInstance } from '@models';
import type { ProfileType } from 'types/profile';
import {
    getContractDetailsByUri,
    getContractTermsForProfile,
    getWritersForContract,
} from '@accesslayer/consentflowcontract/relationships/read';
import { setRelatedBoostForContract } from '@accesslayer/consentflowcontract/relationships/create';

/** Resolve current send permissions; delivery must recheck the returned terms transactionally. */
export const resolveContractForSend = async (params: {
    profile: ProfileType;
    targetProfile: ProfileType;
    boost: BoostInstance;
    boostCreated: boolean;
    contractUri?: string;
}): Promise<Awaited<ReturnType<typeof getContractTermsForProfile>> | null> => {
    const { profile, targetProfile, boost, boostCreated, contractUri } = params;
    if (!contractUri) return null;

    const details = await getContractDetailsByUri(decodeURIComponent(contractUri));
    if (!details) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
    }
    const terms = await getContractTermsForProfile(targetProfile, details.contract);
    const writers = await getWritersForContract(details.contract);
    const allowed =
        terms &&
        writers.some(writer => writer.profileId === profile.profileId) &&
        !terms.terms.deniedWriters?.includes(profile.profileId) &&
        (!boost.category || terms.terms.write?.credentials?.categories?.[boost.category] === true);

    if (boostCreated) await setRelatedBoostForContract(details.contract, boost);
    return allowed ? terms : null;
};
