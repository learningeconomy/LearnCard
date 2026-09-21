import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applyOrg, type OrgLearnCard } from './apply';
import { loadProject } from '../project';
import type { OrgSpec } from './schema';

const spec: OrgSpec = {
    issuer: {
        profileId: 'scde',
        displayName: 'South Carolina Department of Education',
        signingAuthority: { type: 'learncard-hosted', name: 'scde-clr' },
    },
    profileManager: {
        displayName: 'SC Districts',
        managed: [{ profileId: 'sc-greenville', displayName: 'Greenville County Schools' }],
    },
    serviceAccounts: [
        {
            name: 'ea-clr-issuer',
            scopes: ['inbox:write', 'inbox:read', 'credentials:write', 'credentials:read'],
            expiresAt: '2027-06-30',
        },
    ],
    webhooks: [{ url: 'https://clr.example.org/learncard/webhook' }],
};

const issuerDid = 'did:web:network.learncard.com:users:scde';
const authorityRecord = {
    name: 'scde-clr',
    endpoint: 'https://sa.example.com/scde-clr',
    did: 'did:web:sa.example.com:scde-clr',
    ownerDid: issuerDid,
};
const managerDid = 'did:web:network.learncard.com:manager:m1';
const managedDid = 'did:web:network.learncard.com:users:sc-greenville';

const makeMockCard = (): OrgLearnCard & {
    invoke: { [K in keyof OrgLearnCard['invoke']]: ReturnType<typeof vi.fn> };
} => ({
    id: { did: vi.fn((method?: string) => (method === 'web' ? issuerDid : 'did:key:z6Mk...')) },
    invoke: {
        getProfile: vi.fn().mockResolvedValue(undefined),
        createProfile: vi.fn().mockResolvedValue(issuerDid),
        updateProfile: vi.fn().mockResolvedValue(true),
        createProfileManager: vi.fn().mockResolvedValue(managerDid),
        getAuthGrants: vi.fn().mockResolvedValue([]),
        addAuthGrant: vi.fn().mockResolvedValue('grant-1'),
        getAPITokenForAuthGrant: vi.fn().mockResolvedValue('jwt-token-abc'),
        getRegisteredSigningAuthorities: vi.fn().mockResolvedValue([]),
        registerSigningAuthority: vi.fn().mockResolvedValue(true),
        setPrimaryRegisteredSigningAuthority: vi.fn().mockResolvedValue(true),
        getSigningAuthorities: vi.fn().mockResolvedValue([]),
        createSigningAuthority: vi.fn().mockResolvedValue(authorityRecord),
    },
});

const makeMockManager = () => ({
    invoke: {
        createManagedProfile: vi.fn().mockResolvedValue(managedDid),
        getManagedProfiles: vi.fn().mockResolvedValue({ hasMore: false, records: [] }),
    },
});

const withTmpProject = async (
    fn: (project: Awaited<ReturnType<typeof loadProject>>) => Promise<void>
) => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-org-apply-'));
    try {
        const project = await loadProject(cwd);
        await fn(project);
    } finally {
        await fs.rm(cwd, { recursive: true, force: true });
    }
};

const accountSpec: OrgSpec = { issuer: spec.issuer, serviceAccounts: spec.serviceAccounts };
const matchingGrant = {
    id: 'grant-1',
    name: 'ea-clr-issuer',
    status: 'active',
    scope: 'inbox:write inbox:read credentials:write credentials:read',
    expiresAt: '2027-06-30T00:00:00.000Z',
};

const makeExistingCard = () => {
    const card = makeMockCard();
    card.invoke.getProfile.mockResolvedValue(spec.issuer);
    card.invoke.getRegisteredSigningAuthorities.mockResolvedValue([
        {
            signingAuthority: { endpoint: authorityRecord.endpoint },
            relationship: { name: 'scde-clr', did: authorityRecord.did, isPrimary: true },
        },
    ]);
    card.invoke.getAuthGrants.mockResolvedValue([matchingGrant]);
    return card;
};

describe('service-account reconciliation', () => {
    it('rejects a malformed grant without an ID before attempting recovery', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValue([{ ...matchingGrant, id: undefined }]);
            await expect(
                applyOrg(accountSpec, card, project, {
                    secretsOut: path.join(path.dirname(project.envPath), 'secrets.env'),
                })
            ).rejects.toThrow('grant without an ID');
            expect(card.invoke.getAPITokenForAuthGrant).not.toHaveBeenCalled();
        });
    });

    it.each([
        { scope: 'inbox:read' },
        { expiresAt: '2028-06-30T00:00:00.000Z' },
        { expiresAt: undefined },
    ])('rejects drift without minting or persisting tokens: %j', async drift => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValue([{ ...matchingGrant, ...drift }]);
            const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
            await expect(applyOrg(accountSpec, card, project, { secretsOut })).rejects.toThrow(
                'grant has drifted'
            );
            await expect(applyOrg(accountSpec, card, project)).rejects.toThrow(
                'npx @learncard/cli token --revoke grant-1 then re-run org apply'
            );
            expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();
            expect(card.invoke.getAPITokenForAuthGrant).not.toHaveBeenCalled();
            await expect(fs.stat(secretsOut)).rejects.toMatchObject({ code: 'ENOENT' });
        });
    });

    it.each([{ scope: 'inbox:read' }, { expiresAt: undefined }])(
        'reports drift in dry-run without writes: %j',
        async drift => {
            await withTmpProject(async project => {
                const card = makeExistingCard();
                card.invoke.getAuthGrants.mockResolvedValue([{ ...matchingGrant, ...drift }]);
                const result = await applyOrg(accountSpec, card, project, {
                    dryRun: true,
                    secretsOut: path.join(path.dirname(project.envPath), 'secrets.env'),
                });
                expect(result.changes).toContainEqual(
                    expect.objectContaining({
                        resource: 'serviceAccount',
                        action: 'drifted',
                        detail: expect.stringContaining('token --revoke grant-1'),
                    })
                );
                expect(card.invoke.getAPITokenForAuthGrant).not.toHaveBeenCalled();
                expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();
                expect(await fs.readdir(path.dirname(project.envPath))).toEqual([]);
            });
        }
    );

    it('compares normalized scopes and equivalent expiry instants', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValue([
                {
                    ...matchingGrant,
                    scope: '  credentials:read\tcredentials:write\n inbox:read  inbox:write ',
                    expiresAt: '2027-06-29T20:00:00-04:00',
                },
            ]);
            const result = await applyOrg(accountSpec, card, project);
            expect(result.changes.every(change => change.action === 'unchanged')).toBe(true);
        });
    });

    it.each([undefined, null])('treats absent expiry as no expiry: %j', async expiresAt => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValue([{ ...matchingGrant, expiresAt }]);
            const withoutExpiry = {
                ...accountSpec,
                serviceAccounts: [
                    {
                        name: matchingGrant.name,
                        scopes: matchingGrant.scope.split(' '),
                    },
                ],
            };
            const result = await applyOrg(withoutExpiry, card, project);
            expect(result.changes.every(change => change.action === 'unchanged')).toBe(true);
            await expect(applyOrg(withoutExpiry, makeExistingCard(), project)).rejects.toThrow(
                'expiresAt'
            );
        });
    });

    it.each(['', 'OTHER=keep\n', 'OTHER=keep\nEA_CLR_ISSUER=\n'])(
        're-issues a missing or empty token (contents: %j)',
        async contents => {
            await withTmpProject(async project => {
                const card = makeExistingCard();
                const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
                if (contents) await fs.writeFile(secretsOut, contents);
                const result = await applyOrg(accountSpec, card, project, { secretsOut });
                expect(card.invoke.getAPITokenForAuthGrant).toHaveBeenCalledWith('grant-1');
                expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();
                expect(result.changes).toContainEqual({
                    resource: 'serviceAccount',
                    name: matchingGrant.name,
                    action: 'updated',
                    detail: 'token re-issued',
                });
                expect(result.outputs.serviceAccounts).toEqual([
                    { name: matchingGrant.name, grantId: 'grant-1', created: false },
                ]);
                expect(await fs.readFile(secretsOut, 'utf8')).toBe(
                    `${contents ? 'OTHER=keep\n' : ''}EA_CLR_ISSUER=jwt-token-abc\n`
                );
                expect((await fs.stat(secretsOut)).mode & 0o777).toBe(0o600);
                card.invoke.getAPITokenForAuthGrant.mockClear();
                const second = await applyOrg(accountSpec, card, project, { secretsOut });
                expect(second.changes.every(change => change.action === 'unchanged')).toBe(true);
                expect(card.invoke.getAPITokenForAuthGrant).not.toHaveBeenCalled();
            });
        }
    );

    it('only previews missing-token recovery during dry-run', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            const result = await applyOrg(accountSpec, card, project, {
                secretsOut: path.join(path.dirname(project.envPath), 'secrets.env'),
                dryRun: true,
            });
            expect(result.changes).toContainEqual(
                expect.objectContaining({
                    resource: 'serviceAccount',
                    action: 'would-update',
                    detail: 'token would be re-issued',
                })
            );
            expect(card.invoke.getAPITokenForAuthGrant).not.toHaveBeenCalled();
            expect(await fs.readdir(path.dirname(project.envPath))).toEqual([]);
        });
    });

    it('tightens permissions before opening, replaces duplicate keys, and preserves other lines', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValue([]);
            const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
            await fs.writeFile(
                secretsOut,
                '# keep\nOTHER=keep\nEA_CLR_ISSUER=old\nexport EA_CLR_ISSUER=older\n'
            );
            await fs.chmod(secretsOut, 0o644);
            const open = fs.open.bind(fs);
            const spy = vi.spyOn(fs, 'open').mockImplementation(async (file, flags, mode) => {
                if (String(file).startsWith(`${secretsOut}.`)) {
                    expect((await fs.stat(secretsOut)).mode & 0o777).toBe(0o600);
                    expect(flags).toBe('wx');
                    expect(mode).toBe(0o600);
                }
                return open(file, flags, mode);
            });
            try {
                await applyOrg(accountSpec, card, project, { secretsOut });
                expect(await fs.readFile(secretsOut, 'utf8')).toBe(
                    '# keep\nOTHER=keep\nEA_CLR_ISSUER=jwt-token-abc\n'
                );
            } finally {
                spy.mockRestore();
            }
        });
    });

    it.each(['symlink', 'directory', 'dangling symlink'])(
        'rejects a %s secrets path without touching its target',
        async kind => {
            await withTmpProject(async project => {
                const card = makeExistingCard();
                const dir = path.dirname(project.envPath);
                const secretsOut = path.join(dir, 'secrets.env');
                const target = path.join(dir, 'target.env');
                if (kind === 'directory') await fs.mkdir(secretsOut);
                else {
                    if (kind === 'symlink')
                        await fs.writeFile(target, 'DO_NOT_TOUCH=secret\n', { mode: 0o644 });
                    await fs.symlink(target, secretsOut);
                }
                await expect(applyOrg(accountSpec, card, project, { secretsOut })).rejects.toThrow(
                    'regular file'
                );
                expect(card.invoke.getAPITokenForAuthGrant).not.toHaveBeenCalled();
                card.invoke.getAuthGrants.mockResolvedValue([]);
                await expect(applyOrg(accountSpec, card, project, { secretsOut })).rejects.toThrow(
                    'regular file'
                );
                if (kind === 'symlink') {
                    expect(await fs.readFile(target, 'utf8')).toBe('DO_NOT_TOUCH=secret\n');
                    expect((await fs.stat(target)).mode & 0o777).toBe(0o644);
                }
            });
        }
    );

    it('closes a failed write and recovers on the next run without creating another grant', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValueOnce([]);
            const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
            await fs.writeFile(secretsOut, 'OTHER=keep\n');
            const originalOpen = fs.open.bind(fs);
            const close = vi.fn();
            const open = vi.spyOn(fs, 'open').mockImplementationOnce(async (file, flags, mode) => {
                const handle = await originalOpen(file, flags, mode);
                const originalWrite = handle.writeFile.bind(handle);
                vi.spyOn(handle, 'writeFile').mockImplementationOnce(async () => {
                    await originalWrite('EA_CLR_ISSUER=partial', 'utf8');
                    throw new Error('disk full');
                });
                const originalClose = handle.close.bind(handle);
                vi.spyOn(handle, 'close').mockImplementation(async () => {
                    close();
                    await originalClose();
                });
                return handle;
            });
            try {
                await expect(applyOrg(accountSpec, card, project, { secretsOut })).rejects.toThrow(
                    'disk full'
                );
                expect(close).toHaveBeenCalledOnce();
                expect(await fs.readFile(secretsOut, 'utf8')).toBe('OTHER=keep\n');
                expect(await fs.readdir(path.dirname(secretsOut))).toEqual(['secrets.env']);
            } finally {
                open.mockRestore();
            }
            const result = await applyOrg(accountSpec, card, project, { secretsOut });
            expect(card.invoke.addAuthGrant).toHaveBeenCalledOnce();
            expect(card.invoke.getAPITokenForAuthGrant).toHaveBeenCalledTimes(2);
            expect(result.changes).toContainEqual(
                expect.objectContaining({ action: 'updated', detail: 'token re-issued' })
            );
            expect(await fs.readFile(secretsOut, 'utf8')).toBe(
                'OTHER=keep\nEA_CLR_ISSUER=jwt-token-abc\n'
            );
        });
    });
});

describe('applyOrg', () => {
    it('creates every resource on a fresh project and writes the service-account token', async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            const manager = makeMockManager();
            const connectAsManager = vi.fn().mockResolvedValue(manager);
            const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            const result = await applyOrg(spec, card, project, { secretsOut, connectAsManager });

            expect(card.invoke.createProfile).toHaveBeenCalledWith({
                profileId: 'scde',
                displayName: 'South Carolina Department of Education',
                bio: '',
                shortBio: '',
            });
            expect(card.invoke.createSigningAuthority).toHaveBeenCalledTimes(1);
            expect(card.invoke.registerSigningAuthority).toHaveBeenCalledTimes(1);
            expect(card.invoke.setPrimaryRegisteredSigningAuthority).toHaveBeenCalledTimes(1);
            expect(card.invoke.createProfileManager).toHaveBeenCalledWith({
                displayName: 'SC Districts',
            });
            expect(connectAsManager).toHaveBeenCalledWith(managerDid);
            expect(manager.invoke.createManagedProfile).toHaveBeenCalledWith({
                profileId: 'sc-greenville',
                displayName: 'Greenville County Schools',
                bio: '',
                shortBio: '',
            });
            expect(card.invoke.addAuthGrant).toHaveBeenCalledWith({
                name: 'ea-clr-issuer',
                scope: 'inbox:write inbox:read credentials:write credentials:read',
                expiresAt: new Date('2027-06-30').toISOString(),
            });
            expect(card.invoke.getAPITokenForAuthGrant).toHaveBeenCalledWith('grant-1');

            const actions = result.changes.map(c => `${c.resource}:${c.action}`);
            expect(actions).toContain('issuer:created');
            expect(actions).toContain('signingAuthority:created');
            expect(actions).toContain('profileManager:created');
            expect(actions).toContain('managedProfile:created');
            expect(actions).toContain('serviceAccount:created');
            expect(actions).toContain('webhook:created');
            expect(project.env.WEBHOOK_URL).toBe('https://clr.example.org/learncard/webhook');

            expect(result.outputs.issuerDid).toBe(issuerDid);
            expect(result.outputs.managerDid).toBe(managerDid);
            expect(result.outputs.managed).toEqual([
                { profileId: 'sc-greenville', did: managedDid },
            ]);
            expect(result.outputs.serviceAccounts).toEqual([
                { name: 'ea-clr-issuer', grantId: 'grant-1', created: true },
            ]);

            expect(project.env.ORG_PROFILE_MANAGER_DID).toBe(managerDid);

            const secrets = await fs.readFile(secretsOut, 'utf8');
            expect(secrets).toBe('EA_CLR_ISSUER=jwt-token-abc\n');
            const stat = await fs.stat(secretsOut);
            expect(stat.mode & 0o777).toBe(0o600);

            log.mockRestore();
        });
    });

    it('reports everything unchanged and makes zero mutating calls on a second identical run', async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            card.invoke.getProfile.mockResolvedValue({
                profileId: 'scde',
                displayName: 'South Carolina Department of Education',
                did: issuerDid,
            });
            card.invoke.getRegisteredSigningAuthorities.mockResolvedValue([
                {
                    signingAuthority: { endpoint: authorityRecord.endpoint },
                    relationship: { name: 'scde-clr', did: authorityRecord.did, isPrimary: true },
                },
            ]);
            const manager = makeMockManager();
            manager.invoke.getManagedProfiles.mockResolvedValue({
                hasMore: false,
                records: [
                    {
                        profileId: 'sc-greenville',
                        displayName: 'Greenville County Schools',
                        did: managedDid,
                    },
                ],
            });
            card.invoke.getAuthGrants.mockResolvedValue([
                {
                    id: 'grant-1',
                    name: 'ea-clr-issuer',
                    status: 'active',
                    scope: spec.serviceAccounts![0]!.scopes.join(' '),
                    expiresAt: '2027-06-30T00:00:00.000Z',
                },
            ]);
            project.env.ORG_PROFILE_MANAGER_DID = managerDid;
            project.env.WEBHOOK_URL = 'https://clr.example.org/learncard/webhook';
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            const result = await applyOrg(spec, card, project, {
                connectAsManager: async () => manager,
            });

            expect(card.invoke.createProfile).not.toHaveBeenCalled();
            expect(card.invoke.updateProfile).not.toHaveBeenCalled();
            expect(card.invoke.createSigningAuthority).not.toHaveBeenCalled();
            expect(card.invoke.registerSigningAuthority).not.toHaveBeenCalled();
            expect(card.invoke.setPrimaryRegisteredSigningAuthority).not.toHaveBeenCalled();
            expect(card.invoke.createProfileManager).not.toHaveBeenCalled();
            expect(manager.invoke.createManagedProfile).not.toHaveBeenCalled();
            expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();
            expect(card.invoke.getAPITokenForAuthGrant).not.toHaveBeenCalled();

            expect(result.changes.every(c => c.action === 'unchanged')).toBe(true);
            expect(result.outputs.managed).toEqual([
                { profileId: 'sc-greenville', did: managedDid },
            ]);
            expect(result.outputs.serviceAccounts).toEqual([
                { name: 'ea-clr-issuer', grantId: 'grant-1', created: false },
            ]);

            log.mockRestore();
        });
    });

    it('dry-run reports would-create actions and calls no mutating methods', async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            const connectAsManager = vi.fn();

            const result = await applyOrg(spec, card, project, { dryRun: true, connectAsManager });
            expect(connectAsManager).not.toHaveBeenCalled();

            for (const key of [
                'createProfile',
                'updateProfile',
                'createSigningAuthority',
                'registerSigningAuthority',
                'setPrimaryRegisteredSigningAuthority',
                'createProfileManager',
                'addAuthGrant',
                'getAPITokenForAuthGrant',
            ] as const) {
                expect(card.invoke[key]).not.toHaveBeenCalled();
            }
            for (const key of ['getRegisteredSigningAuthorities', 'getAuthGrants'] as const) {
                expect(card.invoke[key]).not.toHaveBeenCalled();
            }

            const actions = result.changes.map(c => `${c.resource}:${c.action}`);
            expect(actions).toContain('issuer:would-create');
            expect(actions).toContain('signingAuthority:would-create');
            expect(actions).toContain('profileManager:would-create');
            expect(actions).toContain('managedProfile:would-create');
            expect(actions).toContain('serviceAccount:would-create');

            expect(result.outputs.issuerDid).toBe(issuerDid);
            expect(result.outputs.managerDid).toBeUndefined();
            expect(result.outputs.managed).toEqual([]);
            expect(result.outputs.serviceAccounts).toEqual([]);
            expect(project.env.ORG_PROFILE_MANAGER_DID).toBeUndefined();

            log.mockRestore();
        });
    });

    it('requires --secrets-out before creating a service account', async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            await expect(
                applyOrg(spec, card, project, { connectAsManager: async () => makeMockManager() })
            ).rejects.toThrow('--secrets-out');
            expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();

            log.mockRestore();
        });
    });
});
