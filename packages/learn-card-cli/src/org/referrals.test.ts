import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { loadOrgSpec } from './load';
import { loadReferralInputs } from './referral-inputs';
import { referralContract, planReferralContract, type ReferralCard } from './referral-contract';
import { type ReferralProgram, OrgSpecValidator } from './schema';
import type { OrgChange } from './apply';

const program: ReferralProgram = {
    name: 'Partner referral',
    partner: 'partner',
    referrers: ['recipient'],
    outcomes: { issuer: 'writer', category: 'Work History' },
    asks: { personal: ['email'] },
};
const contract = referralContract(program, {});
const uri = 'lc:network:localhost%3A4000/trpc:contract:example';
const mockOwner = () => {
    const methods = {
        getContracts: vi
            .fn()
            .mockResolvedValue({ records: [{ name: program.name, uri }], hasMore: false }),
        getContract: vi.fn().mockResolvedValue({
            owner: { profileId: 'partner' },
            referralProgram: program.name,
            name: program.name,
            contract,
            version: 2,
            status: 'active',
        }),
        reconcileReferralAudience: vi
            .fn()
            .mockResolvedValue({ writers: ['writer'], changed: false, frozen: false }),
        updateContract: vi.fn().mockResolvedValue({ kind: 'requires_consent', affectedUsers: 3 }),
        createContract: vi.fn().mockResolvedValue(uri),
    };
    return {
        methods,
        apply: async (p = program, dry = false, allow = false, changes: OrgChange[] = []) =>
            (
                await planReferralContract(
                    methods as unknown as ReferralCard,
                    p,
                    referralContract(p, {}),
                    dry,
                    allow
                )
            ).apply(changes),
    };
};
describe('referral setup', () => {
    it('expands the HHUSA example from the actual tenant field catalog before connecting', async () => {
        const spec = await loadOrgSpec(
            path.resolve(__dirname, '../../examples/hhusa-referrals.yaml')
        );
        const source = path.resolve(
            __dirname,
            '../../../../apps/learn-card-app/environments/vetpass/config.staging.json'
        );
        const env = { HHUSA_REFERRAL_WEBHOOK_URL: 'https://example.org/events' };
        const { contracts } = await loadReferralInputs(spec, [`vetpass=${source}`], env);
        const categories = contracts.get(spec.referralPrograms![0]!.name)!.read.credentials
            .categories;
        expect(Object.keys(categories).sort()).toEqual(
            [
                'Work History',
                ...['birthDate', 'branch', 'disabilityStatus', 'gender'].map(
                    field => 'VerifiableData:vetpass:military-profile:' + field
                ),
            ].sort()
        );
        expect(
            OrgSpecValidator.safeParse({
                ...spec,
                referralPrograms: [
                    { ...program, outcomes: { issuer: 'writer', category: 'WorkHistory' } },
                ],
            }).success
        ).toBe(false);
        await expect(loadReferralInputs(spec, [], env)).rejects.toThrow(/tenant-config/);
        await expect(loadReferralInputs(spec, [`vetpass=${source}`], {})).rejects.toThrow(
            /HHUSA_REFERRAL_WEBHOOK_URL/
        );
    });
    it('creates writers and recipients together, and previews creation without writes', async () => {
        const { methods, apply } = mockOwner();
        methods.getContracts.mockResolvedValue({ records: [], hasMore: false });
        await apply(program, true);
        expect(methods.createContract).not.toHaveBeenCalled();
        await apply();
        expect(methods.createContract).toHaveBeenCalledWith(
            expect.objectContaining({ writers: ['writer'], recipients: ['recipient'], contract })
        );
    });
    it('leaves an identical contract at its current version', async () => {
        const { methods, apply } = mockOwner();
        await apply();
        expect(methods.updateContract).not.toHaveBeenCalled();
        expect(methods.reconcileReferralAudience).toHaveBeenCalledExactlyOnceWith({
            contractUri: uri,
            recipients: ['recipient'],
            expectedRecipients: [],
            dryRun: true,
        });
    });
    it('blocks recipient drift after consent even when re-consent is enabled', async () => {
        const { methods, apply } = mockOwner();
        methods.reconcileReferralAudience.mockResolvedValue({
            writers: [],
            changed: true,
            frozen: true,
        });
        await expect(apply(program, false, true)).rejects.toThrow(/new contract/);
        expect(methods.updateContract).not.toHaveBeenCalled();
    });
    it('requires explicit permission for a server-classified expansion and pins publication to the previewed version', async () => {
        const { methods, apply } = mockOwner();
        const expanded = { ...program, outcomes: { ...program.outcomes, required: true } };
        await expect(apply(expanded)).rejects.toThrow(/allow-reconsent/);
        expect(methods.updateContract).toHaveBeenCalledTimes(1);
        expect(methods.updateContract.mock.calls[0]?.[2]).toMatchObject({
            dryRun: true,
            expectedVersion: 2,
        });
        await apply(expanded, false, true);
        expect(methods.updateContract.mock.calls.at(-1)?.[2]).toMatchObject({ expectedVersion: 2 });
        expect(methods.updateContract.mock.calls.at(-1)?.[2].dryRun).toBeUndefined();
    });
});

it('provisions delegated delivery before registering a webhook and minting the recipient token', async () => {
    const { applyReferrals } = await import('./referrals');
    const fs = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { parseEnv } = await import('../project');
    const spec = OrgSpecValidator.parse({
        issuer: {
            profileId: 'partner',
            displayName: 'Partner',
            signingAuthority: { type: 'learncard-hosted', name: 'outcomes' },
        },
        referralPrograms: [
            {
                ...program,
                outcomes: { ...program.outcomes, issuer: 'partner' },
                delivery: { readable: true, webhook: 'https://example.org/events' },
            },
        ],
    });
    const p = spec.referralPrograms![0]!;
    const { methods } = mockOwner();
    methods.getContracts.mockResolvedValue({ hasMore: false, records: [] });
    const order: string[] = [];
    const root = {
        invoke: {
            ...methods,
            getManagedServiceProfiles: vi.fn().mockResolvedValue({
                records: [
                    {
                        profileId: 'recipient',
                        type: 'organization',
                        did: 'did:web:local:recipient',
                        displayName: 'Recipient',
                    },
                ],
            }),
        },
    };
    const recipient = {
        invoke: {
            getIntegrations: vi.fn().mockResolvedValue({ hasMore: false, records: [] }),
            addIntegration: vi.fn().mockResolvedValue('integration-id'),
            setIntegrationWebhook: vi.fn(async () => {
                order.push('webhook');
                return { secret: 'unit-test-secret' };
            }),
        },
    };
    const provisionReadable = vi.fn(
        async (_profileId: string, _displayName: string, _requestId: string) => {
            order.push('delivery');
        }
    );
    const ctx = {
        root,
        asProfile: vi.fn().mockResolvedValue(recipient),
        contracts: new Map([[p.name, referralContract(p, {})]]),
        endpoints: new Map([[p.name, p.delivery!.webhook!]]),
        network: 'local',
        provisionReadable,
    } as unknown as import('./referrals').ReferralContext;
    const directory = await fs.mkdtemp(path.join(tmpdir(), 'lc-referral-test-'));
    try {
        const file = path.join(directory, 'handoff.env');
        const changes: OrgChange[] = [];
        const mint = vi.fn(async () => {
            order.push('token');
        });
        const [handoff] = await applyReferrals(spec, ctx, false, false, file, [], changes, mint);
        expect(order).toEqual(['delivery', 'webhook', 'token']);
        expect(ctx.asProfile).toHaveBeenNthCalledWith(1, 'did:web:local:recipient', true);
        expect(ctx.asProfile).toHaveBeenNthCalledWith(2, 'did:web:local:recipient');
        expect(provisionReadable).toHaveBeenCalledWith(
            'recipient',
            'Recipient',
            expect.stringMatching(/^[a-f0-9-]{36}$/)
        );
        expect(mint).toHaveBeenCalledWith(
            expect.objectContaining({ scopes: expect.arrayContaining(['contracts-data:decrypt']) }),
            recipient
        );
        expect((await fs.stat(file)).mode & 0o777).toBe(0o600);
        expect(parseEnv(await fs.readFile(file, 'utf8'))[handoff!.webhookSecretKey!]).toBe(
            'unit-test-secret'
        );
        expect(JSON.stringify({ handoff, changes })).not.toContain('unit-test-secret');
        recipient.invoke.getIntegrations.mockResolvedValue({
            hasMore: false,
            records: [{ name: 'Referral: ' + p.name, id: 'integration-id' }],
        });
        Object.assign(recipient.invoke, {
            getIntegrationWebhook: vi.fn().mockResolvedValue({
                hasSecret: true,
                webhookUrl: p.delivery!.webhook,
                contractEventsEnabledAt: '2026-01-01',
            }),
        });
        await fs.writeFile(file, '');
        await expect(applyReferrals(spec, ctx, false, false, file, [], [], mint)).rejects.toThrow(
            /Restore/
        );
        expect(recipient.invoke.setIntegrationWebhook).toHaveBeenCalledTimes(1);
        expect(mint).toHaveBeenCalledTimes(1);
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
});

it.each(['frozen', 'wrong program', 'needs re-consent'] as const)(
    'validates all programs before any referral writes when the second is %s',
    async failure => {
        const { applyReferrals } = await import('./referrals');
        const first = {
            ...program,
            name: 'First new program',
            outcomes: { ...program.outcomes, issuer: 'partner' },
            delivery: { readable: true },
        };
        const second = {
            ...first,
            name: 'Second existing program',
            outcomes: { ...first.outcomes, required: true },
        };
        const spec = OrgSpecValidator.parse({
            issuer: {
                profileId: 'partner',
                displayName: 'Partner',
                signingAuthority: { type: 'learncard-hosted', name: 'outcomes' },
            },
            referralRecipients: [{ profileId: 'recipient', displayName: 'Recipient' }],
            referralPrograms: [first, second],
        });
        const { methods } = mockOwner();
        methods.getContracts.mockResolvedValue({
            records: [{ name: second.name, uri }],
            hasMore: false,
        });
        methods.getContract.mockResolvedValue({
            status: 'active',
            owner: { profileId: 'partner' },
            referralProgram: failure === 'wrong program' ? undefined : second.name,
            name: second.name,
            contract: referralContract(first, {}),
            version: 7,
            recipients: [{ profileId: 'previous-recipient' }],
        });
        methods.reconcileReferralAudience.mockResolvedValue({
            writers: [],
            changed: true,
            frozen: failure === 'frozen',
        });
        const invoke = {
            ...methods,
            getManagedServiceProfiles: vi.fn().mockResolvedValue({ records: [], hasMore: false }),
            createManagedServiceProfile: vi.fn(),
        };
        const provisionReadable = vi.fn();
        const mint = vi.fn();
        const connect = vi.fn();
        const ctx = {
            root: { invoke },
            asProfile: connect,
            contracts: new Map(spec.referralPrograms!.map(p => [p.name, referralContract(p, {})])),
            endpoints: new Map(),
            network: 'local',
            provisionReadable,
        } as unknown as import('./referrals').ReferralContext;
        const changes: OrgChange[] = [];
        const result = applyReferrals(
            spec,
            ctx,
            false,
            false,
            path.resolve('absent-handoff-test.env'),
            [],
            changes,
            mint
        );
        await expect(result).rejects.toThrow(
            failure === 'frozen'
                ? /frozen after first consent/
                : failure === 'wrong program'
                  ? /was not created for this referral program/
                  : /allow-reconsent/
        );
        expect(changes).toEqual([]);
        for (const write of [
            invoke.createManagedServiceProfile,
            invoke.createContract,
            provisionReadable,
            mint,
            connect,
        ])
            expect(write).not.toHaveBeenCalled();
        if (failure === 'wrong program') {
            expect(invoke.reconcileReferralAudience).not.toHaveBeenCalled();
        } else {
            expect(invoke.reconcileReferralAudience).toHaveBeenCalledExactlyOnceWith({
                contractUri: uri,
                recipients: ['recipient'],
                expectedRecipients: ['previous-recipient'],
                dryRun: true,
            });
        }
        if (failure === 'needs re-consent')
            expect(invoke.updateContract).toHaveBeenCalledExactlyOnceWith(
                uri,
                expect.anything(),
                expect.objectContaining({ dryRun: true, expectedVersion: 7 })
            );
        else expect(invoke.updateContract).not.toHaveBeenCalled();
    }
);

it('publishes changed recipients and terms together, with no separate audience write', async () => {
    const { methods, apply } = mockOwner();
    methods.reconcileReferralAudience.mockResolvedValue({
        writers: ['writer'],
        changed: true,
        frozen: false,
    });
    methods.updateContract
        .mockResolvedValueOnce({ kind: 'requires_consent', affectedUsers: 0 })
        .mockRejectedValueOnce(new Error('untrusted provider response'));
    const expanded = { ...program, outcomes: { ...program.outcomes, required: true } };
    const changes: OrgChange[] = [];
    await expect(apply(expanded, false, true, changes)).rejects.toThrow();
    expect(changes).toEqual([]);
    expect(methods.reconcileReferralAudience).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ dryRun: true })
    );
    expect(methods.updateContract).toHaveBeenLastCalledWith(
        uri,
        expect.anything(),
        expect.objectContaining({
            expectedVersion: 2,
            referralAudience: {
                recipients: ['recipient'],
                expectedRecipients: [],
                allowReconsent: true,
            },
        })
    );
    expect(methods.updateContract.mock.calls.at(-1)?.[2].dryRun).toBeUndefined();
});
