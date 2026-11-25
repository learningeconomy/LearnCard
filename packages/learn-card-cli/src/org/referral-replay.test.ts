import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applyOrg, type OrgLearnCard } from './apply';
import { applyReferrals, type ReferralContext } from './referrals';
import { referralContract } from './referral-contract';
import { ReferralApplyError } from './referral-safety';
import { OrgSpecValidator } from './schema';
import { loadProject, parseEnv } from '../project';
import { errorEnvelope, humanErrorLines } from '../errors';
import * as secrets from './secrets';

const uri = 'lc:network:localhost%3A4000/trpc:contract:referral';
const endpoint = 'https://example.org/events?private=do-not-log';
const fakeSecret = 'mock-webhook-signing-secret';
const fakeToken = 'mock-recipient-token';
const rawError = `request ${endpoint} Bearer ${fakeToken} ${fakeSecret}`;
const directories: string[] = [];
afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
        directories.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true }))
    );
});

const setup = async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-referral-replay-'));
    directories.push(directory);
    const file = path.join(directory, 'handoff.env');
    const spec = OrgSpecValidator.parse({
        issuer: {
            profileId: 'partner',
            displayName: 'Partner',
            signingAuthority: { type: 'learncard-hosted', name: 'signer' },
        },
        referralRecipients: [{ profileId: 'recipient', displayName: 'Recipient' }],
        referralPrograms: [
            {
                name: 'Referral',
                partner: 'partner',
                referrers: ['recipient'],
                outcomes: { issuer: 'partner', category: 'Work History' },
                delivery: { readable: true, webhook: endpoint },
            },
        ],
    });
    const program = spec.referralPrograms![0]!;
    const contract = referralContract(program, {});
    const state = {
        recipient: false,
        contract: false,
        integration: false,
        registered: false,
        grant: undefined as undefined | { id: string; name: string; scope: string; status: string },
        disclosureVersion: '2',
        readable: false,
    };
    const recipientDid = 'did:web:local:users:recipient';
    const recipient = {
        invoke: {
            getIntegrations: vi.fn(async () => ({
                hasMore: false,
                records: state.integration
                    ? [{ id: 'integration-1', name: 'Referral: Referral' }]
                    : [],
            })),
            addIntegration: vi.fn(async () => {
                state.integration = true;
                return 'integration-1';
            }),
            getIntegrationWebhook: vi.fn(async () => ({
                hasSecret: state.registered,
                webhookUrl: state.registered ? endpoint : undefined,
                contractEventsEnabledAt: state.registered ? '2026-01-01' : undefined,
            })),
            setIntegrationWebhook: vi.fn(async () => {
                state.registered = true;
                return { secret: fakeSecret };
            }),
            getAuthGrants: vi.fn(async () => (state.grant ? [state.grant] : [])),
            addAuthGrant: vi.fn(async (input: { name: string; scope: string }) => {
                state.grant = { ...input, id: 'grant-1', status: 'active' };
                return 'grant-1';
            }),
            getAPITokenForAuthGrant: vi.fn(async () => fakeToken),
        },
    };
    const root = {
        id: { did: () => 'did:web:local:users:partner' },
        invoke: {
            getProfile: vi.fn(async () => spec.issuer),
            getRegisteredSigningAuthorities: vi.fn(async () => [
                {
                    signingAuthority: { endpoint: 'https://example.org/signer' },
                    relationship: { name: 'signer', did: 'did:web:local:signer', isPrimary: true },
                },
            ]),
            getManagedServiceProfiles: vi.fn(async () => ({
                hasMore: false,
                records: state.recipient
                    ? [
                          {
                              profileId: 'recipient',
                              type: 'organization',
                              did: recipientDid,
                              displayName: 'Recipient',
                          },
                      ]
                    : [],
            })),
            createManagedServiceProfile: vi.fn(async () => {
                state.recipient = true;
                return recipientDid;
            }),
            getContracts: vi.fn(async () => ({
                hasMore: false,
                records: state.contract
                    ? [{ name: program.name, referralProgram: program.name, uri }]
                    : [],
            })),
            getContract: vi.fn(async () => ({
                owner: { profileId: 'partner' },
                name: program.name,
                referralProgram: program.name,
                contract,
                version: 1,
                status: 'active',
                recipients: [{ profileId: 'recipient' }],
                readableDeliveryRecipients: state.readable
                    ? [
                          {
                              profileId: 'recipient',
                              enabled: true,
                              disclosureVersion: state.disclosureVersion,
                          },
                      ]
                    : [],
            })),
            createContract: vi.fn(async () => {
                state.contract = true;
                return uri;
            }),
            reconcileReferralAudience: vi.fn(async () => ({
                writers: [],
                changed: false,
                frozen: false,
            })),
            updateContract: vi.fn(async () => ({ kind: 'no_change' })),
        },
    };
    const provision = vi.fn(async () => {
        state.readable = true;
    });
    const ctx = {
        root,
        asProfile: vi.fn(async () => recipient),
        network: 'local',
        contracts: new Map([[program.name, contract]]),
        endpoints: new Map([[program.name, endpoint]]),
        provisionReadable: provision,
    } as unknown as ReferralContext;
    const project = await loadProject(directory);
    Object.assign(project.env, {
        SIGNING_AUTHORITY_NAME: 'signer',
        SIGNING_AUTHORITY_ENDPOINT: 'https://example.org/signer',
    });
    const apply = (dryRun = false) =>
        applyOrg(spec, root as unknown as OrgLearnCard, project, {
            secretsOut: file,
            referrals: ctx,
            dryRun,
        });
    return { spec, state, file, ctx, root, recipient, provision, apply };
};

const expectNoContractWrites = (root: Awaited<ReturnType<typeof setup>>['root']) => {
    expect(root.invoke.createContract).not.toHaveBeenCalled();
    expect(
        root.invoke.updateContract.mock.calls.every(
            call =>
                (call as unknown[])[2] && ((call as unknown[])[2] as { dryRun?: boolean }).dryRun
        )
    ).toBe(true);
    expect(
        root.invoke.reconcileReferralAudience.mock.calls.every(
            call => ((call as unknown[])[0] as { dryRun?: boolean }).dryRun
        )
    ).toBe(true);
};
const incomplete = async (action: () => Promise<unknown>) => {
    const error = await action().then(
        () => {
            throw new Error('Expected failure');
        },
        error => error
    );
    expect(error).toBeInstanceOf(ReferralApplyError);
    const serialized = JSON.stringify({
        json: errorEnvelope('org apply', error),
        human: humanErrorLines(error),
    });
    for (const value of [endpoint, fakeSecret, fakeToken, rawError])
        expect(serialized).not.toContain(value);
    return JSON.parse(error.detail!) as {
        changes: Array<{ resource: string; action: string; id?: string }>;
        outputs: {
            referrals: Array<{
                contractUri?: string;
                integrationId?: string;
                tokenKey: string;
                webhookSecretKey: string;
            }>;
            serviceAccounts: Array<{ grantId: string }>;
        };
    };
};

describe('referral dependency preflight', () => {
    it.each([
        'undeclared recipient',
        'recipient mismatch',
        'ambiguous integration',
        'missing signing secret',
        'readable drift',
        'invalid endpoint',
        'missing handoff',
        'readable service failure',
    ])('blocks contract/audience writes for %s', async kind => {
        const f = await setup();
        f.state.recipient = true;
        f.state.contract = true;
        if (kind === 'undeclared recipient') {
            f.state.recipient = false;
            f.spec.referralRecipients = [];
        }
        if (kind === 'recipient mismatch') f.spec.referralRecipients![0]!.displayName = 'Different';
        if (kind === 'ambiguous integration')
            f.recipient.invoke.getIntegrations.mockResolvedValue({ hasMore: true, records: [] });
        if (kind === 'missing signing secret') {
            f.state.integration = true;
            f.state.registered = true;
        }
        if (kind === 'readable drift') {
            f.state.readable = true;
            f.state.disclosureVersion = '1';
        }
        if (kind === 'invalid endpoint') f.ctx.endpoints.set('Referral', 'http://example.org');
        if (kind === 'readable service failure') f.provision.mockRejectedValue(new Error(rawError));
        await incomplete(
            kind === 'missing handoff'
                ? () => applyReferrals(f.spec, f.ctx, false, false, undefined, [], [], vi.fn())
                : f.apply
        );
        expectNoContractWrites(f.root);
        expect(f.recipient.invoke.setIntegrationWebhook).not.toHaveBeenCalled();
        expect(f.recipient.invoke.addAuthGrant).not.toHaveBeenCalled();
    });

    it('checks a newly created recipient before creating its contract', async () => {
        const f = await setup();
        f.recipient.invoke.getIntegrations.mockRejectedValue(new Error(rawError));
        const progress = await incomplete(f.apply);
        expect(progress.changes).toContainEqual(
            expect.objectContaining({
                resource: 'referralRecipient',
                action: 'created',
                id: 'did:web:local:users:recipient',
            })
        );
        expectNoContractWrites(f.root);
        expect(f.provision).not.toHaveBeenCalled();
    });

    it('checks a later program before writing the first contract', async () => {
        const f = await setup();
        f.spec.referralPrograms!.push({ ...f.spec.referralPrograms![0]!, name: 'Later' });
        await incomplete(f.apply);
        expectNoContractWrites(f.root);
        expect(f.root.invoke.createManagedServiceProfile).not.toHaveBeenCalled();
    });

    it.each(['public', 'symlink', 'hardlink'])(
        'rejects an unsafe %s handoff before contract writes',
        async kind => {
            const f = await setup();
            const target = f.file + '.target';
            await fs.writeFile(target, 'PRIVATE=mock\n', { mode: 0o600 });
            if (kind === 'public') {
                await fs.writeFile(f.file, 'PRIVATE=mock\n');
                await fs.chmod(f.file, 0o644);
            }
            if (kind === 'symlink') await fs.symlink(target, f.file);
            if (kind === 'hardlink') await fs.link(target, f.file);
            await incomplete(f.apply);
            expectNoContractWrites(f.root);
            expect(await fs.readFile(target, 'utf8')).toBe('PRIVATE=mock\n');
        }
    );

    it('previews a new setup without mutations or a handoff file', async () => {
        const f = await setup();
        await f.apply(true);
        expectNoContractWrites(f.root);
        expect(f.root.invoke.createManagedServiceProfile).not.toHaveBeenCalled();
        expect(f.provision).not.toHaveBeenCalled();
        expect(f.recipient.invoke.addIntegration).not.toHaveBeenCalled();
        await expect(fs.stat(f.file)).rejects.toMatchObject({ code: 'ENOENT' });
    });
});

describe('referral partial progress and replay', () => {
    it.each(['contract handoff', 'webhook registration', 'token mint', 'token handoff'])(
        'reuses all confirmed identities after a late %s failure',
        async stage => {
            const f = await setup();
            const write = secrets.writeSecret;
            let failed = false;
            vi.spyOn(secrets, 'writeSecret').mockImplementation(async (file, key, value) => {
                if (
                    !failed &&
                    ((stage === 'contract handoff' && key.endsWith('_CONTRACT_URI')) ||
                        (stage === 'token handoff' && key.endsWith('_TOKEN')))
                ) {
                    failed = true;
                    throw new Error(rawError);
                }
                await write(file, key, value);
            });
            if (stage === 'webhook registration')
                f.recipient.invoke.setIntegrationWebhook.mockRejectedValueOnce(new Error(rawError));
            if (stage === 'token mint')
                f.recipient.invoke.getAPITokenForAuthGrant.mockRejectedValueOnce(
                    new Error(rawError)
                );
            const progress = await incomplete(f.apply);
            expect(progress.outputs.referrals[0]!.contractUri).toBe(uri);
            expect(progress.changes).toContainEqual(
                expect.objectContaining({
                    resource: 'referralContract',
                    action: 'created',
                    id: uri,
                })
            );
            if (stage !== 'contract handoff')
                expect(progress.outputs.referrals[0]!.integrationId).toBe('integration-1');
            if (stage.startsWith('token'))
                expect(progress.outputs.serviceAccounts).toContainEqual(
                    expect.objectContaining({ grantId: 'grant-1' })
                );
            const result = await f.apply();
            const entry = result.outputs.referrals![0]!;
            expect(entry).toMatchObject({ contractUri: uri, integrationId: 'integration-1' });
            expect(f.root.invoke.createManagedServiceProfile).toHaveBeenCalledTimes(1);
            expect(f.root.invoke.createContract).toHaveBeenCalledTimes(1);
            expect(f.recipient.invoke.addIntegration).toHaveBeenCalledTimes(1);
            expect(f.recipient.invoke.addAuthGrant).toHaveBeenCalledTimes(1);
            expect(f.provision.mock.calls[0]).toEqual(f.provision.mock.calls[1]);
            expect(parseEnv(await fs.readFile(f.file, 'utf8'))).toMatchObject({
                [entry.tokenKey]: fakeToken,
                [entry.webhookSecretKey!]: fakeSecret,
                [entry.tokenKey.replace(/_TOKEN$/, '_CONTRACT_URI')]: uri,
            });
            expect((await fs.stat(f.file)).mode & 0o777).toBe(0o600);
            expect(JSON.stringify(result)).not.toContain(fakeSecret);
            expect(JSON.stringify(result)).not.toContain(fakeToken);
        }
    );

    it('requires secure restore after the webhook secret was issued but could not be saved', async () => {
        const f = await setup();
        const write = secrets.writeSecret;
        vi.spyOn(secrets, 'writeSecret').mockImplementation(async (file, key, value) => {
            if (key.endsWith('_WEBHOOK_SECRET')) throw new Error(rawError);
            await write(file, key, value);
        });
        const progress = await incomplete(f.apply);
        expect(progress.outputs.referrals[0]!.integrationId).toBe('integration-1');
        expect(progress.changes).toContainEqual(
            expect.objectContaining({
                resource: 'integrationWebhook',
                action: 'updated',
                id: 'integration-1',
            })
        );
        f.root.invoke.createContract.mockClear();
        await expect(f.apply()).rejects.toThrow(/Restore.*securely/);
        expectNoContractWrites(f.root);
        expect(f.recipient.invoke.setIntegrationWebhook).toHaveBeenCalledTimes(1);
        expect(f.recipient.invoke.addAuthGrant).not.toHaveBeenCalled();
        vi.restoreAllMocks();
        await write(f.file, progress.outputs.referrals[0]!.webhookSecretKey, fakeSecret);
        const result = await f.apply();
        expect(f.recipient.invoke.addIntegration).toHaveBeenCalledTimes(1);
        expect(f.recipient.invoke.setIntegrationWebhook).toHaveBeenCalledTimes(1);
        expect(
            parseEnv(await fs.readFile(f.file, 'utf8'))[result.outputs.referrals![0]!.tokenKey]
        ).toBe(fakeToken);
    });

    it('retries a rejected atomic audience and terms update without a separate audience write', async () => {
        const f = await setup();
        f.state.recipient = true;
        f.state.contract = true;
        const wanted = f.ctx.contracts.get('Referral')!;
        f.ctx.contracts.set('Referral', {
            ...wanted,
            read: { ...wanted.read, personal: { email: { required: true } } },
        });
        f.root.invoke.reconcileReferralAudience.mockResolvedValue({
            writers: [],
            changed: true,
            frozen: false,
        });
        f.root.invoke.updateContract.mockImplementation(async (...args: unknown[]) => {
            if (!(args[2] as { dryRun?: boolean }).dryRun) throw new Error(rawError);
            return { kind: 'no_change' };
        });
        const progress = await incomplete(f.apply);
        expect(progress.outputs.referrals[0]!.contractUri).toBe(uri);
        expect(progress.changes).not.toContainEqual(
            expect.objectContaining({ resource: 'referralContract', action: 'updated' })
        );
        f.root.invoke.updateContract.mockResolvedValue({ kind: 'no_change' });
        const result = await f.apply();
        expect(result.outputs.referrals![0]!.contractUri).toBe(uri);
        expect(f.root.invoke.createContract).not.toHaveBeenCalled();
        expect(
            f.root.invoke.reconcileReferralAudience.mock.calls.every(
                call => ((call as unknown[])[0] as { dryRun: boolean }).dryRun
            )
        ).toBe(true);
        expect(f.root.invoke.updateContract).toHaveBeenLastCalledWith(
            uri,
            expect.anything(),
            expect.objectContaining({
                expectedVersion: 1,
                referralAudience: {
                    recipients: ['recipient'],
                    expectedRecipients: ['recipient'],
                    allowReconsent: false,
                },
            })
        );
    });

    it('retains the referral handoff if a later organization account fails', async () => {
        const f = await setup();
        f.spec.serviceAccounts = [{ name: 'later-account', scopes: ['contracts:read'] }];
        Object.assign(f.root.invoke, {
            getAuthGrants: vi.fn().mockRejectedValue(new Error(rawError)),
        });
        const progress = await incomplete(f.apply);
        expect(progress.outputs.referrals[0]).toMatchObject({
            contractUri: uri,
            integrationId: 'integration-1',
        });
        expect(
            parseEnv(await fs.readFile(f.file, 'utf8'))[progress.outputs.referrals[0]!.tokenKey]
        ).toBe(fakeToken);
    });

    it('does not report a contract creation as confirmed when its response fails, and discovers it on retry', async () => {
        const f = await setup();
        f.root.invoke.createContract.mockImplementationOnce(async () => {
            f.state.contract = true;
            throw new Error(rawError);
        });
        const progress = await incomplete(f.apply);
        expect(
            progress.changes.some(c => c.resource === 'referralContract' && c.action === 'created')
        ).toBe(false);
        const result = await f.apply();
        expect(result.outputs.referrals![0]!.contractUri).toBe(uri);
        expect(f.root.invoke.createContract).toHaveBeenCalledTimes(1);
    });
});
