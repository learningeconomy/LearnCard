import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { loadOrgSpec } from './load';
import { loadReferralInputs } from './referral-inputs';
import { referralContract, applyReferralContract, type ReferralCard } from './referral-contract';
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
        }),
        reconcileReferralAudience: vi
            .fn()
            .mockResolvedValue({ writers: ['writer'], changed: false, frozen: false }),
        updateContract: vi.fn().mockResolvedValue({ kind: 'requires_consent', affectedUsers: 3 }),
        createContract: vi.fn().mockResolvedValue(uri),
    };
    return {
        methods,
        apply: (p = program, dry = false, allow = false, changes: OrgChange[] = []) =>
            applyReferralContract(
                methods as unknown as ReferralCard,
                p,
                referralContract(p, {}),
                dry,
                allow,
                changes
            ),
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
