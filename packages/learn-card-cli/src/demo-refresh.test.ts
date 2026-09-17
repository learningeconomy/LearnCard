import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    init: vi.fn(),
    question: vi.fn(),
    close: vi.fn(),
    log: vi.fn(),
    set: vi.fn(),
    preflight: vi.fn(),
}));
vi.mock('@learncard/init', () => ({ initLearnCard: mocks.init }));
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
vi.mock('./project', () => ({ resolveServices: (_: unknown, network: string) => ({ network }) }));
vi.mock('./demo-refresh-ui', () => ({ getRefreshDemoUiConfig: mocks.preflight }));
import { runRefreshDemo } from './demo-refresh';
const oldTTY = process.stdin.isTTY;
const oldYes = process.env.LC_YES;
beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    delete process.env.LC_YES;
});
afterEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: oldTTY, configurable: true });
    if (oldYes === undefined) delete process.env.LC_YES;
    else process.env.LC_YES = oldYes;
});
describe('interactive frontend refresh demonstration', () => {
    it.each([{ yes: true }, { json: true }])(
        'rejects auto-advance flags before creating accounts: %j',
        async flags => {
            await expect(runRefreshDemo({ ui: true, ...flags })).rejects.toThrow(
                'interactive terminal'
            );
            expect(mocks.init).not.toHaveBeenCalled();
            expect(mocks.preflight).not.toHaveBeenCalled();
        }
    );
    it('rejects piped input and LC_YES=1', async () => {
        Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
        await expect(runRefreshDemo({ ui: true })).rejects.toThrow('interactive terminal');
        Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
        process.env.LC_YES = '1';
        await expect(runRefreshDemo({ ui: true })).rejects.toThrow('interactive terminal');
        expect(mocks.init).not.toHaveBeenCalled();
    });
    it('waits for real app saves and never accepts or refreshes on the holder’s behalf', async () => {
        mocks.preflight.mockResolvedValue({
            appOrigin: 'http://localhost:3000',
            cloud: 'http://localhost:4100/trpc',
            notificationsWebhook: 'http://localhost:5200/api/notifications/send',
        });
        let prompts = 0;
        mocks.question.mockImplementation(async () => {
            prompts++;
            return '';
        });
        const original = { id: 'urn:uuid:demo', name: 'Provisional Course Certificate' };
        const final = { ...original, name: 'Final Course Certificate' };
        const issuer = {
            id: { did: () => 'did:key:issuer' },
            invoke: {
                createProfile: vi.fn(),
                createBoost: vi.fn().mockResolvedValue('boost:demo'),
                sendBoost: vi.fn().mockResolvedValue({
                    credentialUri: 'credential:demo',
                    refresh: {
                        credentialId: original.id,
                        refreshId: 'refresh:demo',
                        issuerDid: 'did:key:issuer',
                        holderDid: 'did:key:holder',
                        refreshService: { id: 'http://localhost:4000/refresh/demo' },
                    },
                }),
                issueCredential: vi.fn(async v => v),
                publishCredentialRefresh: vi.fn(async () => {
                    expect(prompts).toBe(4);
                    return { version: 2 };
                }),
            },
        };
        const holder = {
            invoke: {
                createProfile: vi.fn(),
                acceptCredential: vi.fn(),
                refreshCredential: vi.fn(),
                verifyCredential: vi
                    .fn()
                    .mockResolvedValue({ checks: ['proof'], errors: [], warnings: [] }),
            },
            index: {
                LearnCloud: {
                    get: vi.fn(async () => (prompts < 4 ? [] : [{ uri: 'stored:demo' }])),
                },
            },
            read: {
                get: vi.fn(async (uri: string) =>
                    uri === 'stored:demo' && prompts >= 6 ? final : original
                ),
            },
        };
        mocks.init.mockResolvedValueOnce(issuer).mockResolvedValueOnce(holder);
        await runRefreshDemo({ ui: true });
        // Full certificate views render the nested achievement, not the thumbnail title.
        const sentAchievement =
            issuer.invoke.createBoost.mock.calls[0][0].credentialSubject.achievement;
        const updatedAchievement =
            issuer.invoke.issueCredential.mock.calls[0][0].credentialSubject.achievement;
        expect(sentAchievement.name).toContain('Provisional Results');
        expect(sentAchievement.description).toContain('Final grade: Pending');
        expect(sentAchievement.description).not.toContain('Course completed');
        expect(updatedAchievement.name).toContain('Final Results');
        expect(updatedAchievement.description).toContain('Final grade: A');
        expect(updatedAchievement.id).toBe(sentAchievement.id);
        expect(holder.invoke.acceptCredential).not.toHaveBeenCalled();
        expect(holder.invoke.refreshCredential).not.toHaveBeenCalled();
        expect(holder.invoke.verifyCredential).toHaveBeenCalledWith(final);
        expect(holder.index.LearnCloud.get).toHaveBeenCalledTimes(4);
        expect(holder.invoke.createProfile).toHaveBeenCalledWith(
            expect.objectContaining({
                notificationsWebhook: 'http://localhost:5200/api/notifications/send',
            })
        );
        expect(mocks.log.mock.calls.flat().join('\n')).toMatch(
            /http:\/\/localhost:3000\/developer\/sign-in\?next=%2Fpassport#seed=[0-9a-f]{64}/
        );
        expect(mocks.set).toHaveBeenCalledWith(
            expect.objectContaining({ ui: true, status: 'updated', sameCredentialId: true })
        );
        expect(mocks.close).toHaveBeenCalled();
    });
});
