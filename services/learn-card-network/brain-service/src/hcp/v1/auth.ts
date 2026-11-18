/**
 * Who is acting, and what their grant allows. Every service operation calls into
 * this module before it reads or writes any entry, so a denied request changes
 * nothing (the one exception is the lazy `grant.expired` transition, which records
 * what already happened to the grant, not an effect of the request).
 *
 * There is one grant truth: the stored grant. Nothing is cached in a token.
 */
import { effectiveGrant } from './service/contracts';
import type { HcpV1Caller, HcpV1Deps } from './service/deps';
import { urn } from './service/deps';
import { scopeDenied } from './service/errors';
import type { StoredGrant } from './store/port';
import { orderCategories, type Category, type GrantAction } from './schemas';

/** The Context Subject acting on their own data, or a Context Client acting under a grant. */
export type Actor =
    | { kind: 'subject'; did: string; subjectDid: string }
    | { kind: 'client'; did: string; subjectDid: string; grant: StoredGrant };

const isLapsed = (grant: StoredGrant, now: Date): boolean =>
    grant.expiresAt !== null && Date.parse(grant.expiresAt) <= now.getTime();

/**
 * Records a temporary grant's expiry the first time it is presented after it
 * lapses (Draft 3 §6.1.4, §8.1). Returns the grant as now stored.
 */
export const settleGrantExpiry = async (
    deps: HcpV1Deps,
    grant: StoredGrant
): Promise<StoredGrant> => {
    const now = deps.now();
    if (grant.status !== 'active' || !isLapsed(grant, now)) return grant;

    const at = now.toISOString();
    await deps.store.transitionGrantStatus(grant.grantId, 'expired', at, {
        eventId: urn(deps.newId()),
        eventType: 'grant.expired',
        timestamp: at,
        subjectDid: grant.subjectDid,
        providerId: deps.providerId,
        initiator: { role: 'hcp-provider', id: deps.providerId },
        entryId: null,
        categories: [],
        purpose: null,
        grantId: grant.grantId,
        data: { reason: 'expiresAt' },
    });
    return { ...grant, status: 'expired', statusChangedAt: at };
};

/**
 * Resolves the actor for a context operation. Without `grantId` the caller acts as
 * the Context Subject and must have a profile. With it, the caller must be the
 * grant's client, and the grant must be active and unexpired.
 */
export const resolveActor = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    grantId: string | undefined
): Promise<Actor> => {
    if (grantId === undefined) {
        if (!caller.subjectDid) throw scopeDenied();
        return { kind: 'subject', did: caller.did, subjectDid: caller.subjectDid };
    }

    const stored = await deps.store.getGrant(grantId);
    if (!stored || stored.client.id !== caller.did) throw scopeDenied();

    // A contract grant (LC-2421) is narrowed by its contract's current HCP section.
    const grant = await settleGrantExpiry(deps, await effectiveGrant(deps, stored));
    if (grant.status !== 'active' || grant.access.length === 0) throw scopeDenied();

    return { kind: 'client', did: caller.did, subjectDid: grant.subjectDid, grant };
};

/** Governance operations are the Context Subject's alone (Draft 3 §5.4). */
export const requireSubject = (caller: HcpV1Caller): string => {
    if (!caller.subjectDid) throw scopeDenied();
    return caller.subjectDid;
};

/**
 * Categories a grant lets its client take `action` on; for reads, only under
 * `purpose`. Registered and custom alike: a granted category is never dropped.
 */
export const grantedCategories = (
    grant: StoredGrant,
    action: GrantAction,
    purpose?: string
): Category[] => {
    const categories = new Set<Category>();
    for (const detail of grant.access) {
        if (!detail.actions.includes(action)) continue;
        if (purpose !== undefined && !detail.purposes.some(p => p.code === purpose)) continue;
        detail.categories.forEach(category => categories.add(category));
    }
    return orderCategories(categories);
};

/**
 * The categories a query is limited to (Draft 3 §5.2.1). Named categories must all
 * be readable for the purpose; omitted means every category the grant reads for it.
 * The result is never wider than the grant. `null` means no category filter: only
 * the Context Subject, reading their own context, gets it.
 */
export const queryCategories = (
    actor: Actor,
    requested: readonly Category[] | undefined,
    purpose: string
): Category[] | null => {
    if (actor.kind === 'subject') return requested ? orderCategories(requested) : null;

    const readable = grantedCategories(actor.grant, 'read', purpose);
    if (readable.length === 0) throw scopeDenied();
    if (!requested) return readable;
    if (!requested.every(category => readable.includes(category))) throw scopeDenied();
    return orderCategories(requested);
};

/**
 * The entry categories a client may see for `purpose`, or null when the entry is
 * out of reach: no readable category, or its permitted purposes exclude `purpose`
 * (Draft 3 §5.2.2, §7.1).
 */
export const disclosableCategories = (
    actor: Actor & { kind: 'client' },
    entry: {
        categories: readonly Category[];
        purposeLimits: readonly (string[] | null | undefined)[];
    },
    purpose: string
): Category[] | null => {
    const readable = grantedCategories(actor.grant, 'read', purpose);
    const visible = entry.categories.filter(category => readable.includes(category));
    if (visible.length === 0) return null;
    if (entry.purposeLimits.some(limit => limit && !limit.includes(purpose))) return null;
    return visible;
};

/** A client writes only where its grant carries `write` on every category touched. */
export const requireWrite = (actor: Actor, categories: readonly Category[]): void => {
    if (actor.kind === 'subject') return;
    const writable = grantedCategories(actor.grant, 'write');
    if (!categories.every(category => writable.includes(category))) throw scopeDenied();
};
