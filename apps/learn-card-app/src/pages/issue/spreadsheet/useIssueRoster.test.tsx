import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIssueRoster } from './useIssueRoster';
import { makeRun, statusFor } from './fixtures.test-support';
import type { IssuanceRun } from './issuanceTypes';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { dynamicField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { parseSpreadsheet, readSpreadsheetText } from './parseSpreadsheet';
import { exportRosterCsv } from './roster';

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
    it.each([false, true])('blocks formula errors after import (saved run: %s)', async saved => {
        const original = makeRun();
        original.template.credentialSubject.achievement.description = dynamicField('score');
        original.scopes = { score: 'perRecipient' };
        original.draft.values = { 'row-0': { score: '95' } };
        const sheet = parseSpreadsheet(
            readSpreadsheetText(
                saved
                    ? exportRosterCsv(original.draft, ['score'], original.scopes, {})
                    : 'Email,score\nperson0@test.com,95'
            )
        );
        const column = sheet.columns.find(column => column.label === 'score')!;
        sheet.rows[0].cells[column.id] = { text: '#REF!', problem: 'formula' };
        store.list.mockResolvedValue([]);
        store.read.mockResolvedValue(saved ? original : undefined);
        store.save.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'locks', {
            configurable: true,
            value: {
                request: async (
                    _name: string,
                    _options: unknown,
                    callback: (lock: object) => unknown
                ) => callback({}),
            },
        });
        const initWallet = vi.fn();
        const variables = ['score'];
        const { result } = renderHook(() => {
            const [recipients, setRecipients] = useState(original.draft.recipients);
            const [values, setValues] = useState(original.draft.values);
            const [shared, setShared] = useState(original.shared);
            const [attachments, setAttachments] = useState({});
            return useIssueRoster({
                issuer: original.scope.issuer,
                recipients,
                setRecipients,
                values,
                setValues,
                shared,
                setShared,
                attachments,
                setAttachments,
                variables,
                template: original.template,
                onRestoreTemplate: vi.fn(),
                onPeople: vi.fn(),
                initWallet,
                ensureSigningAuthority: vi.fn(),
            });
        });
        await act(async () => {
            await result.current.importSheet(sheet);
        });
        const key = result.current.draft.recipients[0].rowId!;
        expect(result.current.problems[key]).toEqual(['formula']);
        expect(result.current.hasProblems).toBe(true);
        if (saved)
            expect(store.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    draft: expect.objectContaining({ formulaCells: { [key]: { score: '#REF!' } } }),
                })
            );
        await act(async () => {
            await result.current.execute();
        });
        expect(initWallet).not.toHaveBeenCalled();
        expect(result.current.error).not.toBe('');
    });
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
