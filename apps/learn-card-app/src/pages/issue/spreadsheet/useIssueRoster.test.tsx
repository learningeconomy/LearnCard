import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIssueRoster } from './useIssueRoster';
import { makeRun, statusFor } from './fixtures.test-support';
import type { IssuanceRun } from './issuanceTypes';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: {
        use: { networkUrl: () => 'https://network.test', tenantId: () => 'learncard' },
        get: { networkUrl: () => 'https://network.test', tenantId: () => 'learncard' },
    },
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
}));
vi.mock('../../../components/simple-send/simpleSend.helpers', () => ({
    buildReusableBoostTemplate: () => ({}),
    buildSimpleTemplate: () => ({}),
}));
vi.mock(
    '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd',
    () => ({
        validateCredentialJsonLd: vi.fn(async () => ({ valid: true, errors: [] })),
    })
);
const store = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), list: vi.fn() }));
vi.mock('./issuanceStore', () => ({
    readIssuanceRun: store.read,
    saveIssuanceRun: store.save,
    listIssuanceRuns: store.list,
    pruneIssuanceRuns: vi.fn(async () => {}),
}));
afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe('roster autosave and sending', () => {
    it.each(['send', 'reset'] as const)('%s during autosave', async action => {
        vi.useFakeTimers();
        let stored: IssuanceRun | undefined;
        let finishSave!: () => void;
        const pending = new Promise<void>(resolve => {
            finishSave = resolve;
        });
        store.list.mockResolvedValue([]);
        store.read.mockImplementation(async () => stored && structuredClone(stored));
        store.save.mockImplementation(async (run: IssuanceRun) => {
            stored = structuredClone(run);
        });
        store.save.mockImplementationOnce(async (run: IssuanceRun) => {
            await pending;
            stored = structuredClone(run);
        });
        let held = false;
        Object.defineProperty(navigator, 'locks', {
            configurable: true,
            value: {
                request: vi.fn(
                    async (
                        _name: string,
                        _options: unknown,
                        callback: (lock: object | null) => Promise<unknown>
                    ) => {
                        if (held) return callback(null);
                        held = true;
                        try {
                            return await callback({});
                        } finally {
                            held = false;
                        }
                    }
                ),
            },
        });
        const run = makeRun(2);
        const submit = vi.fn(async () => ({
            batchId: 'batch',
            status: 'QUEUED',
            createdAt: new Date().toISOString(),
        }));
        const wallet = {
            id: { did: () => 'did:key:test' },
            invoke: {
                getProfile: vi.fn(async () => ({ profileId: run.scope.issuer })),
                createBoost: vi.fn(async () => 'lc:network:example.com:boost:template'),
                sendCredentialsViaInbox: submit,
                waitForInboxCredentialBatch: vi.fn(async () => statusFor('batch', 2)),
            },
        } as unknown as BespokeLearnCard;
        const options = {
            issuer: run.scope.issuer,
            recipients: run.draft.recipients,
            template: run.template,
            shared: {},
            values: {},
            attachments: {},
            variables: [],
            setRecipients: vi.fn(),
            setShared: vi.fn(),
            setValues: vi.fn(),
            setAttachments: vi.fn(),
            onRestoreTemplate: vi.fn(),
            onPeople: vi.fn(),
            initWallet: vi.fn(async () => wallet),
            ensureSigningAuthority: vi.fn(async () => {}),
        };
        const { result } = renderHook(() => useIssueRoster(options));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(600);
        });
        expect(store.save).toHaveBeenCalledTimes(1);
        if (action === 'reset') {
            const previousId = result.current.id;
            act(() => result.current.reset());
            await act(async () => {
                finishSave();
                await pending;
            });
            expect(result.current.id).not.toBe(previousId);
            expect(result.current.run).toBeNull();
            return;
        }
        let sending!: Promise<void>;
        await act(async () => {
            sending = result.current.execute();
        });
        expect(options.initWallet).not.toHaveBeenCalled();
        await act(async () => {
            finishSave();
            await sending;
        });
        expect(submit).toHaveBeenCalledTimes(1);
        expect(result.current.error).toBe('');
        expect(Object.values(result.current.run!.outcomes).map(row => row.state)).toEqual([
            'sent',
            'sent',
        ]);
    });
});
