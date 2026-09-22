import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applyOrg, type OrgLearnCard } from './apply';
import { loadProject } from '../project';
import type { OrgSpec } from './schema';
import type { AuthGrantWithActAs } from '../auth-grant';

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
    invoke: { [K in keyof OrgLearnCard['invoke']]: ReturnType<typeof vi.fn> } & {
        updateAuthGrant: ReturnType<typeof vi.fn>;
    };
} => ({
    id: { did: vi.fn((method?: string) => (method === 'web' ? issuerDid : 'did:key:z6Mk...')) },
    invoke: {
        getProfile: vi.fn().mockResolvedValue(undefined),
        createProfile: vi.fn().mockResolvedValue(issuerDid),
        updateProfile: vi.fn().mockResolvedValue(true),
        createProfileManager: vi.fn().mockResolvedValue(managerDid),
        getAuthGrants: vi.fn().mockResolvedValue([]),
        addAuthGrant: vi.fn().mockResolvedValue('grant-1'),
        updateAuthGrant: vi.fn().mockResolvedValue(true),
        getAPITokenForAuthGrant: vi.fn().mockResolvedValue('jwt-token-abc'),
        getRegisteredSigningAuthorities: vi.fn().mockResolvedValue([]),
        registerSigningAuthority: vi.fn().mockResolvedValue(true),
        setPrimaryRegisteredSigningAuthority: vi.fn().mockResolvedValue(true),
        getSigningAuthorities: vi.fn().mockResolvedValue([]),
        createSigningAuthority: vi.fn().mockResolvedValue(authorityRecord),
    },
});

const makeMockSigner = (registered: Array<Record<string, unknown>> = []) => ({
    invoke: {
        getRegisteredSigningAuthorities: vi.fn().mockResolvedValue(registered),
        getSigningAuthorities: vi.fn().mockResolvedValue([]),
        createSigningAuthority: vi.fn().mockResolvedValue(authorityRecord),
        registerSigningAuthority: vi.fn().mockResolvedValue(true),
        setPrimaryRegisteredSigningAuthority: vi.fn().mockResolvedValue(true),
    },
});
const primaryDistrictSigner = () =>
    makeMockSigner([
        {
            signingAuthority: { endpoint: authorityRecord.endpoint },
            relationship: { name: 'scde-clr', did: authorityRecord.did, isPrimary: true },
        },
    ]);

const makeMockManager = () => ({
    invoke: {
        createManagedProfile: vi.fn().mockResolvedValue(managedDid),
        getManagedProfiles: vi.fn().mockResolvedValue({ hasMore: false, records: [] }),
        getProfileManagerProfile: vi.fn().mockResolvedValue({
            id: 'm1',
            created: '2026-01-01T00:00:00.000Z',
            displayName: 'SC Districts',
        }),
        updateProfileManagerProfile: vi.fn().mockResolvedValue(true),
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

const selectedSigner = {
    SIGNING_AUTHORITY_NAME: 'scde-clr',
    SIGNING_AUTHORITY_ENDPOINT: authorityRecord.endpoint,
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
                'revoke it (npx @learncard/cli token --revoke grant-1) and re-run org apply with --secrets-out'
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
            Object.assign(project.env, selectedSigner);
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
            Object.assign(project.env, selectedSigner);
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
            Object.assign(project.env, selectedSigner);
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValueOnce([]);
            const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
            await fs.writeFile(secretsOut, 'OTHER=keep\n');
            const originalOpen = fs.open.bind(fs);
            const close = vi.fn();
            let injected = false;
            const open = vi.spyOn(fs, 'open').mockImplementation(async (file, flags, mode) => {
                const handle = await originalOpen(file, flags, mode);
                if (injected || !String(file).startsWith(`${secretsOut}.`)) return handle;
                injected = true;
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

            const districtSigner = makeMockSigner();
            const connectAsManagedSigner = vi.fn().mockResolvedValue(districtSigner);
            const result = await applyOrg(spec, card, project, {
                secretsOut,
                connectAsManager,
                connectAsManagedSigner,
            });

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
            expect(connectAsManagedSigner).toHaveBeenCalledWith(managedDid);
            expect(districtSigner.invoke.createSigningAuthority).toHaveBeenCalledWith('scde-clr');
            expect(districtSigner.invoke.registerSigningAuthority).toHaveBeenCalledWith(
                authorityRecord.endpoint,
                authorityRecord.name,
                authorityRecord.did
            );
            expect(project.env.SIGNING_AUTHORITY_NAME).toBe('scde-clr');
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
            expect(result.changes).toContainEqual({
                resource: 'signingAuthority',
                name: 'sc-greenville/scde-clr',
                action: 'created',
            });
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
            Object.assign(project.env, selectedSigner);
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
                connectAsManagedSigner: async () => primaryDistrictSigner(),
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
                'updateAuthGrant',
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
                applyOrg(spec, card, project, {
                    connectAsManager: async () => makeMockManager(),
                    connectAsManagedSigner: async () => primaryDistrictSigner(),
                })
            ).rejects.toThrow('--secrets-out');
            expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();

            log.mockRestore();
        });
    });

    it("joins a new service account's actAs list with a comma when creating the grant", async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            const specWithActAs: OrgSpec = {
                ...spec,
                serviceAccounts: [
                    { ...spec.serviceAccounts![0]!, actAs: ['sc-greenville', 'sc-north'] },
                ],
            };

            await applyOrg(specWithActAs, card, project, {
                secretsOut,
                connectAsManager: async () => makeMockManager(),
                connectAsManagedSigner: async () => primaryDistrictSigner(),
            });

            expect(card.invoke.addAuthGrant).toHaveBeenCalledWith({
                name: 'ea-clr-issuer',
                scope: 'inbox:write inbox:read credentials:write credentials:read',
                expiresAt: new Date('2027-06-30').toISOString(),
                actAs: 'sc-greenville,sc-north',
            });

            log.mockRestore();
        });
    });

    it('passes "*" straight through as actAs when creating the grant', async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            const specWithActAs: OrgSpec = {
                ...spec,
                serviceAccounts: [{ ...spec.serviceAccounts![0]!, actAs: '*' }],
            };

            await applyOrg(specWithActAs, card, project, {
                secretsOut,
                connectAsManager: async () => makeMockManager(),
                connectAsManagedSigner: async () => primaryDistrictSigner(),
            });

            expect(card.invoke.addAuthGrant).toHaveBeenCalledWith(
                expect.objectContaining({ actAs: '*' })
            );

            log.mockRestore();
        });
    });

    it('fails with a revoke + re-create hint when actAs differs from the existing grant', async () => {
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
            const existingGrant: AuthGrantWithActAs = {
                id: 'grant-1',
                name: 'ea-clr-issuer',
                status: 'active',
                scope: matchingGrant.scope,
                expiresAt: matchingGrant.expiresAt,
                actAs: 'sc-greenville',
            };
            card.invoke.getAuthGrants.mockResolvedValue([existingGrant]);
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            const specWithActAs: OrgSpec = {
                ...spec,
                serviceAccounts: [{ ...spec.serviceAccounts![0]!, actAs: '*' }],
            };

            const message =
                'Service account "ea-clr-issuer" grant has drifted (actAs sc-greenville -> any managed profile). These are fixed when the token is minted — revoke it (npx @learncard/cli token --revoke grant-1)';

            const preview = await applyOrg(specWithActAs, card, project, {
                dryRun: true,
                connectAsManager: async () => makeMockManager(),
                connectAsManagedSigner: async () => primaryDistrictSigner(),
            });
            expect(
                preview.changes.find(
                    c => c.resource === 'serviceAccount' && c.name === 'ea-clr-issuer'
                )
            ).toMatchObject({ action: 'drifted', detail: expect.stringContaining(message) });

            await expect(
                applyOrg(specWithActAs, card, project, {
                    connectAsManager: async () => makeMockManager(),
                    connectAsManagedSigner: async () => primaryDistrictSigner(),
                })
            ).rejects.toThrow(message);

            expect(card.invoke.updateAuthGrant).not.toHaveBeenCalled();
            expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();

            log.mockRestore();
        });
    });

    it('fails when the spec drops actAs from a grant that has it', async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            const existingGrant: AuthGrantWithActAs = {
                id: 'grant-1',
                name: 'ea-clr-issuer',
                status: 'active',
                scope: matchingGrant.scope,
                expiresAt: matchingGrant.expiresAt,
                actAs: '*',
            };
            card.invoke.getAuthGrants.mockResolvedValue([existingGrant]);
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            await expect(
                applyOrg(spec, card, project, {
                    connectAsManager: async () => makeMockManager(),
                    connectAsManagedSigner: async () => primaryDistrictSigner(),
                })
            ).rejects.toThrow('grant has drifted (actAs any managed profile -> no delegation)');
            expect(card.invoke.updateAuthGrant).not.toHaveBeenCalled();

            log.mockRestore();
        });
    });

    it.each(['sc-greenville,sc-north', 'sc-north,sc-greenville', ' sc-north , sc-greenville '])(
        'leaves an existing grant unchanged when actAs matches the spec as a set: %j',
        async grantActAs => {
            await withTmpProject(async project => {
                const card = makeMockCard();
                const existingGrant: AuthGrantWithActAs = {
                    id: 'grant-1',
                    name: 'ea-clr-issuer',
                    status: 'active',
                    scope: matchingGrant.scope,
                    expiresAt: matchingGrant.expiresAt,
                    actAs: grantActAs,
                };
                card.invoke.getAuthGrants.mockResolvedValue([existingGrant]);
                const log = vi.spyOn(console, 'log').mockImplementation(() => {});

                const specWithActAs: OrgSpec = {
                    ...spec,
                    serviceAccounts: [
                        { ...spec.serviceAccounts![0]!, actAs: ['sc-greenville', 'sc-north'] },
                    ],
                };

                const result = await applyOrg(specWithActAs, card, project, {
                    connectAsManager: async () => makeMockManager(),
                    connectAsManagedSigner: async () => primaryDistrictSigner(),
                });

                expect(card.invoke.updateAuthGrant).not.toHaveBeenCalled();
                expect(
                    result.changes.find(
                        c => c.resource === 'serviceAccount' && c.name === 'ea-clr-issuer'
                    )
                ).toMatchObject({ action: 'unchanged' });

                log.mockRestore();
            });
        }
    );
});

describe('signing-authority reconciliation', () => {
    const selfHosted = {
        type: 'self-hosted' as const,
        name: 'scde-clr',
        endpoint: authorityRecord.endpoint,
        did: authorityRecord.did,
    };
    const selfHostedSpec: OrgSpec = {
        issuer: { ...spec.issuer, signingAuthority: selfHosted },
    };
    const registration = (did: string, isPrimary = true) => ({
        signingAuthority: { endpoint: authorityRecord.endpoint },
        relationship: { name: 'scde-clr', did, isPrimary },
    });
    const selected = {
        SIGNING_AUTHORITY_NAME: 'scde-clr',
        SIGNING_AUTHORITY_ENDPOINT: authorityRecord.endpoint,
    };

    it('fails clearly when the registered DID differs from the spec', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getRegisteredSigningAuthorities.mockResolvedValue([
                registration('did:web:sa.example.com:rotated'),
            ]);
            await expect(applyOrg(selfHostedSpec, card, project)).rejects.toThrow(
                /registered at .* with DID did:web:sa\.example\.com:rotated, but the spec declares/
            );
            expect(card.invoke.registerSigningAuthority).not.toHaveBeenCalled();
            expect(card.invoke.setPrimaryRegisteredSigningAuthority).not.toHaveBeenCalled();
            expect(project.env.SIGNING_AUTHORITY_NAME).toBeUndefined();

            const preview = await applyOrg(selfHostedSpec, card, project, { dryRun: true });
            expect(preview.changes).toContainEqual(
                expect.objectContaining({ resource: 'signingAuthority', action: 'drifted' })
            );
        });
    });

    it('persists the selection in .env when the registration already matches', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});
            const preview = await applyOrg(selfHostedSpec, card, project, { dryRun: true });
            expect(preview.changes).toContainEqual(
                expect.objectContaining({
                    resource: 'signingAuthority',
                    action: 'would-update',
                    detail: expect.stringContaining('.env'),
                })
            );
            expect(project.env.SIGNING_AUTHORITY_NAME).toBeUndefined();

            const result = await applyOrg(selfHostedSpec, card, project);
            expect(result.changes).toContainEqual(
                expect.objectContaining({ resource: 'signingAuthority', action: 'updated' })
            );
            expect(project.env).toMatchObject(selected);
            expect(card.invoke.setPrimaryRegisteredSigningAuthority).not.toHaveBeenCalled();

            const second = await applyOrg(selfHostedSpec, card, project);
            expect(second.changes).toContainEqual({
                resource: 'signingAuthority',
                name: 'scde-clr',
                action: 'unchanged',
            });
            log.mockRestore();
        });
    });

    it('persists a hosted signer selection that was removed from .env', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            const hostedSpec: OrgSpec = { issuer: spec.issuer };
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});
            const preview = await applyOrg(hostedSpec, card, project, { dryRun: true });
            expect(preview.changes).toContainEqual(
                expect.objectContaining({
                    resource: 'signingAuthority',
                    action: 'would-update',
                    detail: expect.stringContaining('.env'),
                })
            );
            const result = await applyOrg(hostedSpec, card, project);
            expect(result.changes).toContainEqual(
                expect.objectContaining({ resource: 'signingAuthority', action: 'updated' })
            );
            expect(project.env).toMatchObject(selected);
            expect(card.invoke.createSigningAuthority).not.toHaveBeenCalled();
            expect(card.invoke.setPrimaryRegisteredSigningAuthority).not.toHaveBeenCalled();
            const second = await applyOrg(hostedSpec, card, project);
            expect(second.changes).toContainEqual({
                resource: 'signingAuthority',
                name: 'scde-clr',
                action: 'unchanged',
            });
            log.mockRestore();
        });
    });

    it('persists the selection when it has to set the registration primary', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getRegisteredSigningAuthorities.mockResolvedValue([
                registration(authorityRecord.did, false),
            ]);
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});
            const result = await applyOrg(selfHostedSpec, card, project);
            expect(card.invoke.setPrimaryRegisteredSigningAuthority).toHaveBeenCalledWith(
                authorityRecord.endpoint,
                'scde-clr'
            );
            expect(result.changes).toContainEqual(
                expect.objectContaining({ action: 'updated', detail: 'set primary' })
            );
            expect(project.env).toMatchObject(selected);
            log.mockRestore();
        });
    });
});

describe('profile-manager reconciliation', () => {
    const managerSpec: OrgSpec = { issuer: spec.issuer, profileManager: spec.profileManager };
    const existingManaged = {
        hasMore: false,
        records: [
            {
                profileId: 'sc-greenville',
                displayName: 'Greenville County Schools',
                did: managedDid,
            },
        ],
    };

    it('renames the manager when the spec displayName changes', async () => {
        await withTmpProject(async project => {
            Object.assign(project.env, selectedSigner);
            const card = makeExistingCard();
            const manager = makeMockManager();
            manager.invoke.getProfileManagerProfile.mockResolvedValue({
                id: 'm1',
                created: '2026-01-01T00:00:00.000Z',
                displayName: 'Old Districts',
            });
            manager.invoke.getManagedProfiles.mockResolvedValue(existingManaged);
            project.env.ORG_PROFILE_MANAGER_DID = managerDid;

            const preview = await applyOrg(managerSpec, card, project, {
                dryRun: true,
                connectAsManager: async () => manager,
                connectAsManagedSigner: async () => primaryDistrictSigner(),
            });
            expect(preview.changes).toContainEqual(
                expect.objectContaining({
                    resource: 'profileManager',
                    action: 'would-update',
                    detail: 'displayName',
                })
            );
            expect(manager.invoke.updateProfileManagerProfile).not.toHaveBeenCalled();

            const result = await applyOrg(managerSpec, card, project, {
                connectAsManager: async () => manager,
                connectAsManagedSigner: async () => primaryDistrictSigner(),
            });
            expect(manager.invoke.updateProfileManagerProfile).toHaveBeenCalledWith({
                displayName: 'SC Districts',
            });
            expect(result.changes).toContainEqual(
                expect.objectContaining({
                    resource: 'profileManager',
                    action: 'updated',
                    detail: 'displayName',
                })
            );
        });
    });

    it('renames a managed profile when the spec displayName changes', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            const manager = makeMockManager();
            manager.invoke.getManagedProfiles.mockResolvedValue({
                hasMore: false,
                records: [{ ...existingManaged.records[0], displayName: 'Greenville Schools' }],
            });
            const managedCard = {
                invoke: { getProfile: vi.fn(), updateProfile: vi.fn().mockResolvedValue(true) },
            };
            const connectAsManaged = vi.fn().mockResolvedValue(managedCard);
            project.env.ORG_PROFILE_MANAGER_DID = managerDid;

            const preview = await applyOrg(managerSpec, card, project, {
                dryRun: true,
                connectAsManager: async () => manager,
                connectAsManagedSigner: async () => primaryDistrictSigner(),
                connectAsManaged,
            });
            expect(preview.changes).toContainEqual(
                expect.objectContaining({
                    resource: 'managedProfile',
                    action: 'would-update',
                    detail: 'displayName',
                })
            );
            expect(connectAsManaged).not.toHaveBeenCalled();

            const result = await applyOrg(managerSpec, card, project, {
                connectAsManager: async () => manager,
                connectAsManagedSigner: async () => primaryDistrictSigner(),
                connectAsManaged,
            });
            expect(connectAsManaged).toHaveBeenCalledWith(managedDid);
            expect(managedCard.invoke.updateProfile).toHaveBeenCalledWith({
                displayName: 'Greenville County Schools',
            });
            expect(result.changes).toContainEqual(
                expect.objectContaining({
                    resource: 'managedProfile',
                    action: 'updated',
                    detail: 'displayName',
                })
            );
            expect(manager.invoke.createManagedProfile).not.toHaveBeenCalled();
        });
    });
});

describe('service-account lookup', () => {
    const page = (index: number) =>
        Array.from({ length: 100 }, (_, i) => ({
            id: `other-${index}-${i}`,
            name: `other-${index}-${i}`,
            status: 'active',
            scope: 'inbox:read',
            createdAt: new Date(Date.UTC(2026, 0, 1, 0, index, i)).toISOString(),
        }));

    it('pages through grants before deciding an account is absent', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            const first = page(1);
            card.invoke.getAuthGrants
                .mockResolvedValueOnce(first)
                .mockResolvedValueOnce([
                    { ...matchingGrant, createdAt: '2025-12-31T00:00:00.000Z' },
                ]);
            const result = await applyOrg(accountSpec, card, project);
            expect(card.invoke.getAuthGrants).toHaveBeenCalledTimes(2);
            expect(card.invoke.getAuthGrants).toHaveBeenNthCalledWith(1, {
                limit: 100,
                cursor: undefined,
                query: { name: 'ea-clr-issuer', status: 'active' },
            });
            expect(card.invoke.getAuthGrants).toHaveBeenNthCalledWith(2, {
                limit: 100,
                cursor: first.at(-1)!.createdAt,
                query: { name: 'ea-clr-issuer', status: 'active' },
            });
            expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();
            expect(result.outputs.serviceAccounts).toEqual([
                { name: 'ea-clr-issuer', grantId: 'grant-1', created: false },
            ]);
        });
    });

    it('stops paging on a short page and creates the grant', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValueOnce(page(1)).mockResolvedValueOnce([]);
            const secretsOut = path.join(path.dirname(project.envPath), 'secrets.env');
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});
            await applyOrg(accountSpec, card, project, { secretsOut });
            expect(card.invoke.getAuthGrants).toHaveBeenCalledTimes(2);
            expect(card.invoke.addAuthGrant).toHaveBeenCalledOnce();
            log.mockRestore();
        });
    });

    it('refuses to reconcile while another apply holds the secrets lock, and releases its own', async () => {
        await withTmpProject(async project => {
            const card = makeExistingCard();
            card.invoke.getAuthGrants.mockResolvedValue([]);
            const dir = path.dirname(project.envPath);
            const secretsOut = path.join(dir, 'secrets.env');
            const lockPath = path.join(dir, '.secrets.env.lock');
            await fs.writeFile(lockPath, '');
            await expect(applyOrg(accountSpec, card, project, { secretsOut })).rejects.toThrow(
                'Another org apply is reconciling service accounts'
            );
            expect(card.invoke.getAuthGrants).not.toHaveBeenCalled();
            expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();
            await fs.rm(lockPath);

            const log = vi.spyOn(console, 'log').mockImplementation(() => {});
            await applyOrg(accountSpec, card, project, { secretsOut });
            expect(card.invoke.addAuthGrant).toHaveBeenCalledOnce();
            expect(await fs.readdir(dir)).not.toContain('.secrets.env.lock');
            log.mockRestore();
        });
    });
});
