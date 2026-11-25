import type { ReadableDeliveryCredential, UnsignedVC } from '@learncard/types';
import {
    getContractDetailsById,
    getWritersForContract,
} from '@accesslayer/consentflowcontract/relationships/read';
import { getSigningAuthoritiesForUser } from '@accesslayer/signing-authority/relationships/read';
import { getProfileByDid } from '@accesslayer/profile/read';
import { getRegistryService } from '../services/registry/registry.factory';
import { getDidWeb } from './did.helpers';
import { getUriParts } from './uri.helpers';
import { verifyDeliveryCredential } from './readable-delivery-verifier.helpers';

type Verification = NonNullable<ReadableDeliveryCredential['credential']>['verification'];

/** Resolve expectations from the current contract, never from uploaded credential claims. */
export const getDeliveryTrustContext = async (
    contractUri: string,
    learnerDid: string,
    domain: string
): Promise<{ expectedIssuers: Set<string>; learnerDids: Set<string> }> => {
    const details = await getContractDetailsById(getUriParts(contractUri).id);
    if (!details) throw new Error('Contract unavailable');
    const profiles = await getWritersForContract(details.contract);
    const expectedIssuers = new Set(details.contract.contract.expectedIssuers ?? []);
    for (const profile of [details.contractOwner, ...profiles]) {
        expectedIssuers.add(profile.did);
        expectedIssuers.add(getDidWeb(domain, profile.profileId));
        for (const authority of await getSigningAuthoritiesForUser(profile))
            expectedIssuers.add(authority.relationship.did);
    }
    const learner = await getProfileByDid(learnerDid);
    const learnerDids = new Set([learnerDid]);
    if (learner) {
        learnerDids.add(learner.did);
        learnerDids.add(getDidWeb(domain, learner.profileId));
    }
    return { expectedIssuers, learnerDids };
};

/** A signature alone never establishes currency or the issuer's role in this referral. */
export const verifyDeliveryOutcome = async (
    credential: UnsignedVC,
    context: Awaited<ReturnType<typeof getDeliveryTrustContext>>,
    localOrigin?: string,
    signal?: AbortSignal
): Promise<Verification> => {
    const issuer = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
    const checks = await verifyDeliveryCredential(credential, localOrigin, signal);
    if (checks.proof === 'invalid' || context.learnerDids.has(issuer ?? ''))
        return { ...checks, label: 'self_reported' };
    if (
        checks.proof !== 'valid' ||
        checks.dates !== 'valid' ||
        !['valid', 'not_applicable'].includes(checks.status)
    )
        return { ...checks, label: 'unverified' };
    const expected = Boolean(issuer && context.expectedIssuers.has(issuer));
    const unavailable: Verification = { ...checks, label: expected ? 'verified' : 'unverified' };
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        if (signal?.aborted) return unavailable;
        const registry = await Promise.race([
            getRegistryService().getIssuer(issuer ?? ''),
            new Promise<null>(resolve => {
                timer = setTimeout(() => resolve(null), 2_000);
            }),
        ]);
        const match = registry?.matchingIssuers[0];
        if (match)
            return {
                ...checks,
                label: expected ? 'verified' : 'recognized_issuer',
                issuerName: match.issuer.federation_entity.organization_name.slice(0, 2048),
            };
        if (expected) return unavailable;
        // A failed registry cannot establish that an issuer is unknown.
        if (!registry || registry.uncheckedRegistries.length)
            return { ...checks, label: 'unverified' };
        return { ...checks, label: 'signed_unknown_issuer' };
    } catch {
        return unavailable;
    } finally {
        clearTimeout(timer);
    }
};
