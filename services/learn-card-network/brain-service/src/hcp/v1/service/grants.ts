/**
 * Grants (Draft 3 §6.1.5, §6.2). Issuing and listing are governance operations for
 * the Context Subject. Reading and revoking one grant are open to the subject and to
 * the grant's own client: the client's forms are "read own grant" (§5.2.6) and
 * "relinquish own grant" (§5.2.7).
 */
import { requireSubject, settleGrantExpiry } from '../auth';
import type { StoredGrant } from '../store/port';
import {
    CATEGORIES,
    type AccessDetail,
    type CreateGrantInput,
    type Grant,
    type GrantStatus,
} from '../schemas';
import { urn, type HcpV1Caller, type HcpV1Deps } from './deps';
import { malformed, scopeDenied } from './errors';

const HOUR_MS = 60 * 60 * 1000;
/** Draft 3 §6.1.3. */
export const TEMPORARY_GRANT_DEFAULT_MS = 4 * HOUR_MS;
export const TEMPORARY_GRANT_MAX_MS = 24 * HOUR_MS;

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const normalizeAccess = (access: AccessDetail[]): AccessDetail[] =>
    access.map(detail => ({
        type: detail.type,
        actions: detail.actions,
        categories: CATEGORIES.filter(category => detail.categories.includes(category)),
        purposes: detail.purposes.filter(
            (purpose, index, all) => all.findIndex(p => p.code === purpose.code) === index
        ),
    }));

/** Draft 3 §6.1.1: `hcp:{category}:{action}`, derived from `access`, never wider. */
const scopesFor = (access: AccessDetail[]): string[] =>
    unique(
        access.flatMap(detail =>
            detail.categories.flatMap(category =>
                detail.actions.map(action => `hcp:${category}:${action}`)
            )
        )
    ).sort();

export const toGrant = (grant: StoredGrant): Grant => ({
    grantId: grant.grantId,
    subject: { id: grant.subjectDid },
    authorizingPrincipal: { id: grant.subjectDid },
    client: grant.client,
    access: grant.access,
    scopes: scopesFor(grant.access),
    grantType: grant.grantType,
    issuedAt: grant.issuedAt,
    expiresAt: grant.expiresAt,
    status: grant.status,
    source: grant.source,
});

const expiryFor = (input: CreateGrantInput, now: Date): string | null => {
    if (input.grantType === 'persistent') {
        if (input.expiresAt !== undefined)
            throw malformed('A persistent grant has no expiresAt (Draft 3 §6.1.5).');
        return null;
    }
    if (input.expiresAt === undefined)
        return new Date(now.getTime() + TEMPORARY_GRANT_DEFAULT_MS).toISOString();

    const expiresAt = Date.parse(input.expiresAt);
    if (expiresAt <= now.getTime()) throw malformed('expiresAt must be in the future.');
    if (expiresAt > now.getTime() + TEMPORARY_GRANT_MAX_MS)
        throw malformed('A temporary grant expires at most 24 hours after issuance.');
    return new Date(expiresAt).toISOString();
};

export const createGrant = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: CreateGrantInput
): Promise<Grant> => {
    const subjectDid = requireSubject(caller);
    if (input.source.type !== 'direct')
        // TODO(LC-2421): issue grants from consent-flow terms.
        throw malformed(
            'Only direct grants are supported; consent-flow grants arrive with LC-2421.'
        );

    const now = deps.now();
    const issuedAt = now.toISOString();
    const grant: StoredGrant = {
        grantId: urn(deps.newId()),
        subjectDid,
        client: input.client,
        access: normalizeAccess(input.access),
        grantType: input.grantType,
        issuedAt,
        expiresAt: expiryFor(input, now),
        status: 'active',
        statusChangedAt: null,
        source: input.source,
    };

    await deps.store.insertGrant(grant);
    await deps.activity.record({
        eventId: urn(deps.newId()),
        eventType: 'grant.issued',
        timestamp: issuedAt,
        subjectDid,
        providerId: deps.providerId,
        initiator: { role: 'management-client', id: caller.did },
        entryId: null,
        categories: unique(grant.access.flatMap(detail => detail.categories)),
        purpose: null,
        grantId: grant.grantId,
        data: {
            access: grant.access,
            grantType: grant.grantType,
            expiresAt: grant.expiresAt,
            modality: 'api',
            client: grant.client,
            source: grant.source,
        },
    });
    return toGrant(grant);
};

/** Lists the subject's grants by status, settling any that lapsed (default `active`). */
export const listGrants = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    status: GrantStatus
): Promise<Grant[]> => {
    const subjectDid = requireSubject(caller);
    if (status !== 'active') return (await deps.store.listGrants(subjectDid, status)).map(toGrant);

    const settled = await Promise.all(
        (await deps.store.listGrants(subjectDid, 'active')).map(grant =>
            settleGrantExpiry(deps, grant)
        )
    );
    return settled.filter(grant => grant.status === 'active').map(toGrant);
};

type GrantParty = { grant: StoredGrant; role: 'management-client' | 'context-client' };

/** The grant, if the caller is its subject or its client. Never discloses another's grant. */
const grantForParty = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    grantId: string
): Promise<GrantParty> => {
    const stored = await deps.store.getGrant(grantId);
    if (!stored) throw scopeDenied();
    if (caller.subjectDid !== null && stored.subjectDid === caller.subjectDid)
        return { grant: await settleGrantExpiry(deps, stored), role: 'management-client' };
    if (stored.client.id === caller.did)
        return { grant: await settleGrantExpiry(deps, stored), role: 'context-client' };
    throw scopeDenied();
};

export const getGrant = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    grantId: string
): Promise<Grant> => toGrant((await grantForParty(deps, caller, grantId)).grant);

/** Idempotent: revoking a grant that is no longer active succeeds and records nothing. */
export const revokeGrant = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    grantId: string
): Promise<Grant> => {
    const { grant, role } = await grantForParty(deps, caller, grantId);
    if (grant.status !== 'active') return toGrant(grant);

    const at = deps.now().toISOString();
    if (!(await deps.store.transitionGrantStatus(grant.grantId, 'revoked', at))) {
        const current = await deps.store.getGrant(grant.grantId);
        return toGrant(current ?? grant);
    }
    await deps.activity.record({
        eventId: urn(deps.newId()),
        eventType: 'grant.revoked',
        timestamp: at,
        subjectDid: grant.subjectDid,
        providerId: deps.providerId,
        initiator: { role, id: caller.did },
        entryId: null,
        categories: [],
        purpose: null,
        grantId: grant.grantId,
        data: {},
    });
    return toGrant({ ...grant, status: 'revoked', statusChangedAt: at });
};
