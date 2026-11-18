/**
 * Grants from ConsentFlow contracts (LC-2421). A contract owned by an operator's
 * LearnCard profile may carry an HCP section naming the agent DIDs allowed to act
 * under it and the access a person grants when they allow it. The grant stores that
 * access resolved, plus the contract URI and the version the person allowed (its
 * pin). Every use reads the contract's current section and narrows the pinned access
 * by it, so a narrowing (`relaxed`) version applies to existing grants at once, while
 * a widening reaches no further than the pin until the person allows the contract
 * again. These are HCP grants only: no ConsentFlow terms are created.
 */
import type { ConsentFlowContractHcp } from '@learncard/types';

import { AccessDetailSchema, orderCategories, type AccessDetail } from '../schemas';
import type { StoredGrant } from '../store/port';
import type { HcpContract, HcpV1Deps } from './deps';

const HOUR_MS = 60 * 60 * 1000;

/** The contract durations, as the consent link offers them; `ongoing` is persistent. */
export const DURATION_MS: Record<ConsentFlowContractHcp['duration'], number | null> = {
    '1h': HOUR_MS,
    '4h': 4 * HOUR_MS,
    '24h': 24 * HOUR_MS,
    ongoing: null,
};

export type UsableContract = HcpContract & { hcp: ConsentFlowContractHcp };

/** The contract, if it offers HCP access now: present, active, unexpired, with a section. */
export const usableContract = (contract: HcpContract | null, now: Date): UsableContract | null => {
    if (!contract || contract.status !== 'active' || !contract.hcp) return null;
    if (contract.expiresAt !== null && Date.parse(contract.expiresAt) <= now.getTime()) return null;
    return contract as UsableContract;
};

/** The access a contract's HCP section grants, or null when it is not valid HCP access. */
export const contractAccess = (hcp: ConsentFlowContractHcp): AccessDetail[] | null => {
    const parsed = AccessDetailSchema.safeParse({
        actions: hcp.actions,
        categories: hcp.categories,
        purposes: hcp.purposes,
    });
    return parsed.success ? [parsed.data] : null;
};

/** The earlier of two instants; null means no bound. */
export const earlier = (a: string | null, b: string | null): string | null => {
    if (a === null) return b;
    if (b === null) return a;
    return Date.parse(a) <= Date.parse(b) ? a : b;
};

/** When the contract's current duration and expiry end a grant issued at `issuedAt`. */
const contractLimit = (contract: UsableContract, issuedAt: string): string | null => {
    const ms = DURATION_MS[contract.hcp.duration];
    const byDuration = ms === null ? null : new Date(Date.parse(issuedAt) + ms).toISOString();
    return earlier(byDuration, contract.expiresAt);
};

/** The pinned access, never wider than `current`: each detail intersected with it. */
const narrow = (pinned: AccessDetail[], current: AccessDetail[]): AccessDetail[] =>
    pinned.flatMap(detail =>
        current.flatMap(bound => {
            const codes = new Set(bound.purposes.map(purpose => purpose.code));
            const actions = detail.actions.filter(action => bound.actions.includes(action));
            const categories = orderCategories(
                detail.categories.filter(category => bound.categories.includes(category))
            );
            // The pinned descriptions are what the person read; keep them.
            const purposes = detail.purposes.filter(purpose => codes.has(purpose.code));
            if (!actions.length || !categories.length || !purposes.length) return [];
            return [{ ...detail, actions, categories, purposes }];
        })
    );

/**
 * What a grant allows now. Direct grants are as stored. A contract grant's pinned
 * access is narrowed by the contract's current HCP section; a temporary grant's
 * expiry is pulled in by a shorter duration or the contract's expiry. It has no
 * access when the contract is gone, retired, expired or without its HCP section, no
 * longer names the client, or (persistent grants) its duration or expiry has passed.
 */
export const effectiveGrant = async (deps: HcpV1Deps, grant: StoredGrant): Promise<StoredGrant> => {
    if (grant.source.type !== 'consentflow') return grant;
    const now = deps.now();
    const contract = usableContract(await deps.contracts.current(grant.source.contractUri), now);
    if (!contract || !contract.hcp.agents.includes(grant.client.id))
        return { ...grant, access: [] };

    const access = narrow(grant.access, contractAccess(contract.hcp) ?? []);
    const limit = contractLimit(contract, grant.issuedAt);
    if (grant.grantType === 'temporary')
        return { ...grant, access, expiresAt: earlier(grant.expiresAt, limit) };
    // Draft 3 §6.1.5: a persistent grant has no expiresAt, so a passed limit removes access.
    if (limit !== null && Date.parse(limit) <= now.getTime()) return { ...grant, access: [] };
    return { ...grant, access };
};
