import { z } from 'zod';
import type { Boost, BoostPermissions, UnsignedVC } from '@learncard/types';
import type { ConsumerWallet } from './consumer-apps';
import { httpsURL } from './consumer-apps';

export interface FamilyPinService {
    hasPin(): Promise<boolean>;
    createPin(pin: string): Promise<boolean>;
    verifyPin(pin: string): Promise<boolean>;
}

type Failure = 'connection' | 'unavailable' | 'permission' | 'pin' | 'changed' | 'decision';
export class FamilyFailure extends Error {
    constructor(readonly kind: Failure) {
        super(`family:${kind}`);
    }
}
export const familyErrorCode = (error: unknown): string => {
    if (error instanceof FamilyFailure) return error.message;
    if (error instanceof z.ZodError) return 'family:decision';
    const code = (error as { data?: { code?: string } } | undefined)?.data?.code;
    return code === 'FORBIDDEN'
        ? 'family:permission'
        : code === 'CONFLICT'
          ? 'family:changed'
          : 'family:connection';
};

const record = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
// LearnCard Colorful theme category tokens, not the Formal variant.
const palette = {
    amber: '#FBBF24',
    mint: '#34D399',
    blue: '#93C5FD',
    lilac: '#C4B5FD',
    pink: '#F9A8D4',
} as const;
const legacyPalette = {
    mint: '#69DDD0',
    blue: '#83B9FA',
    lilac: '#BAA0F3',
    pink: '#EF9AC8',
} as const;
const id = z.string().min(1).max(8192);
const pin = z.string().regex(/^[0-9]{5}$/);
const fields = z.object({
    name: z.string().trim().min(1).max(100),
    motto: z.string().trim().max(500),
    color: z.enum(['amber', 'mint', 'blue', 'lilac', 'pink']),
    changeColor: z.boolean().default(false),
});
const createInput = fields
    .extend({ requestID: z.string().uuid(), pin, confirmPin: z.string() })
    .strict();
const editInput = fields.extend({ id }).strict();
const inviteInput = z
    .object({ id, recipient: z.string().min(1).max(100), requestID: z.string().uuid(), pin })
    .strict();
type FamilyBoost = Boost & { boost: UnsignedVC };

/// Full pagination is deliberate: family membership must not depend on the first collection page.
const pages = async <T>(
    read: (cursor?: string) => Promise<{ records: T[]; hasMore: boolean; cursor?: string | null }>
): Promise<T[]> => {
    const result: T[] = [],
        seen = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < 100; page++) {
        const value = await read(cursor);
        result.push(...value.records);
        if (!value.hasMore) return result;
        if (!value.cursor || seen.has(value.cursor)) throw new FamilyFailure('connection');
        cursor = value.cursor;
        seen.add(cursor);
    }
    throw new FamilyFailure('connection');
};
const summary = (value: FamilyBoost) => {
    const raw = record(value.boost),
        display = record(raw.display),
        subject = record(
            Array.isArray(raw.credentialSubject) ? raw.credentialSubject[0] : raw.credentialSubject
        );
    const achievement = record(subject.achievement);
    return {
        id: value.uri,
        title: text(value.name) || text(raw.name),
        motto: text(achievement.description),
        color:
            [...Object.entries(palette), ...Object.entries(legacyPalette)].find(
                ([, hex]) => hex.toLowerCase() === text(display.backgroundColor).toLowerCase()
            )?.[0] ?? 'amber',
        artworkURL: httpsURL(text(record(raw.image).id) || text(raw.image))?.href,
    };
};
const member = (
    value: {
        did?: string;
        id?: string;
        profileId?: string;
        displayName?: string;
        image?: string;
        bio?: string;
        shortBio?: string;
    },
    role: 'guardian' | 'child'
) => ({
    id: value.profileId || value.id || value.did!,
    name: value.displayName || value.profileId || '',
    imageURL: httpsURL(value.image)?.href,
    bio: value.shortBio || value.bio || '',
    role,
    // A child row is a profile-manager descriptor. It is NOT an independently signed-in account.
    ...(role === 'guardian' && { profileID: value.profileId }),
});
const guardianClaim = (value?: BoostPermissions) =>
    value?.canManagePermissions === true &&
    value.canManageChildrenProfiles === true &&
    value.canIssue === true;
const guardianPermissions: BoostPermissions = {
    role: 'Guardian',
    canView: true,
    canEdit: true,
    canIssue: true,
    canRevoke: true,
    canManagePermissions: true,
    canIssueChildren: '*',
    canCreateChildren: '*',
    canEditChildren: '*',
    canRevokeChildren: '*',
    canManageChildrenPermissions: '*',
    canManageChildrenProfiles: true,
    canViewAnalytics: true,
};

/** Native Families uses the web's Family Boost, ADD_ADMIN claim hook and personal index contracts.
 * No child wallet is constructed here; descriptor rows never imply custody of a child's keys.
 */
export const createFamilyCommands = (
    getWallet: () => ConsumerWallet | undefined,
    getPins: (wallet: ConsumerWallet) => Promise<FamilyPinService>
) => {
    const known = new Set<string>();
    let knownWallet: ConsumerWallet | undefined;
    const uncertainCreations = new WeakMap<ConsumerWallet, Set<string>>();
    const wallet = () => {
        const value = getWallet();
        if (!value) throw new FamilyFailure('unavailable');
        return value;
    };
    const current = (value: ConsumerWallet) => {
        if (getWallet() !== value) throw new FamilyFailure('unavailable');
    };
    const list = async () => {
        const lc = wallet();
        const getPage = lc.index.LearnCloud.getPage;
        if (!getPage) throw new FamilyFailure('unavailable');
        const own = await pages(cursor =>
            lc.invoke.getPaginatedBoosts({ limit: 50, cursor, query: { category: 'Family' } })
        );
        current(lc);
        const entries = await pages(cursor =>
            getPage({ category: 'Family' }, { limit: 50, cursor })
        );
        current(lc);
        const uris = new Set(own.map(value => value.uri));
        for (const item of entries) {
            const credential = record(await lc.read.get(item.uri));
            current(lc);
            const boost = text(credential.boostId);
            if (boost) uris.add(boost);
        }
        const result = [];
        for (const uri of uris) {
            const value = await lc.invoke.getBoost(uri);
            current(lc);
            if (value.category !== 'Family') continue;
            result.push(summary(value));
        }
        known.clear();
        knownWallet = lc;
        result.forEach(value => known.add(value.id));
        return result.sort((a, b) => a.title.localeCompare(b.title));
    };
    const family = async (uri: string) => {
        const lc = wallet();
        if (knownWallet !== lc || !known.has(uri)) await list();
        current(lc);
        if (!known.has(uri)) throw new FamilyFailure('unavailable');
        const value = await lc.invoke.getBoost(uri);
        current(lc);
        if (value.category !== 'Family') throw new FamilyFailure('unavailable');
        const permissions = await lc.invoke.getBoostPermissions(uri);
        current(lc);
        return { lc, value, permissions };
    };
    const detail = async (uri: string) => {
        const { lc, value, permissions } = await family(uri);
        const guardians = await pages(cursor =>
            lc.invoke.getBoostAdmins(uri, { limit: 50, cursor, includeSelf: true })
        );
        current(lc);
        const children = await pages(cursor =>
            lc.invoke.getBoostChildrenProfileManagers(uri, { limit: 50, cursor })
        );
        current(lc);
        return {
            ...summary(value),
            guardians: guardians.map(item => member(item, 'guardian')),
            children: children.map(item => member(item, 'child')),
            canEdit: permissions.canEdit,
            canInvite:
                permissions.canManagePermissions &&
                permissions.canIssue &&
                guardianClaim(value.claimPermissions),
        };
    };
    const approvePin = async (lc: ConsumerWallet, value: string, confirmation?: string) => {
        const api = await getPins(lc);
        current(lc);
        if (await api.hasPin()) {
            current(lc);
            try {
                if (!(await api.verifyPin(value))) throw new FamilyFailure('pin');
            } catch (error) {
                if (
                    error instanceof FamilyFailure ||
                    (error as { data?: { code?: string } })?.data?.code === 'INTERNAL_SERVER_ERROR'
                )
                    throw new FamilyFailure('pin');
                throw new FamilyFailure('connection');
            }
        } else {
            current(lc);
            if (value !== confirmation) throw new FamilyFailure('decision');
            if (!(await api.createPin(value))) throw new FamilyFailure('connection');
        }
        current(lc);
    };
    const hook = async (lc: ConsumerWallet, uri: string) => {
        const values = await pages(cursor =>
            lc.invoke.getClaimHooksForBoost({ uri, limit: 50, cursor })
        );
        current(lc);
        if (
            values.some(
                value =>
                    value.type === 'ADD_ADMIN' &&
                    value.data.claimUri === uri &&
                    value.data.targetUri === uri
            )
        )
            return;
        await lc.invoke.createClaimHook({
            type: 'ADD_ADMIN',
            data: { claimUri: uri, targetUri: uri },
        });
        current(lc);
    };
    return {
        familiesList: list,
        familiesDetail: async (input: unknown) => detail(z.object({ id }).strict().parse(input).id),
        familiesPinStatus: async () => {
            const lc = wallet();
            const api = await getPins(lc);
            current(lc);
            const hasPin = await api.hasPin();
            current(lc);
            return { hasPin };
        },
        familiesCreate: async (input: unknown) => {
            const value = createInput.parse(input),
                lc = wallet();
            await approvePin(lc, value.pin, value.confirmPin);
            const fingerprint = JSON.stringify({
                name: value.name,
                motto: value.motto,
                color: value.color,
            });
            // Server metadata recovers a template when its creation reply was lost. PINs are never stored in metadata.
            const previous = await pages(cursor =>
                lc.invoke.getPaginatedBoosts({
                    limit: 50,
                    cursor,
                    query: { category: 'Family', meta: { nativeFamilyRequestID: value.requestID } },
                })
            );
            current(lc);
            let uri: string;
            if (previous.length) {
                if (
                    previous.length !== 1 ||
                    previous[0].meta?.nativeFamilyFingerprint !== fingerprint
                )
                    throw new FamilyFailure('changed');
                uri = previous[0].uri;
            } else {
                // A failed request may still be committing. Do not issue a second create when it cannot be confirmed.
                if (uncertainCreations.get(lc)?.has(value.requestID))
                    throw new FamilyFailure('changed');
                const credential = lc.invoke.newCredential({
                    type: 'boost',
                    subject: lc.id.did(),
                    boostName: value.name,
                    achievementName: value.name,
                    achievementType: 'Family',
                    achievementDescription: value.motto,
                    achievementNarrative: value.motto,
                    display: {
                        displayType: 'badge',
                        backgroundColor: palette[value.color],
                        emoji: {
                            activeSkinTone: '',
                            unified: '',
                            unifiedWithoutSkinTone: '',
                            names: [],
                            imageUrl: '',
                        },
                    },
                    familyTitles: {
                        guardians: [{ singular: 'Guardian', plural: 'Guardians' }],
                        dependents: [{ singular: 'Child', plural: 'Children' }],
                    },
                });
                // The web family renderer uses "family"; the generic template's display union omits it.
                record(credential.display).displayType = 'family';
                try {
                    uri = await lc.invoke.createBoost(credential, {
                        name: value.name,
                        type: 'Family',
                        category: 'Family',
                        status: 'LIVE',
                        claimPermissions: guardianPermissions,
                        meta: {
                            nativeFamilyRequestID: value.requestID,
                            nativeFamilyFingerprint: fingerprint,
                        },
                    });
                    current(lc);
                } catch (error) {
                    const uncertain = uncertainCreations.get(lc) ?? new Set<string>();
                    uncertain.add(value.requestID);
                    uncertainCreations.set(lc, uncertain);
                    throw error;
                }
            }
            if (knownWallet !== lc) {
                known.clear();
                knownWallet = lc;
            }
            known.add(uri);
            await hook(lc, uri);
            // Managed-refresh send receipts make retrying the self-issuance safe after an ambiguous network reply.
            const delivery = await lc.invoke.send({
                type: 'boost',
                recipient: lc.id.did(),
                templateUri: uri,
                refresh: true,
                idempotencyKey: `native-family:${value.requestID}`,
            });
            current(lc);
            if (!delivery.credentialUri) throw new FamilyFailure('connection');
            await lc.invoke.acceptCredential(delivery.credentialUri, { skipNotification: true });
            current(lc);
            const entryID = `native-family:${value.requestID}`;
            const indexed = await lc.index.LearnCloud.get({ id: entryID });
            current(lc);
            if (!indexed.length) {
                const issued = await lc.read.get(delivery.credentialUri);
                current(lc);
                if (!issued || !lc.store.LearnCloud.uploadEncrypted)
                    throw new FamilyFailure('unavailable');
                const stored = await lc.store.LearnCloud.uploadEncrypted(issued);
                current(lc);
                await lc.index.LearnCloud.add({
                    id: entryID,
                    uri: stored,
                    title: value.name,
                    category: 'Family',
                });
                current(lc);
            }
            return detail(uri);
        },
        familiesEdit: async (input: unknown) => {
            const value = editInput.parse(input),
                { lc, value: original, permissions } = await family(value.id);
            if (!permissions.canEdit) throw new FamilyFailure('permission');
            const raw = structuredClone(original.boost),
                rawObject = raw as unknown as Record<string, unknown>;
            delete rawObject.proof; // Editing an unsigned issuance template must not retain a stale legacy signature.
            rawObject.name = value.name;
            if (value.changeColor)
                rawObject.display = {
                    ...record(rawObject.display),
                    backgroundColor: palette[value.color],
                };
            const subject = record(
                Array.isArray(rawObject.credentialSubject)
                    ? rawObject.credentialSubject[0]
                    : rawObject.credentialSubject
            );
            subject.achievement = {
                ...record(subject.achievement),
                name: value.name,
                description: value.motto,
            };
            // Preserve unrelated template fields; this updates future family credentials, never a signed original.
            if (!(await lc.invoke.updateBoost(value.id, { name: value.name }, raw)))
                throw new FamilyFailure('connection');
            current(lc);
            return detail(value.id);
        },
        familiesInvite: async (input: unknown) => {
            const value = inviteInput.parse(input),
                { lc, value: boost, permissions } = await family(value.id);
            if (
                !permissions.canManagePermissions ||
                !permissions.canIssue ||
                !guardianClaim(boost.claimPermissions)
            )
                throw new FamilyFailure('permission');
            const target = await lc.invoke.getProfile(value.recipient),
                me = await lc.invoke.getProfile();
            current(lc);
            if (!target || target.profileId === me?.profileId) throw new FamilyFailure('decision');
            const existing = await pages(cursor =>
                lc.invoke.getBoostAdmins(value.id, { limit: 50, cursor, includeSelf: true })
            );
            current(lc);
            if (existing.some(item => item.profileId === target.profileId))
                throw new FamilyFailure('decision');
            await approvePin(lc, value.pin);
            await hook(lc, value.id);
            // Re-read after PIN/hook network awaits: do not invite against a policy that changed during review.
            const latest = await lc.invoke.getBoost(value.id),
                latestPermissions = await lc.invoke.getBoostPermissions(value.id);
            current(lc);
            if (
                latest.category !== 'Family' ||
                !latestPermissions.canManagePermissions ||
                !latestPermissions.canIssue ||
                !guardianClaim(latest.claimPermissions)
            )
                throw new FamilyFailure('changed');
            // Do not grant access before acceptance. ADD_ADMIN runs when the recipient claims.
            const result = await lc.invoke.send({
                type: 'boost',
                recipient: target.profileId,
                templateUri: value.id,
                refresh: true,
                idempotencyKey: `native-family-invite:${value.requestID}`,
            });
            current(lc);
            if (!result.credentialUri) throw new FamilyFailure('connection');
            return true;
        },
    };
};
