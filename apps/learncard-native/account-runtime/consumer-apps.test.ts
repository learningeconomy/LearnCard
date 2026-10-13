import { describe, expect, test } from 'bun:test';
import {
    ConsentFlowContractDetailsValidator,
    ConsentFlowTermsValidator,
    type AppStoreListing,
} from '@learncard/types';
import {
    appDTO,
    consentDisclosures,
    createConsumerCommands,
    httpsURL,
    materializeSelections,
    type ConsumerWallet,
} from './consumer-apps';
import { partnerMessage } from './consumer-host';

const app: AppStoreListing = {
    listing_id: 'app',
    display_name: 'Real publisher title',
    tagline: 'Learning',
    full_description: 'Publisher prose',
    icon_url: 'https://partner.example/icon.png',
    app_listing_status: 'LISTED',
    launch_type: 'EMBEDDED_IFRAME',
    launch_config_json: JSON.stringify({
        url: 'https://partner.example/play',
        contractUri: 'lc:contract',
        permissions: ['request_identity'],
    }),
};
const contract = () =>
    ConsentFlowContractDetailsValidator.parse({
        uri: 'lc:contract',
        name: 'App agreement',
        createdAt: '2026-10-13T12:00:00Z',
        updatedAt: '2026-10-13T12:00:00Z',
        audienceVersion: 2,
        owner: { did: 'did:example:owner', profileId: 'owner', displayName: 'Publisher' },
        recipients: [
            { did: 'did:example:reader', profileId: 'reader', displayName: 'Co-recipient' },
        ],
        contract: {
            read: {
                credentials: {
                    categories: { Learning: { required: false, defaultEnabled: true } },
                },
                personal: { Name: { required: false } },
            },
            write: {
                credentials: { categories: { Achievement: { required: true } } },
                personal: {},
            },
        },
    });
function fixture() {
    const current = contract();
    let installed = false,
        changedDuringEncryption = false;
    const uploads: { vc: unknown; recipients: string[] }[] = [],
        publications: unknown[] = [],
        updates: unknown[] = [];
    const records = [
        { id: 'record-one', uri: 'lc:one', title: 'First' },
        { id: 'record-two', uri: 'lc:two', title: 'Second' },
    ];
    const wallet = {
        id: { did: () => 'did:example:test' },
        invoke: {
            getPublicAppStoreListing: async () => app,
            getContract: async () => structuredClone(current),
            isAppInstalled: async () => installed,
            installApp: async () => {
                installed = true;
            },
            uninstallApp: async () => {
                installed = false;
            },
            getConsentedContracts: async () => ({
                records: publications.length
                    ? [{ uri: 'lc:terms', contract: current, status: 'live' }]
                    : [],
                hasMore: false,
            }),
            consentToContract: async (_uri: string, value: unknown) => {
                publications.push(value);
            },
            getDidAuthVp: async () => 'synthetic-proof',
            getProfile: async () => ({
                profileId: 'test',
                email: 'not-exported@example.invalid',
                dob: 'private',
                displayName: 'Test',
            }),
            sendAppEvent: async () => ({ success: true }),
        },
        index: {
            LearnCloud: {
                getPage: async () => ({ records, hasMore: false }),
                update: async (_id: string, value: unknown) => {
                    updates.push(value);
                },
            },
        },
        read: {
            get: async (uri: string) => ({
                id: uri,
                proof: { type: 'SyntheticProof' },
                credentialSubject: { name: uri },
            }),
        },
        store: {
            LearnCloud: {
                uploadEncrypted: async (vc: unknown, { recipients }: { recipients: string[] }) => {
                    uploads.push({ vc, recipients });
                    if (changedDuringEncryption)
                        current.recipients!.push({ did: 'did:example:new', profileId: 'new' });
                    return 'lc:encrypted';
                },
            },
        },
    } as unknown as ConsumerWallet;
    return {
        commands: createConsumerCommands(() => wallet),
        wallet,
        uploads,
        publications,
        updates,
        change: () => {
            current.recipients!.push({ did: 'did:example:new', profileId: 'new' });
        },
        changeDuring: () => {
            changedDuringEncryption = true;
        },
    };
}
async function decision(f: ReturnType<typeof fixture>) {
    const review = (await f.commands.appsReview({ id: 'app' }))!;
    return {
        reviewID: review.id,
        listingID: 'app',
        readCategories: ['Learning'],
        selectedCredentials: { Learning: ['lc:one'] },
        personalValues: {},
        writeCategories: ['Achievement'],
        writePersonal: [],
        anonymize: false,
    };
}

describe('native consumer agreement interoperability', () => {
    test('only explicit credentials are encrypted to the full audience; originals remain intact', async () => {
        const f = fixture();
        const selected = await decision(f);
        await f.commands.appsConsent(selected);
        expect(f.uploads).toEqual([
            {
                vc: {
                    id: 'lc:one',
                    proof: { type: 'SyntheticProof' },
                    credentialSubject: { name: 'lc:one' },
                },
                recipients: ['did:example:owner', 'did:example:reader'],
            },
        ]);
        expect(f.updates).toEqual([
            {
                sharedUris: {
                    'audience:["did:example:owner","did:example:reader"]': ['lc:encrypted'],
                },
            },
        ]);
        expect(f.publications).toMatchObject([
            {
                terms: {
                    read: {
                        credentials: {
                            shareAll: false,
                            categories: {
                                Learning: {
                                    sharing: true,
                                    shareAll: false,
                                    shared: ['lc:encrypted'],
                                },
                            },
                        },
                        personal: {},
                    },
                    write: { credentials: { categories: { Achievement: true } } },
                },
                audienceVersion: 2,
            },
        ]);
        await f.commands.appsInstall({ id: 'app' });
        await expect(f.commands.appsConsent(selected)).rejects.toThrow('consumer:changed');
    });
    test('required access is validated; optional defaultEnabled never grants all credentials', async () => {
        const f = fixture(),
            d = await decision(f);
        await expect(f.commands.appsConsent({ ...d, writeCategories: [] })).rejects.toThrow(
            'consumer:decision'
        );
        await f.commands.appsConsent({ ...d, readCategories: [], selectedCredentials: {} });
        expect(f.uploads).toHaveLength(0);
        expect(f.publications).toMatchObject([
            { terms: { read: { credentials: { categories: {}, shareAll: false } } } },
        ]);
    });
    test('unseen credentials and unlisted categories are refused before encryption', async () => {
        const f = fixture(),
            d = await decision(f);
        for (const patch of [
            { selectedCredentials: { Learning: ['lc:other'] } },
            { readCategories: ['Secret'] },
            { personalValues: { Email: 'private' } },
        ])
            await expect(f.commands.appsConsent({ ...d, ...patch })).rejects.toThrow(
                'consumer:decision'
            );
        expect(f.uploads).toHaveLength(0);
        expect(f.publications).toHaveLength(0);
    });
    test('an audience change before approval or during encryption cannot publish unseen access', async () => {
        const f = fixture(),
            d = await decision(f);
        f.change();
        await expect(f.commands.appsConsent(d)).rejects.toThrow('consumer:changed');
        expect(f.uploads).toHaveLength(0);
        const g = fixture(),
            e = await decision(g);
        g.changeDuring();
        await expect(g.commands.appsConsent(e)).rejects.toThrow('consumer:changed');
        expect(g.publications).toHaveLength(0);
    });
    test('a missing selected record cannot silently become a smaller agreement', async () => {
        const f = fixture();
        await expect(
            materializeSelections(f.wallet, contract(), { Learning: ['lc:missing'] })
        ).rejects.toThrow('consumer:changed');
        expect(f.uploads).toHaveLength(0);
    });
    test('identity is bound to an installed listing origin and omits private profile fields', async () => {
        const f = fixture(),
            d = await decision(f);
        await f.commands.appsConsent(d);
        await f.commands.appsInstall({ id: 'app' });
        await expect(
            f.commands.appsIdentity({ id: 'app', origin: 'https://attacker.example' })
        ).rejects.toThrow('consumer:decision');
        const reply = await f.commands.appsIdentity({
            id: 'app',
            origin: 'https://partner.example',
            challenge: 'challenge',
        });
        expect(reply).toEqual({
            token: 'synthetic-proof',
            user: {
                did: 'did:example:test',
                profile: { profileId: 'test', displayName: 'Test', image: undefined },
            },
            expiresIn: 3600,
        });
        await f.commands.appsRemove({ id: 'app' });
        await expect(
            f.commands.appsIdentity({ id: 'app', origin: 'https://partner.example' })
        ).rejects.toThrow('consumer:unavailable');
        expect(f.publications).toHaveLength(1); // removing an app does not withdraw its agreement
    });
});

test('listing URLs exclude local/plaintext/credentialed endpoints; no fabricated promotion', () => {
    for (const value of [
        'http://partner.example',
        'https://localhost:8888',
        'https://127.0.0.1',
        'https://[::1]',
        'https://user:password@partner.example',
        'https://dev.local',
    ])
        expect(httpsURL(value)).toBeUndefined();
    const dto = appDTO({ ...app, category: null } as unknown as AppStoreListing);
    expect(dto.category).toBe('other');
    expect(dto.featured).toBe(false);
    expect(dto.title).toBe(app.display_name);
});

test('partner messages require both the exact iframe WindowProxy and exact origin', () => {
    const frame = {} as Window,
        data = { protocol: 'LEARNCARD_V1', requestId: 'one', action: 'REQUEST_IDENTITY' };
    const event = (source: unknown, origin: string, value: unknown = data) =>
        ({ source, origin, data: value }) as MessageEvent;
    expect(
        partnerMessage(event(frame, 'https://partner.example'), frame, 'https://partner.example')
    ).toEqual({ ...data, payload: null });
    expect(
        partnerMessage(event({}, 'https://partner.example'), frame, 'https://partner.example')
    ).toBeUndefined();
    expect(
        partnerMessage(
            event(frame, 'https://partner.example.attacker.test'),
            frame,
            'https://partner.example'
        )
    ).toBeUndefined();
    expect(
        partnerMessage(
            event(frame, 'https://partner.example', { ...data, requestId: 'x'.repeat(257) }),
            frame,
            'https://partner.example'
        )
    ).toBeUndefined();
});

test('pending or stopped owner links never export a URL, and pending revocation is not reported complete', async () => {
    const id = 'synthetic-link';
    let state: unknown = { status: 'pending', id, operationId: crypto.randomUUID() };
    let reads = 0;
    const wallet = {
        invoke: {
            getShareLink: async () => state,
            getShareLinkRecovery: async () => {
                reads++;
                throw new Error('Unexpected recovery read');
            },
            revokeShareLink: async () => state,
        },
    } as unknown as ConsumerWallet;
    const commands = createConsumerCommands(() => wallet);
    await expect(commands.privacyLinkURL({ id })).rejects.toThrow('consumer:inactive');
    expect(await commands.privacyStopLink({ id, version: 1 })).toEqual({ complete: false });
    state = {
        status: 'found',
        share: { id, status: 'stopped', contentState: 'finalized', contentVersion: 1 },
    };
    await expect(commands.privacyLinkURL({ id })).rejects.toThrow('consumer:inactive');
    state = {
        status: 'found',
        share: {
            id,
            status: 'active',
            contentState: 'finalized',
            contentVersion: 1,
            expiresAt: '2000-01-01T00:00:00Z',
        },
    };
    await expect(commands.privacyLinkURL({ id })).rejects.toThrow('consumer:inactive');
    expect(reads).toBe(0);
});

test('native consent never promises anonymous sharing of unchanged signed credentials', async () => {
    const f = fixture(),
        d = await decision(f);
    const review = await f.commands.appsReview({ id: 'app' });
    expect(review?.allowsAnonymous).toBe(false);
    await expect(f.commands.appsConsent({ ...d, anonymize: true })).rejects.toThrow(
        'consumer:unsupported'
    );
    expect(f.uploads).toHaveLength(0);
    expect(f.publications).toHaveLength(0);
});

test('sharing scopes respect disabled reads, category expiry and broad selection settings', () => {
    const terms = ConsentFlowTermsValidator.parse({
        read: {
            credentials: {
                categories: {
                    Learning: { sharing: true, shared: ['lc:one'] },
                    Achievement: { sharing: false, shared: ['lc:two'] },
                    ID: { sharing: true, shared: ['lc:old'], shareUntil: '2000-01-01T00:00:00Z' },
                },
            },
        },
    });
    expect(consentDisclosures(terms)).toEqual([
        { id: 'read:Learning', direction: 'read', label: 'Learning', count: 1, detail: 'selected' },
    ]);
    terms.read.credentials.sharing = false;
    expect(consentDisclosures(terms)).toEqual([]);
    terms.read.credentials.sharing = true;
    terms.read.credentials.shareAll = true;
    expect(consentDisclosures(terms)).toEqual([
        { id: 'read:Learning', direction: 'read', label: 'Learning', count: 1, detail: 'all' },
    ]);
});
