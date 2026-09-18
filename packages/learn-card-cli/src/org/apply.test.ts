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
        updateAuthGrant: vi.fn().mockResolvedValue(true),
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
                { id: 'grant-1', name: 'ea-clr-issuer', status: 'active', scope: 'inbox:write' },
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
                applyOrg(spec, card, project, { connectAsManager: async () => makeMockManager() })
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
            });

            expect(card.invoke.addAuthGrant).toHaveBeenCalledWith(
                expect.objectContaining({ actAs: '*' })
            );

            log.mockRestore();
        });
    });

    it('updates an existing grant and reports it when actAs differs from the spec', async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            const existingGrant: AuthGrantWithActAs = {
                id: 'grant-1',
                name: 'ea-clr-issuer',
                status: 'active',
                scope: 'inbox:write',
                actAs: 'sc-greenville',
            };
            card.invoke.getAuthGrants.mockResolvedValue([existingGrant]);
            const log = vi.spyOn(console, 'log').mockImplementation(() => {});

            const specWithActAs: OrgSpec = {
                ...spec,
                serviceAccounts: [{ ...spec.serviceAccounts![0]!, actAs: '*' }],
            };

            const result = await applyOrg(specWithActAs, card, project, {
                connectAsManager: async () => makeMockManager(),
            });

            expect(card.invoke.updateAuthGrant).toHaveBeenCalledWith('grant-1', { actAs: '*' });
            expect(card.invoke.addAuthGrant).not.toHaveBeenCalled();
            expect(
                result.changes.find(
                    c => c.resource === 'serviceAccount' && c.name === 'ea-clr-issuer'
                )
            ).toMatchObject({ action: 'updated', detail: 'actAs' });

            log.mockRestore();
        });
    });

    it('leaves an existing grant unchanged when actAs already matches the spec', async () => {
        await withTmpProject(async project => {
            const card = makeMockCard();
            const existingGrant: AuthGrantWithActAs = {
                id: 'grant-1',
                name: 'ea-clr-issuer',
                status: 'active',
                scope: 'inbox:write',
                actAs: 'sc-greenville,sc-north',
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
            });

            expect(card.invoke.updateAuthGrant).not.toHaveBeenCalled();
            expect(
                result.changes.find(
                    c => c.resource === 'serviceAccount' && c.name === 'ea-clr-issuer'
                )
            ).toMatchObject({ action: 'unchanged' });

            log.mockRestore();
        });
    });
});
