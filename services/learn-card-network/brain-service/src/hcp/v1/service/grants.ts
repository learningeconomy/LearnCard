/**
 * Grants (Draft 3 §6.1.5, §6.2). Issuing and listing are governance operations for
 * the Context Subject. Reading and revoking one grant are open to the subject and to
 * the grant's own client: the client's forms are "read own grant" (§5.2.6) and
 * "relinquish own grant" (§5.2.7).
 */
import { requireSubject, settleGrantExpiry } from '../auth';
import type { StoredGrant } from '../store/port';
import { scopesForAccess } from '../scopes';
import {
    orderCategories,
    type AccessDetail,
    type ContractGrantInput,
    type ContractOffer,
    type CreateGrantInput,
    type DirectGrantInput,
    type Grant,
    type GrantStatus,
} from '../schemas';
import { contractAccess, DURATION_MS, earlier, effectiveGrant, usableContract } from './contracts';
import { urn, type HcpV1Caller, type HcpV1Deps } from './deps';
import { contractChanged, malformed, scopeDenied } from './errors';

const HOUR_MS = 60 * 60 * 1000;
/** Draft 3 §6.1.3. */
export const TEMPORARY_GRANT_DEFAULT_MS = 4 * HOUR_MS;
export const TEMPORARY_GRANT_MAX_MS = 24 * HOUR_MS;

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

export const normalizeAccess = (access: AccessDetail[]): AccessDetail[] =>
    access.map(detail => ({
        type: detail.type,
        actions: detail.actions,
        categories: orderCategories(detail.categories),
        purposes: detail.purposes.filter(
            (purpose, index, all) => all.findIndex(p => p.code === purpose.code) === index
        ),
    }));

export const toGrant = (grant: StoredGrant): Grant => ({
    grantId: grant.grantId,
    subject: { id: grant.subjectDid },
    authorizingPrincipal: { id: grant.subjectDid },
    client: grant.client,
    access: grant.access,
    scopes: scopesForAccess(grant.access),
    grantType: grant.grantType,
    issuedAt: grant.issuedAt,
    expiresAt: grant.expiresAt,
    status: grant.status,
    source: grant.source,
    canWrite: grant.canWrite === true,
});

const expiryFor = (input: DirectGrantInput, now: Date): string | null => {
    if ((input.grantType ?? 'temporary') === 'persistent') {
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

type GrantTerms = Pick<
    StoredGrant,
    'client' | 'access' | 'grantType' | 'expiresAt' | 'source' | 'canWrite'
>;

const directTerms = (input: DirectGrantInput, now: Date): GrantTerms => ({
    client: input.client,
    access: normalizeAccess(input.access),
    grantType: input.grantType ?? 'temporary',
    expiresAt: expiryFor(input, now),
    source: input.source,
    // LC-2423: direct write needs both the subject's say-so and a write action.
    canWrite:
        input.canWrite === true && input.access.some(detail => detail.actions.includes('write')),
});

const NO_HCP_OFFER = 'The contract does not offer HCP access.';

/**
 * LC-2421: the grant a contract's HCP section gives the named client. Access,
 * duration and the client's name come from the contract, never from the request;
 * the request only says which agent and which version the person reviewed.
 */
const contractTerms = async (
    deps: HcpV1Deps,
    input: ContractGrantInput,
    now: Date
): Promise<GrantTerms> => {
    const contract = usableContract(await deps.contracts.current(input.source.contractUri), now);
    const access = contract && contractAccess(contract.hcp);
    if (!contract || !access) throw malformed(NO_HCP_OFFER);
    if (contract.version !== input.source.contractVersion) throw contractChanged();
    if (!contract.hcp.agents.includes(input.client.id))
        throw malformed('The contract does not name this client.');

    const ms = DURATION_MS[contract.hcp.duration];
    return {
        client: { id: input.client.id, name: contract.name },
        access: normalizeAccess(access),
        grantType: ms === null ? 'persistent' : 'temporary',
        // Capped by the contract's expiry. A persistent grant has none (Draft 3 §6.1.5);
        // the contract's expiry still ends its access when it passes.
        expiresAt:
            ms === null
                ? null
                : earlier(new Date(now.getTime() + ms).toISOString(), contract.expiresAt),
        source: {
            type: 'consentflow',
            contractUri: contract.uri,
            contractVersion: contract.version,
        },
        // Contract HCP sections are read-only (LC-2421), so contract grants never write.
        canWrite: false,
    };
};

const termsFor = async (
    deps: HcpV1Deps,
    input: CreateGrantInput,
    now: Date
): Promise<GrantTerms> => {
    const { source, client, access } = input;
    if (source.type === 'consentflow') return contractTerms(deps, { ...input, source }, now);
    // The schema requires both for direct grants; this narrows the type.
    if (!client.name || !access) throw malformed('A direct grant names its client and access.');
    return directTerms(
        { ...input, client: { id: client.id, name: client.name }, access, source },
        now
    );
};

export const createGrant = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: CreateGrantInput
): Promise<Grant> => {
    const subjectDid = requireSubject(caller);
    const now = deps.now();
    const terms = await termsFor(deps, input, now);

    const issuedAt = now.toISOString();
    const grant: StoredGrant = {
        grantId: urn(deps.newId()),
        subjectDid,
        ...terms,
        issuedAt,
        status: 'active',
        statusChangedAt: null,
    };

    await deps.store.insertGrant(grant, {
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
            canWrite: grant.canWrite === true,
        },
    });
    if (grant.source.type === 'consentflow') await supersede(deps, caller, grant);
    return toGrant(grant);
};

/**
 * Allowing a contract again replaces the subject's earlier grants to the same client
 * under the same contract: they are revoked, naming the grant that replaced them.
 */
const supersede = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    replacement: StoredGrant
): Promise<void> => {
    const { source } = replacement;
    if (source.type !== 'consentflow') return;
    const earlierGrants = (await deps.store.listGrants(replacement.subjectDid, 'active')).filter(
        grant =>
            grant.grantId !== replacement.grantId &&
            grant.client.id === replacement.client.id &&
            grant.source.type === 'consentflow' &&
            grant.source.contractUri === source.contractUri
    );
    for (const grant of earlierGrants) {
        const at = deps.now().toISOString();
        await deps.store.transitionGrantStatus(grant.grantId, 'revoked', at, {
            eventId: urn(deps.newId()),
            eventType: 'grant.revoked',
            timestamp: at,
            subjectDid: grant.subjectDid,
            providerId: deps.providerId,
            initiator: { role: 'management-client', id: caller.did },
            entryId: null,
            categories: [],
            purpose: null,
            grantId: grant.grantId,
            data: { reason: 'superseded', supersededBy: replacement.grantId },
        });
    }
};

/**
 * LearnCard addition (LC-2421): what allowing a contract's agents would grant, for
 * the consent screen. Context Subject only.
 */
export const getContractOffer = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    contractUri: string
): Promise<ContractOffer> => {
    requireSubject(caller);
    const contract = usableContract(await deps.contracts.current(contractUri), deps.now());
    const access = contract && contractAccess(contract.hcp);
    if (!contract || !access) throw malformed(NO_HCP_OFFER);
    return {
        contractUri: contract.uri,
        version: contract.version,
        name: contract.name,
        owner: contract.owner,
        agents: contract.hcp.agents,
        access: normalizeAccess(access),
        duration: contract.hcp.duration,
        expiresAt: contract.expiresAt,
    };
};

/** The grant as it stands now: narrowed by its contract (LC-2421), expiry settled. */
const asItStands = async (deps: HcpV1Deps, grant: StoredGrant): Promise<StoredGrant> =>
    settleGrantExpiry(deps, await effectiveGrant(deps, grant));

/** Lists the subject's grants by status, settling any that lapsed (default `active`). */
export const listGrants = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    status: GrantStatus
): Promise<Grant[]> => {
    const subjectDid = requireSubject(caller);
    if (status !== 'active') return (await deps.store.listGrants(subjectDid, status)).map(toGrant);

    const settled = await Promise.all(
        (await deps.store.listGrants(subjectDid, 'active')).map(async grant =>
            asItStands(deps, grant)
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
        return { grant: await asItStands(deps, stored), role: 'management-client' };
    if (stored.client.id === caller.did)
        return { grant: await asItStands(deps, stored), role: 'context-client' };
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
    const changed = await deps.store.transitionGrantStatus(grant.grantId, 'revoked', at, {
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
    if (!changed) {
        const current = await deps.store.getGrant(grant.grantId);
        return toGrant(current ?? grant);
    }
    return toGrant({ ...grant, status: 'revoked', statusChangedAt: at });
};
