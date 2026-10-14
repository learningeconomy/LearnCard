import { expect, test } from 'bun:test';
import { initLearnCard } from '@learncard/init';
import type { UnsignedVC } from '@learncard/types';
import type { ConsumerWallet } from './consumer-apps';
import { createFamilyCommands, FamilyFailure, type FamilyPinService } from './families';
import { isFamilyCreation, sendPersonalCreation } from './personal-creations';

const familyURI = 'lc:network:staging.network.learncard.com/trpc:boost:family-fixture';
const requestID = '11111111-1111-4111-8111-111111111111';
const full = {
    role: 'Guardian',
    canEdit: true,
    canIssue: true,
    canManagePermissions: true,
    canManageChildrenProfiles: true,
};
interface FixtureCredential {
    name?: string;
    type?: string[];
    issuer?: string;
    credentialSubject: { id?: string; achievement: { name?: string; description?: string } };
    display: { backgroundColor?: string; backgroundImage?: string; displayType?: string };
    familyTitles?: {
        guardians: { singular: string; plural: string }[];
        dependents: { singular: string; plural: string }[];
    };
    proof?: { proofValue: string };
    untouched?: string;
}
interface FixtureBoost {
    uri: string;
    name: string;
    category: string;
    claimPermissions: typeof full;
    boost: FixtureCredential;
    meta?: Record<string, string>;
}
type CreateMetadata = Omit<FixtureBoost, 'uri' | 'boost'>;
type Delivery = {
    type: string;
    recipient: string;
    templateUri: string;
    refresh?: boolean;
    idempotencyKey?: string;
};
type Hook = { type: string; data: { claimUri: string; targetUri: string } };
type IndexEntry = { id: string; uri: string; title: string; category: string };
type PageInput = { cursor?: string };
const fixture = () => {
    const boosts = new Map<string, FixtureBoost>([
        [
            familyURI,
            {
                uri: familyURI,
                name: 'Our family',
                category: 'Family',
                claimPermissions: { ...full },
                boost: {
                    name: 'Our family',
                    type: ['VerifiableCredential'],
                    credentialSubject: {
                        achievement: { name: 'Our family', description: 'Growing together' },
                    },
                    display: { backgroundColor: '#69DDD0' },
                    untouched: 'keep',
                },
            },
        ],
    ]);
    const indexed: IndexEntry[] = [],
        sent: Delivery[] = [],
        hooks: Hook[] = [];
    const creates: { credential: FixtureCredential; metadata: CreateMetadata }[] = [],
        updates: { uri: string; metadata: { name: string }; credential: FixtureCredential }[] = [];
    const boost = (uri = familyURI): FixtureBoost => {
        const value = boosts.get(uri);
        if (!value) throw new Error('Unavailable fixture');
        return value;
    };
    let permissions = { ...full },
        lostCreateReply = false;
    const pins: FamilyPinService = {
        hasPin: async () => true,
        verifyPin: async value => value === '12345',
        createPin: async () => {
            throw new Error('Unexpected PIN creation');
        },
    };
    const lc = {
        id: { did: () => 'did:web:staging.network.learncard.com:users:me' },
        invoke: {
            getPaginatedBoosts: async (input: { query?: { meta?: Record<string, string> } }) => ({
                records: [...boosts.values()].filter(
                    item =>
                        !input.query?.meta ||
                        item.meta?.nativeFamilyRequestID === input.query.meta.nativeFamilyRequestID
                ),
                hasMore: false,
            }),
            getBoost: async (uri: string) => boost(uri),
            getBoostPermissions: async () => permissions,
            getBoostAdmins: async (_uri: string, input: PageInput) =>
                input.cursor
                    ? {
                          records: [{ profileId: 'guardian-two', displayName: 'Second guardian' }],
                          hasMore: false,
                      }
                    : {
                          records: [{ profileId: 'me', displayName: 'Me' }],
                          hasMore: true,
                          cursor: 'next-guardian',
                      },
            getBoostChildrenProfileManagers: async (_uri: string, input: PageInput) =>
                input.cursor
                    ? {
                          records: [
                              {
                                  id: 'manager-two',
                                  did: 'did:web:manager-two',
                                  displayName: 'Child two',
                                  shortBio: 'Learning',
                              },
                          ],
                          hasMore: false,
                      }
                    : {
                          records: [
                              {
                                  id: 'manager-one',
                                  did: 'did:web:manager-one',
                                  displayName: 'Child one',
                              },
                          ],
                          hasMore: true,
                          cursor: 'next-child',
                      },
            getProfile: async (id?: string) => ({ profileId: id || 'me', displayName: id || 'Me' }),
            getClaimHooksForBoost: async () => ({ records: hooks, hasMore: false }),
            createClaimHook: async (value: Hook) => {
                hooks.push(value);
                return 'hook';
            },
            send: async (value: Delivery) => {
                sent.push(value);
                return { type: 'boost', credentialUri: 'signed-family' };
            },
            acceptCredential: async () => true,
            newCredential: (value: {
                boostName: string;
                achievementName: string;
                achievementDescription: string;
                display: FixtureCredential['display'];
                familyTitles: FixtureCredential['familyTitles'];
            }) => ({
                name: value.boostName,
                type: ['VerifiableCredential'],
                credentialSubject: {
                    achievement: {
                        name: value.achievementName,
                        description: value.achievementDescription,
                    },
                },
                display: value.display,
                familyTitles: value.familyTitles,
            }),
            createBoost: async (credential: FixtureCredential, metadata: CreateMetadata) => {
                creates.push({ credential, metadata });
                const uri = 'created-family';
                boosts.set(uri, { ...metadata, uri, boost: credential });
                if (lostCreateReply) {
                    lostCreateReply = false;
                    throw new Error('Reply lost');
                }
                return uri;
            },
            updateBoost: async (
                uri: string,
                metadata: { name: string },
                credential: FixtureCredential
            ) => {
                updates.push({ uri, metadata, credential });
                boosts.set(uri, { ...boost(uri), ...metadata, boost: credential });
                return true;
            },
        },
        index: {
            LearnCloud: {
                getPage: async () => ({ records: [], hasMore: false }),
                get: async () => indexed,
                add: async (value: IndexEntry) => {
                    indexed.push(value);
                },
            },
        },
        read: {
            get: async () => ({ boostId: familyURI, proof: { proofValue: 'original-signature' } }),
        },
        store: { LearnCloud: { uploadEncrypted: async () => 'encrypted-family' } },
    } as unknown as ConsumerWallet;
    const commands = createFamilyCommands(
        () => lc,
        async () => pins
    );
    return {
        lc,
        commands,
        boosts,
        boost,
        indexed,
        sent,
        hooks,
        creates,
        updates,
        pins,
        deny: () => {
            permissions = { ...permissions, canEdit: false, canManagePermissions: false };
        },
        loseCreateReply: () => {
            lostCreateReply = true;
        },
    };
};

test('family roster reads all guardian/child pages without implying child account custody', async () => {
    const f = fixture();
    const result = await f.commands.familiesDetail({ id: familyURI });
    expect(result.guardians.map(value => value.id)).toEqual(['me', 'guardian-two']);
    expect(result.children.map(value => value.id)).toEqual(['manager-one', 'manager-two']);
    expect(result.children[0]).not.toHaveProperty('profileID');
    expect(result).not.toHaveProperty('canSwitch');
});

test('foreign templates and revoked edit permissions are refused before mutation', async () => {
    const f = fixture();
    await expect(f.commands.familiesDetail({ id: 'foreign-template' })).rejects.toMatchObject({
        kind: 'unavailable',
    });
    f.deny();
    await expect(
        f.commands.familiesEdit({ id: familyURI, name: 'Changed', motto: '', color: 'blue' })
    ).rejects.toMatchObject({ kind: 'permission' });
    expect(f.updates).toHaveLength(0);
});

test('family edit preserves unrelated template data and does not rewrite an issued credential', async () => {
    const f = fixture();
    const original = structuredClone(f.boost().boost);
    const result = await f.commands.familiesEdit({
        id: familyURI,
        name: 'Renamed',
        motto: 'New motto',
        color: 'lilac',
        changeColor: true,
    });
    expect(result.title).toBe('Renamed');
    expect(result.motto).toBe('New motto');
    expect(result.color).toBe('lilac');
    expect(f.updates[0].credential.untouched).toBe('keep');
    expect(original.name).toBe('Our family');
    expect(f.sent).toHaveLength(0);
});

test('renaming an existing family preserves custom artwork/appearance and removes only template proof', async () => {
    const f = fixture(),
        original = f.boost().boost;
    original.display = {
        backgroundColor: '#123456',
        backgroundImage: 'https://example.org/family.png',
        displayType: 'family',
    };
    original.proof = { proofValue: 'legacy-template-proof' };
    await f.commands.familiesEdit({
        id: familyURI,
        name: 'Renamed',
        motto: 'Same appearance',
        color: 'mint',
    });
    expect(f.updates[0].credential.display).toEqual(original.display);
    expect(f.updates[0].credential).not.toHaveProperty('proof');
    expect(original.proof.proofValue).toBe('legacy-template-proof');
});

test('family memberships on later encrypted-index pages are loaded and deduplicated', async () => {
    const f = fixture();
    let reads = 0;
    f.lc.invoke.getPaginatedBoosts = async () => ({ records: [], hasMore: false });
    f.lc.index.LearnCloud.getPage = (async (query: { category: string }, options: PageInput) => {
        expect(query.category).toBe('Family');
        reads++;
        return options.cursor
            ? {
                  records: [{ uri: 'family-membership-a' }, { uri: 'family-membership-b' }],
                  hasMore: false,
              }
            : { records: [], hasMore: true, cursor: 'later-family-page' };
    }) as typeof f.lc.index.LearnCloud.getPage;
    const values = await f.commands.familiesList();
    expect(values).toHaveLength(1);
    expect(values[0].id).toBe(familyURI);
    expect(reads).toBe(2);
});

test('an ambiguous unconfirmed creation is not blindly repeated', async () => {
    const f = fixture();
    let attempts = 0;
    f.lc.invoke.createBoost = async () => {
        attempts++;
        throw new Error('Connection lost before receipt');
    };
    const input = {
        requestID,
        name: 'Family',
        motto: '',
        color: 'mint',
        pin: '12345',
        confirmPin: '',
    };
    await expect(f.commands.familiesCreate(input)).rejects.toThrow();
    await expect(f.commands.familiesCreate(input)).rejects.toMatchObject({ kind: 'changed' });
    expect(attempts).toBe(1);
});

test('guardian invitation needs PIN and family permissions and grants access only on claim', async () => {
    const f = fixture();
    await expect(
        f.commands.familiesInvite({
            id: familyURI,
            recipient: 'new-guardian',
            requestID,
            pin: '00000',
        })
    ).rejects.toMatchObject({ kind: 'pin' });
    expect(f.sent).toHaveLength(0);
    expect(f.hooks).toHaveLength(0);
    await f.commands.familiesInvite({
        id: familyURI,
        recipient: 'new-guardian',
        requestID,
        pin: '12345',
    });
    expect(f.hooks).toEqual([
        { type: 'ADD_ADMIN', data: { claimUri: familyURI, targetUri: familyURI } },
    ]);
    expect(f.sent[0]).toMatchObject({
        recipient: 'new-guardian',
        templateUri: familyURI,
        refresh: true,
        idempotencyKey: `native-family-invite:${requestID}`,
    });
    expect((await f.commands.familiesDetail({ id: familyURI })).guardians).toHaveLength(2);
    f.deny();
    await expect(
        f.commands.familiesInvite({ id: familyURI, recipient: 'someone', requestID, pin: '12345' })
    ).rejects.toMatchObject({ kind: 'permission' });
    expect(f.sent).toHaveLength(1);
});

test('existing family invitation does not rewrite a restricted claim policy', async () => {
    const f = fixture();
    f.boost().claimPermissions.canManageChildrenProfiles = false;
    expect((await f.commands.familiesDetail({ id: familyURI })).canInvite).toBe(false);
    await expect(
        f.commands.familiesInvite({
            id: familyURI,
            recipient: 'new-guardian',
            requestID,
            pin: '12345',
        })
    ).rejects.toMatchObject({ kind: 'permission' });
    expect(f.updates).toHaveLength(0);
    expect(f.hooks).toHaveLength(0);
    expect(f.sent).toHaveLength(0);
});

test('guardian policy changed during PIN verification prevents invitation delivery', async () => {
    const f = fixture();
    f.pins.verifyPin = async () => {
        f.boost().claimPermissions.canManageChildrenProfiles = false;
        return true;
    };
    await expect(
        f.commands.familiesInvite({
            id: familyURI,
            recipient: 'new-guardian',
            requestID,
            pin: '12345',
        })
    ).rejects.toMatchObject({ kind: 'changed' });
    expect(f.sent).toHaveLength(0);
});

test('family references from a previous account are not reused after switching identities', async () => {
    const first = fixture(),
        second = fixture();
    second.boosts.clear();
    let active = first.lc;
    const commands = createFamilyCommands(
        () => active,
        async () => first.pins
    );
    await commands.familiesList();
    active = second.lc;
    await expect(commands.familiesDetail({ id: familyURI })).rejects.toMatchObject({
        kind: 'unavailable',
    });
});

test('creation recovers a lost template reply and reuses durable issuance and index IDs', async () => {
    const f = fixture();
    f.loseCreateReply();
    const input = {
        requestID,
        name: 'New family',
        motto: 'Learning together',
        color: 'blue',
        pin: '12345',
        confirmPin: '',
    };
    await expect(f.commands.familiesCreate(input)).rejects.toThrow('Reply lost');
    const value = await f.commands.familiesCreate(input);
    expect(value.title).toBe('New family');
    await f.commands.familiesCreate(input);
    expect(f.creates).toHaveLength(1);
    expect(f.hooks).toHaveLength(1);
    expect(f.indexed).toHaveLength(1);
    expect(f.sent[0].idempotencyKey).toBe(f.sent[1].idempotencyKey);
    expect(f.creates[0].credential.display.displayType).toBe('family');
    expect(JSON.stringify(f.creates[0].metadata)).not.toContain('12345');
    await expect(
        f.commands.familiesCreate({ ...input, name: 'Another name' })
    ).rejects.toMatchObject({ kind: 'changed' });
});

test('new PIN confirmation is checked before creating family records', async () => {
    const f = fixture();
    f.pins.hasPin = async () => false;
    let pinCreated = false;
    f.pins.createPin = async () => {
        pinCreated = true;
        return true;
    };
    await expect(
        f.commands.familiesCreate({
            requestID,
            name: 'Family',
            motto: '',
            color: 'mint',
            pin: '12345',
            confirmPin: '54321',
        })
    ).rejects.toMatchObject({ kind: 'decision' });
    expect(pinCreated).toBe(false);
    expect(f.creates).toHaveLength(0);
});

test('account disposal during PIN preparation prevents family writes', async () => {
    const f = fixture();
    let live: ConsumerWallet | undefined = f.lc;
    const commands = createFamilyCommands(
        () => live,
        async () => {
            live = undefined;
            return f.pins;
        }
    );
    await expect(
        commands.familiesCreate({
            requestID,
            name: 'Family',
            motto: '',
            color: 'mint',
            pin: '12345',
            confirmPin: '',
        })
    ).rejects.toBeInstanceOf(FamilyFailure);
    expect(f.creates).toHaveLength(0);
    expect(f.sent).toHaveLength(0);
});

test('native family template signs and verifies with the actual SDK and current contexts', async () => {
    const f = fixture(),
        real = await initLearnCard({ seed: '2'.repeat(64) });
    f.lc.invoke.newCredential = real.invoke.newCredential as typeof f.lc.invoke.newCredential;
    await f.commands.familiesCreate({
        requestID,
        name: 'Family',
        motto: 'Learning together',
        color: 'amber',
        pin: '12345',
        confirmPin: '',
    });
    const unsigned = f.creates[0].credential;
    unsigned.issuer = real.id.did();
    unsigned.credentialSubject.id = real.id.did();
    expect(unsigned.display.backgroundColor).toBe('#FBBF24');
    const issued = await real.invoke.issueCredential(unsigned as unknown as UnsignedVC);
    const verified = await real.invoke.verifyCredential(issued, { checks: ['proof'] });
    expect(verified.errors).toHaveLength(0);
    expect((issued as unknown as FixtureCredential).familyTitles?.guardians[0].plural).toBe(
        'Guardians'
    );
});

test('generic send cannot issue family guardian membership or bypass its invitation review', async () => {
    const f = fixture();
    expect(isFamilyCreation(f.boosts.get(familyURI))).toBe(true);
    await expect(
        sendPersonalCreation(f.lc, { uri: familyURI, recipient: 'someone' }, () => true)
    ).rejects.toMatchObject({ kind: 'permission' });
    expect(f.sent).toHaveLength(0);
    expect(f.hooks).toHaveLength(0);
});

test('ordinary creations still send, but stale account replies cannot authorize delivery', async () => {
    const f = fixture(),
        uri = 'ordinary-creation';
    f.boosts.set(uri, {
        uri,
        name: 'Milestone',
        category: 'Achievement',
        claimPermissions: { ...full },
        boost: { credentialSubject: { achievement: {} }, display: {} },
    });
    await sendPersonalCreation(f.lc, { uri, recipient: 'someone' }, () => true);
    expect(f.sent).toHaveLength(1);
    let active = true;
    f.lc.invoke.getBoost = (async () => {
        active = false;
        return f.boost(uri);
    }) as typeof f.lc.invoke.getBoost;
    await expect(
        sendPersonalCreation(f.lc, { uri, recipient: 'another' }, () => active)
    ).rejects.toMatchObject({ kind: 'unavailable' });
    expect(f.sent).toHaveLength(1);
});
