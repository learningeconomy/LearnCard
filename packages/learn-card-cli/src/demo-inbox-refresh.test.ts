import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    init: vi.fn(),
    lca: vi.fn(),
    getClient: vi.fn(),
    question: vi.fn(),
    close: vi.fn(),
    log: vi.fn(),
    set: vi.fn(),
    preflight: vi.fn(),
}));

vi.mock('@learncard/init', () => ({ initLearnCard: mocks.init }));
vi.mock('@learncard/lca-api-plugin', () => ({ getLCAPlugin: mocks.lca }));
vi.mock('@learncard/network-brain-client', () => ({ getClient: mocks.getClient }));
vi.mock('@learncard/types', () => ({
    VCValidator: {
        parse: (v: unknown) => v,
        safeParse: (v: unknown) => ({ success: true, data: v }),
    },
}));
vi.mock('node:readline/promises', () => ({
    createInterface: () => ({ question: mocks.question, close: mocks.close }),
}));
vi.mock('./out', () => ({ out: { log: mocks.log, set: mocks.set } }));
vi.mock('./project', () => ({
    resolveServices: (_env: unknown, network: string) => ({
        network,
        cloud: undefined,
        lcaAPI: undefined,
    }),
}));
vi.mock('./demo-refresh-ui', () => ({
    getRefreshDemoUiConfig: mocks.preflight,
    requireLoopbackUrl: (value: unknown, label: string) => {
        const url = new URL(String(value));
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
            url.username ||
            url.password ||
            url.search ||
            url.hash
        )
            throw new Error(`${label} must be an HTTP(S) loopback URL`);
        return url;
    },
}));

import { buildInboxAppLinks, mapInboxClaimPath, runInboxRefreshDemo } from './demo-inbox-refresh';

const RECEIPT = {
    refreshId: 'refresh:demo',
    credentialId: 'urn:uuid:demo',
    issuerDid: 'did:key:sa',
    refreshService: {
        id: 'http://localhost:4000/refresh/demo',
        type: 'LearnCardCredentialRefresh2026',
    },
    credentialStatus: {
        id: 'http://localhost:4000/status/demo',
        type: 'BitstringStatusListEntry',
    },
};
const CLAIM_URL = 'http://localhost:4000/interactions/inbox-claim/token-123?iuv=1';
const FINAL = { id: RECEIPT.credentialId, name: 'Final Course Certificate' };
const HONORS = { id: RECEIPT.credentialId, name: 'Honors Course Certificate' };

type TestReceipt = typeof RECEIPT & { holderDid?: string };
type TestIssue = {
    status: string;
    issuanceId: string;
    claimUrl: string;
    recipient: { type: string; value: string };
    refresh: TestReceipt;
};
type TestCredential = {
    id?: string;
    issuer?: string;
    name?: string;
    boostId?: string;
    refreshService?: unknown;
    credentialStatus?: unknown;
    credentialSubject: { id?: string; [key: string]: unknown };
};
type Published = { credential: TestCredential };

const makeIssuer = (order: string[], published: Published[]) => {
    const issuer = {
        id: { did: () => 'did:key:issuer' },
        addPlugin: vi.fn(),
        invoke: {
            createProfile: vi.fn(async () => undefined),
            createSigningAuthority: vi.fn(async () => ({
                name: 'inbox-demo-sa',
                endpoint: 'http://localhost:5100/api',
                did: 'did:key:sa',
            })),
            registerSigningAuthority: vi.fn(async () => true),
            setPrimaryRegisteredSigningAuthority: vi.fn(async () => true),
            createBoost: vi.fn(async () => 'boost:demo'),
            sendCredentialViaInbox: vi.fn(async (): Promise<TestIssue> => {
                order.push('issue');
                return {
                    status: 'PENDING',
                    issuanceId: 'issuance:demo',
                    claimUrl: CLAIM_URL,
                    recipient: { type: 'email', value: 'inbox-demo-deadbeef@example.com' },
                    refresh: RECEIPT,
                };
            }),
            publishCredentialRefresh: vi.fn(
                async (input: Published): Promise<{ version: number; notification?: string }> => {
                    published.push(input);
                    order.push(`publish-${published.length + 1}`);
                    return published.length === 1
                        ? { version: 2, notification: 'not-applicable' }
                        : { version: 3, notification: 'queued' };
                }
            ),
            getInboxCredential: vi.fn(async () => ({
                refresh: { holderDid: 'did:key:holder' },
            })),
        },
    };
    issuer.addPlugin.mockImplementation(async () => issuer);
    return issuer;
};

const makeHolder = (order: string[], state: { indexCalls: number }) => {
    const holder = {
        id: { did: () => 'did:key:holder' },
        invoke: {
            createProfile: vi.fn(async () => {
                order.push('holderProfile');
            }),
            verifyCredential: vi.fn(async () => ({ checks: ['proof'], errors: [], warnings: [] })),
            acceptCredential: vi.fn(),
            refreshCredential: vi.fn(),
            getDidAuthVp: vi.fn(async () => 'did-auth'),
            resolveDid: vi.fn(async () => undefined),
        },
        index: {
            LearnCloud: {
                get: vi.fn(async () => {
                    state.indexCalls++;
                    return state.indexCalls === 1 ? [] : [{ uri: 'stored:demo' }];
                }),
            },
        },
        read: {
            get: vi.fn(async () => (state.indexCalls >= 4 ? HONORS : FINAL)),
        },
    };
    return holder;
};

type FakeIssuer = ReturnType<typeof makeIssuer>;
type FakeHolder = ReturnType<typeof makeHolder>;

const oldTTY = process.stdin.isTTY;
const oldYes = process.env.LC_YES;

beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    delete process.env.LC_YES;
    mocks.question.mockResolvedValue('');
    mocks.lca.mockResolvedValue({});
});

afterEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: oldTTY, configurable: true });
    if (oldYes === undefined) delete process.env.LC_YES;
    else process.env.LC_YES = oldYes;
});

const runTerminal = async (
    options: { lcaUrl?: string; network?: string } = {}
): Promise<{
    order: string[];
    published: Published[];
    issuer: FakeIssuer;
    holder: FakeHolder;
}> => {
    const order: string[] = [];
    const published: Published[] = [];
    const state = { indexCalls: 0 };
    const issuer = makeIssuer(order, published);
    const holder = makeHolder(order, state);
    mocks.init.mockResolvedValueOnce(issuer).mockResolvedValueOnce(holder);
    const mutate = vi
        .fn()
        .mockResolvedValueOnce({
            verifiablePresentationRequest: { challenge: 'challenge-1', domain: 'localhost' },
        })
        .mockResolvedValueOnce({
            verifiablePresentation: { verifiableCredential: [FINAL] },
        });
    mocks.getClient.mockResolvedValue({
        workflows: { participateInExchange: { mutate } },
    });
    holder.invoke.refreshCredential.mockResolvedValue({ status: 'updated', credential: HONORS });
    await runInboxRefreshDemo({ yes: true, ...options });
    return { order, published, issuer, holder };
};

describe('Universal Inbox refresh demonstration', () => {
    it('issues and publishes before the recipient profile exists, then guides a real claim', async () => {
        const order: string[] = [];
        const published: Published[] = [];
        const state = { indexCalls: 0 };
        const issuer = makeIssuer(order, published);
        const holder = makeHolder(order, state);
        mocks.init.mockResolvedValueOnce(issuer).mockResolvedValueOnce(holder);
        mocks.preflight.mockResolvedValue({
            appOrigin: 'http://localhost:3000',
            cloud: 'http://localhost:4100/trpc',
            lcaApi: 'http://localhost:5200/trpc',
            notificationsWebhook: 'http://localhost:5200/api/notifications/send',
        });

        await runInboxRefreshDemo({ ui: true });

        // Pre-claim: nobody existed when the credential and its update were queued.
        expect(order.indexOf('issue')).toBeLessThan(order.indexOf('publish-2'));
        expect(order.indexOf('publish-2')).toBeLessThan(order.indexOf('holderProfile'));
        expect(order.indexOf('holderProfile')).toBeLessThan(order.indexOf('publish-3'));

        // Receipt identity, status, and service are kept across versions.
        expect(published[0]!.credential).toMatchObject({
            id: RECEIPT.credentialId,
            issuer: RECEIPT.issuerDid,
            refreshService: RECEIPT.refreshService,
            credentialStatus: RECEIPT.credentialStatus,
            boostId: 'boost:demo',
        });
        expect(published[0]!.credential.credentialSubject.id).toBeUndefined();
        expect(published[1]!.credential.credentialSubject.id).toBe('did:key:holder');

        // Issue request really exercised the no-account path and suppressed email.
        const issueInput = issuer.invoke.sendCredentialViaInbox.mock.calls[0]![0];
        expect(issueInput.recipient).toEqual({
            type: 'email',
            value: expect.stringMatching(/^inbox-demo-[0-9a-f]{8}@example\.com$/),
        });
        expect(issueInput.refresh).toBe(true);
        expect(issueInput.templateUri).toBe('boost:demo');
        expect(issueInput.idempotencyKey).toBeTruthy();
        expect(issueInput.configuration.delivery.suppress).toBe(true);

        // The CLI never claims, accepts, refreshes, or saves on the holder's behalf.
        expect(holder.invoke.acceptCredential).not.toHaveBeenCalled();
        expect(holder.invoke.refreshCredential).not.toHaveBeenCalled();
        expect(holder.invoke.verifyCredential).toHaveBeenCalledWith(FINAL);
        expect(holder.invoke.verifyCredential).toHaveBeenCalledWith(HONORS);

        // A premature Enter retried; the same entry was replaced, not duplicated.
        expect(holder.index.LearnCloud.get).toHaveBeenCalledTimes(4);

        const logs = mocks.log.mock.calls.flat().join('\n');
        expect(logs).toMatch(
            /http:\/\/localhost:3000\/developer\/sign-in\?next=%2Finteractions%2Finbox-claim%2Ftoken-123%3Fiuv%3D1#seed=[0-9a-f]{64}/
        );
        expect(logs).toContain('http://localhost:3000/interactions/inbox-claim/token-123?iuv=1');
        expect(mocks.set).toHaveBeenCalledWith(
            expect.objectContaining({ ui: true, status: 'updated', sameCredentialId: true })
        );
        // No seed or claim link ever leaks into the machine-readable result.
        expect(JSON.stringify(mocks.set.mock.calls)).not.toMatch(/[0-9a-f]{64}/);
        expect(JSON.stringify(mocks.set.mock.calls)).not.toContain('inbox-claim');
        expect(mocks.close).toHaveBeenCalled();
    });

    it('uses the tenant-configured LCA service in UI mode', async () => {
        const order: string[] = [];
        const published: Published[] = [];
        const issuer = makeIssuer(order, published);
        const holder = makeHolder(order, { indexCalls: 0 });
        mocks.init.mockResolvedValueOnce(issuer).mockResolvedValueOnce(holder);
        mocks.preflight.mockResolvedValue({
            appOrigin: 'http://localhost:3000',
            cloud: 'http://localhost:4100/trpc',
            lcaApi: 'http://localhost:5200/trpc',
            notificationsWebhook: 'http://localhost:5200/api/notifications/send',
        });

        await runInboxRefreshDemo({ ui: true });
        expect(mocks.lca).toHaveBeenCalledWith(expect.anything(), 'http://localhost:5200/trpc');
    });

    it('claims with DIDAuth and refreshes in terminal mode without leaking secrets', async () => {
        const { order, published, holder } = await runTerminal();

        expect(order).toEqual(['issue', 'publish-2', 'publish-3']);
        expect(published[1]!.credential.credentialSubject.id).toBe('did:key:holder');
        expect(published[1]!.credential.name).toBe('Honors Course Certificate');
        expect(holder.invoke.refreshCredential).toHaveBeenCalledWith(
            FINAL,
            expect.objectContaining({ allowInsecureHttp: true, allowPrivateAddresses: true })
        );
        expect(mocks.set).toHaveBeenCalledWith(
            expect.objectContaining({
                before: 'Provisional Course Certificate',
                after: 'Honors Course Certificate',
                version: 3,
                status: 'updated',
                sameCredentialId: true,
            })
        );
        const result = JSON.stringify(mocks.set.mock.calls);
        expect(result).not.toMatch(/[0-9a-f]{64}/);
        expect(result).not.toContain('inbox-claim');
        expect(result).not.toContain('seed');
    });

    it('defaults the terminal LCA service to 5100 and allows a 5200 override', async () => {
        await runTerminal();
        expect(mocks.lca).toHaveBeenLastCalledWith(expect.anything(), 'http://localhost:5100/trpc');
        vi.resetAllMocks();
        mocks.question.mockResolvedValue('');
        mocks.lca.mockResolvedValue({});
        await runTerminal({ lcaUrl: 'http://localhost:5200/trpc' });
        expect(mocks.lca).toHaveBeenLastCalledWith(expect.anything(), 'http://localhost:5200/trpc');
    });

    it.each([{ yes: true }, { json: true }])(
        'rejects auto-advance UI flags before any writes: %j',
        async flags => {
            await expect(runInboxRefreshDemo({ ui: true, ...flags })).rejects.toThrow(
                'interactive terminal'
            );
            expect(mocks.init).not.toHaveBeenCalled();
            expect(mocks.preflight).not.toHaveBeenCalled();
        }
    );

    it('requires a loopback network and rejects --lca-url together with --ui', async () => {
        await expect(
            runInboxRefreshDemo({ yes: true, network: 'https://network.learncard.com/trpc' })
        ).rejects.toThrow('local-only');
        expect(mocks.init).not.toHaveBeenCalled();

        await expect(
            runInboxRefreshDemo({ ui: true, lcaUrl: 'http://localhost:5200/trpc' })
        ).rejects.toThrow('--lca-url is for terminal mode');
        expect(mocks.init).not.toHaveBeenCalled();
    });

    it('fails when a holder is already bound or the publication is the wrong version', async () => {
        const order: string[] = [];
        const published: Published[] = [];
        const state = { indexCalls: 0 };
        const issuer = makeIssuer(order, published);
        issuer.invoke.sendCredentialViaInbox.mockResolvedValueOnce({
            status: 'PENDING',
            issuanceId: 'issuance:demo',
            claimUrl: CLAIM_URL,
            recipient: { type: 'email', value: 'inbox-demo-deadbeef@example.com' },
            refresh: { ...RECEIPT, holderDid: 'did:key:someone' },
        });
        mocks.init.mockResolvedValueOnce(issuer).mockResolvedValueOnce(makeHolder(order, state));
        await expect(runInboxRefreshDemo({ yes: true })).rejects.toThrow(
            'holder was bound before anyone claimed'
        );

        vi.resetAllMocks();
        mocks.question.mockResolvedValue('');
        mocks.lca.mockResolvedValue({});
        const order2: string[] = [];
        const published2: Published[] = [];
        const issuer2 = makeIssuer(order2, published2);
        issuer2.invoke.publishCredentialRefresh.mockResolvedValue({ version: 5 });
        mocks.init
            .mockResolvedValueOnce(issuer2)
            .mockResolvedValueOnce(makeHolder(order2, { indexCalls: 0 }));
        await expect(runInboxRefreshDemo({ yes: true })).rejects.toThrow('Expected version 2');
    });

    it('refuses to advance when the app certificate fails proof verification', async () => {
        const order: string[] = [];
        const published: Published[] = [];
        const state = { indexCalls: 1 };
        const holder = makeHolder(order, state);
        holder.invoke.verifyCredential.mockResolvedValue({
            checks: [],
            errors: ['bad proof'],
            warnings: [],
        });
        mocks.init
            .mockResolvedValueOnce(makeIssuer(order, published))
            .mockResolvedValueOnce(holder);
        mocks.preflight.mockResolvedValue({
            appOrigin: 'http://localhost:3000',
            cloud: 'http://localhost:4100/trpc',
            lcaApi: 'http://localhost:5200/trpc',
            notificationsWebhook: 'http://localhost:5200/api/notifications/send',
        });
        await expect(runInboxRefreshDemo({ ui: true })).rejects.toThrow(
            'did not pass verification'
        );
    });

    it('fails when the DIDAuth claim returns the wrong credential', async () => {
        const order: string[] = [];
        const published: Published[] = [];
        const issuer = makeIssuer(order, published);
        const holder = makeHolder(order, { indexCalls: 0 });
        mocks.init.mockResolvedValueOnce(issuer).mockResolvedValueOnce(holder);
        mocks.getClient.mockResolvedValue({
            workflows: {
                participateInExchange: {
                    mutate: vi
                        .fn()
                        .mockResolvedValueOnce({
                            verifiablePresentationRequest: { challenge: 'c', domain: 'd' },
                        })
                        .mockResolvedValueOnce({
                            verifiablePresentation: {
                                verifiableCredential: [{ ...FINAL, id: 'urn:uuid:other' }],
                            },
                        }),
                },
            },
        });
        await expect(runInboxRefreshDemo({ yes: true })).rejects.toThrow(
            'different credential identity'
        );
    });
});

describe('inbox claim link mapping', () => {
    it('maps the backend claim path onto the validated app origin', () => {
        expect(mapInboxClaimPath(CLAIM_URL)).toBe('/interactions/inbox-claim/token-123?iuv=1');
        expect(
            buildInboxAppLinks(
                'http://localhost:3000',
                '/interactions/inbox-claim/token-123?iuv=1',
                'a'.repeat(64)
            )
        ).toEqual({
            signIn: `http://localhost:3000/developer/sign-in?next=%2Finteractions%2Finbox-claim%2Ftoken-123%3Fiuv%3D1#seed=${'a'.repeat(64)}`,
            claim: 'http://localhost:3000/interactions/inbox-claim/token-123?iuv=1',
        });
    });

    it.each([
        'https://evil.example/interactions/inbox-claim/token/extra',
        'http://localhost:4000/other/path',
        'not-a-url',
    ])('refuses an unexpected claim link: %s', claimUrl => {
        expect(() => mapInboxClaimPath(claimUrl)).toThrow();
    });
});
