import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fs from 'fs/promises';
import * as project from './project';
import { out } from './out';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    SEND_MJS,
    parseEnv,
    upsertEnv,
    toProfileId,
    isPlaceholderRecipient,
    invalidRecipientReason,
    resolveRecipient,
    RECIPIENT_PROMPT,
    personalizeSendMjs,
    withManagedIssuer,
    runSend,
} from './send';

const fakePrompts = (answers: string[], interactive = true) => {
    const asked: string[] = [];
    return {
        asked,
        prompts: {
            interactive,
            ask: async (question: string, fallback: string) => {
                asked.push(question);
                return answers.shift() ?? fallback;
            },
            close: () => {},
        },
    };
};

describe('send command', () => {
    it('ships the exact send.mjs the Quickstart docs show', () => {
        const docsSnippet = readFileSync(
            resolve(__dirname, '../../../docs/snippets/quickstart/send.mjs'),
            'utf8'
        );
        expect(SEND_MJS).toBe(docsSnippet);
    });

    it('parses and upserts .env without touching unrelated lines', () => {
        const original = '# comment\nOTHER=1\nSECURE_SEED=old\n';
        expect(parseEnv(original)).toEqual({ OTHER: '1', SECURE_SEED: 'old' });
        expect(upsertEnv(original, { SECURE_SEED: 'new', PROFILE_ID: 'acme' })).toBe(
            '# comment\nOTHER=1\nSECURE_SEED=new\nPROFILE_ID=acme\n'
        );
        expect(upsertEnv('', { SECURE_SEED: 'x' })).toBe('SECURE_SEED=x\n');
    });

    it('derives a URL-safe profile id with a random suffix', () => {
        expect(toProfileId('Acme Learning, Inc.')).toMatch(/^acme-learning-inc-[a-z0-9]{4}$/);
        expect(toProfileId('!!!')).toMatch(/^issuer-[a-z0-9]{4}$/);
        expect(toProfileId('x'.repeat(60)).length).toBeLessThanOrEqual(40);
    });
});

describe('recipient validation', () => {
    it('flags RFC 2606 / 6761 placeholder domains but not real ones', () => {
        expect(isPlaceholderRecipient('you@example.com')).toBe(true);
        expect(isPlaceholderRecipient('YOU@EXAMPLE.ORG')).toBe(true);
        expect(isPlaceholderRecipient('a@sub.example.net')).toBe(true);
        expect(isPlaceholderRecipient('a@foo.test')).toBe(true);
        expect(isPlaceholderRecipient('a@host.invalid')).toBe(true);
        expect(isPlaceholderRecipient('a@localhost')).toBe(true);
        expect(isPlaceholderRecipient('a@test')).toBe(true);
        expect(isPlaceholderRecipient('a@contest.com')).toBe(false);
        expect(isPlaceholderRecipient('a@latest.io')).toBe(false);
        expect(isPlaceholderRecipient('a@test.com')).toBe(false);
        expect(isPlaceholderRecipient('a@myexample.com')).toBe(false);
        expect(isPlaceholderRecipient('a@example.co.uk')).toBe(false);
        expect(isPlaceholderRecipient('+15555550100')).toBe(false);
    });

    it('explains why a recipient is unusable', () => {
        expect(invalidRecipientReason('you@example.com')).toMatch(/placeholder/);
        expect(invalidRecipientReason('Not A Recipient!')).toMatch(/not an email/);
        expect(invalidRecipientReason('')).toBe(
            'Enter an email, phone number, profile ID, or DID.'
        );
        expect(invalidRecipientReason('me@acme.org')).toBeUndefined();
        expect(invalidRecipientReason('+15555550100')).toBeUndefined();
        expect(invalidRecipientReason('cs-exampleville')).toBeUndefined();
        expect(invalidRecipientReason('did:web:network.learncard.com:users:exde')).toBeUndefined();
    });

    it('accepts a valid recipient without prompting', async () => {
        const { prompts, asked } = fakePrompts([]);
        expect(await resolveRecipient(' me@acme.org ', prompts)).toBe('me@acme.org');
        expect(asked).toEqual([]);
    });

    it('prompts when the recipient is omitted', async () => {
        const { prompts, asked } = fakePrompts(['me@acme.org']);
        expect(await resolveRecipient(undefined, prompts)).toBe('me@acme.org');
        expect(asked).toEqual([RECIPIENT_PROMPT]);
    });

    it('re-prompts interactively until a placeholder is replaced', async () => {
        const { prompts, asked } = fakePrompts(['not a recipient', 'me@acme.org']);
        expect(await resolveRecipient('you@example.com', prompts)).toBe('me@acme.org');
        expect(asked).toEqual([RECIPIENT_PROMPT, RECIPIENT_PROMPT]);
    });

    it('re-prompts with a hint when Enter is pressed on an empty line', async () => {
        const { prompts, asked } = fakePrompts(['', '  ', 'me@acme.org']);
        expect(await resolveRecipient(undefined, prompts)).toBe('me@acme.org');
        expect(asked).toHaveLength(3);
    });

    it('fails fast on a missing recipient when non-interactive', async () => {
        const { prompts, asked } = fakePrompts(['me@acme.org'], false);
        await expect(resolveRecipient(undefined, prompts)).rejects.toThrow(/recipient is required/);
        expect(asked).toEqual([]);
    });

    it('fails fast on a placeholder when non-interactive', async () => {
        const { prompts, asked } = fakePrompts(['me@acme.org'], false);
        await expect(resolveRecipient('you@example.com', prompts)).rejects.toThrow(
            /placeholder address/
        );
        expect(asked).toEqual([]);
    });
});

describe('personalizeSendMjs', () => {
    const managedDid = 'did:web:network.learncard.com:users:managed';
    const script = withManagedIssuer(
        personalizeSendMjs('Parent', {
            name: 'Managed badge',
            description: 'Sent as managed.',
        }),
        managedDid
    );
    const execute = (env: Record<string, string>, initLearnCard: ReturnType<typeof vi.fn>) => {
        const body = script
            .split('\n')
            .filter(line => !line.startsWith('import '))
            .join('\n');
        return new Function(
            'initLearnCard',
            'process',
            'randomUUID',
            'console',
            `return (async () => {${body}})();`
        )(initLearnCard, { env, argv: ['node', 'send.mjs', 'me@acme.org'] }, () => 'uuid', {
            log: vi.fn(),
        });
    };

    it('re-runs the managed script with didWeb and issues as that profile', async () => {
        const card = {
            id: { did: () => managedDid },
            invoke: {
                getProfile: vi.fn().mockResolvedValue({ profileId: 'managed' }),
                issueCredential: vi.fn().mockResolvedValue({ proof: {} }),
                send: vi.fn().mockResolvedValue({ uri: 'boost-uri' }),
            },
        };
        const initLearnCard = vi.fn().mockResolvedValue(card);
        await execute({ SECURE_SEED: 'parent-seed', MANAGED_DID: managedDid }, initLearnCard);
        expect(initLearnCard).toHaveBeenCalledWith({
            seed: 'parent-seed',
            network: true,
            didWeb: managedDid,
        });
        expect(card.invoke.issueCredential).toHaveBeenCalledWith(
            expect.objectContaining({ issuer: managedDid })
        );
        expect(script).not.toContain('createProfile');
    });

    it.each([undefined, 'did:web:other:users:another'])(
        'fails closed for MANAGED_DID=%s',
        async did => {
            const initLearnCard = vi.fn();
            await expect(execute(did ? { MANAGED_DID: did } : {}, initLearnCard)).rejects.toThrow(
                'MANAGED_DID is missing or changed'
            );
            expect(initLearnCard).not.toHaveBeenCalled();
        }
    );

    it('does not create a parent profile when the managed profile is missing', async () => {
        const initLearnCard = vi
            .fn()
            .mockResolvedValue({ invoke: { getProfile: vi.fn().mockResolvedValue(null) } });
        await expect(execute({ MANAGED_DID: managedDid }, initLearnCard)).rejects.toThrow(
            'managed issuer profile could not be found'
        );
    });

    it('substitutes the display name, badge name, and description', async () => {
        const { personalizeSendMjs } = await import('./send');
        const out = personalizeSendMjs('Acme Learning', {
            name: 'Welcome to Acme',
            description: 'You joined.',
        });
        expect(out).toContain('displayName: "Acme Learning"');
        expect(out).toContain('name: "Welcome to Acme"');
        expect(out).not.toContain('Quickstart Complete');
        expect(out).toContain('description: "You joined."');
    });
});

describe('classifyRecipient', () => {
    it('detects each recipient kind the network routes on', async () => {
        const { classifyRecipient } = await import('./send');
        expect(classifyRecipient('you@example.com')).toBe('email');
        expect(classifyRecipient('+15555550123')).toBe('phone');
        expect(classifyRecipient('did:web:network.learncard.com:users:exde')).toBe('did');
        expect(classifyRecipient('cs-exampleville')).toBe('profileId');
    });

    it('rejects anything else with an example', async () => {
        const { classifyRecipient } = await import('./send');
        expect(() => classifyRecipient('Not A Recipient!')).toThrow(/profile ID, or DID/);
    });
});

describe('send --as script generation', () => {
    afterEach(() => vi.restoreAllMocks());

    it.each([false, true])(
        'preserves the managed issuer with existing script=%s',
        async existing => {
            const managedDid = 'did:web:staging.network.learncard.com:users:managed';
            const loaded = {
                env: { SECURE_SEED: 'seed', PROFILE_ID: 'parent' },
                envPath: '/unused/.env',
                existing: '',
            };
            vi.spyOn(project, 'loadProject').mockResolvedValue(loaded);
            vi.spyOn(project, 'createPrompts').mockReturnValue(fakePrompts([], false).prompts);
            vi.spyOn(project, 'ensureIdentity').mockResolvedValue({
                seed: 'seed',
                profileId: 'parent',
                displayName: 'Parent',
            });
            const card = {
                id: { did: () => managedDid },
                invoke: {
                    getProfile: vi
                        .fn()
                        .mockResolvedValue({ profileId: 'managed', displayName: 'Managed' }),
                    issueCredential: vi.fn().mockResolvedValue({}),
                    send: vi.fn().mockResolvedValue({ uri: 'boost-uri', activityId: 'activity-1' }),
                },
            };
            vi.spyOn(project, 'connectAsManaged').mockResolvedValue(
                card as unknown as Awaited<ReturnType<typeof project.connectAsManaged>>
            );
            const save = vi.spyOn(project, 'saveProject').mockResolvedValue();
            const stat = vi.spyOn(fs, 'stat');
            if (existing) stat.mockResolvedValue({} as Awaited<ReturnType<typeof fs.stat>>);
            else stat.mockRejectedValue(new Error('ENOENT'));
            const write = vi.spyOn(fs, 'writeFile').mockResolvedValue();
            const log = vi.spyOn(out, 'log').mockImplementation(() => {});
            const set = vi.spyOn(out, 'set').mockImplementation(patch => patch);

            await runSend('me@acme.org', { as: 'managed', yes: true, network: 'staging' });

            if (existing) {
                expect(save).not.toHaveBeenCalled();
                expect(write).not.toHaveBeenCalled();
                expect(log).toHaveBeenCalledWith(
                    expect.stringContaining('may use a different issuer')
                );
                expect(set).toHaveBeenCalledWith(expect.objectContaining({ files: [] }));
            } else {
                expect(save).toHaveBeenCalledWith(loaded, { MANAGED_DID: managedDid });
                expect(write).toHaveBeenCalledWith(
                    expect.stringContaining('send.mjs'),
                    expect.stringContaining('didWeb: process.env.MANAGED_DID')
                );
                expect(save.mock.invocationCallOrder[0]).toBeLessThan(
                    write.mock.invocationCallOrder[0]!
                );
                expect(set).toHaveBeenCalledWith(
                    expect.objectContaining({ files: ['./send.mjs'] })
                );
                const generated = String(write.mock.calls[0]?.[1]);
                const body = generated
                    .split('\n')
                    .filter(line => !line.startsWith('import '))
                    .join('\n');
                const initLearnCard = vi.fn().mockResolvedValue(card);
                card.invoke.issueCredential.mockClear();
                await new Function(
                    'initLearnCard',
                    'process',
                    'randomUUID',
                    'console',
                    `return (async () => {${body}})();`
                )(
                    initLearnCard,
                    {
                        env: { SECURE_SEED: 'seed', MANAGED_DID: managedDid },
                        argv: ['node', 'send.mjs', 'me@acme.org'],
                    },
                    () => 'uuid',
                    { log: vi.fn() }
                );
                expect(initLearnCard).toHaveBeenCalledWith({
                    seed: 'seed',
                    network: project.STAGING_NETWORK,
                    cloud: { url: 'https://staging.cloud.learncard.com/trpc' },
                    didWeb: managedDid,
                });
                expect(card.invoke.issueCredential).toHaveBeenCalledWith(
                    expect.objectContaining({ issuer: managedDid })
                );
            }
        }
    );
});
