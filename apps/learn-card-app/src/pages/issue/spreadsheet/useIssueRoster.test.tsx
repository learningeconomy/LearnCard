import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIssueRoster } from './useIssueRoster';
import { makeRun, statusFor } from './fixtures.test-support';
import type { IssuanceRun } from './issuanceTypes';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { dynamicField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { parseSpreadsheet, readSpreadsheetText } from './parseSpreadsheet';
import { exportRosterCsv } from './roster';
import { exportIssuanceCsv } from './exportIssuance';
import { addSubmissionAttempts } from './issuance';
import { writeResult } from '../components/resultField';
import { AnalyticsEvents } from '../../../analytics/events';

const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('../../../analytics', async () => ({
    AnalyticsEvents: (await import('../../../analytics/events')).AnalyticsEvents,
    newFlowId: () => 'issue-flow',
    useAnalytics: () => ({ track: analytics.track }),
}));

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
    const emptyOptions = (run: IssuanceRun): Parameters<typeof useIssueRoster>[0] => ({
        issuer: run.scope.issuer,
        recipients: [],
        setRecipients: vi.fn(),
        values: {},
        setValues: vi.fn(),
        shared: {},
        setShared: vi.fn(),
        attachments: {},
        setAttachments: vi.fn(),
        variables: [],
        template: null,
        onRestoreTemplate: vi.fn(),
        onPeople: vi.fn(),
        initWallet: vi.fn(),
        ensureSigningAuthority: vi.fn(),
    });
    it('hides a reminder durably without deleting uncertain recovery, and allows restoring it', async () => {
        const run = makeRun();
        run.outcomes = { 'row-0': { state: 'confirming' } };
        store.list.mockResolvedValue([run]);
        store.read.mockResolvedValue(run);
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
        const options = emptyOptions(run);
        const first = renderHook(() => useIssueRoster(options));
        await waitFor(() => expect(first.result.current.recoverable?.id).toBe(run.id));
        await act(async () => {
            await first.result.current.dismissRecovery();
        });
        const saved = store.save.mock.calls.at(-1)![0] as IssuanceRun;
        expect(saved.dismissedAt).toEqual(expect.any(Number));
        expect(saved.outcomes).toEqual(run.outcomes);
        expect(first.result.current.recoverable).toBeNull();
        first.unmount();
        store.list.mockResolvedValue([saved]);
        const next = renderHook(() => useIssueRoster(options));
        await waitFor(() => expect(next.result.current.dismissedRecoverable?.id).toBe(run.id));
        expect(next.result.current.recoverable).toBeNull();
        act(() => next.result.current.restore(next.result.current.dismissedRecoverable!));
        expect(options.onRestoreTemplate).toHaveBeenCalledWith(run.template);
        expect(next.result.current.run?.id).toBe(run.id);
    });
    it('restores a spreadsheet-first draft without selecting the fallback badge', () => {
        const run = makeRun();
        run.templateSelected = false;
        const options = emptyOptions(run);
        const { result } = renderHook(() => useIssueRoster(options));
        act(() => result.current.restore(run));
        expect(options.onRestoreTemplate).toHaveBeenCalledWith(null);
        expect(result.current.run?.id).toBe(run.id);
    });
    it('reports a context error instead of throwing from Restore', async () => {
        const run = makeRun();
        const options = emptyOptions(run);
        store.list.mockResolvedValue([]);
        const { result } = renderHook(() => useIssueRoster(options));
        act(() => result.current.restore({ ...run, scope: { ...run.scope, tenant: 'other' } }));
        expect(result.current.error).not.toBe('');
        expect(options.onRestoreTemplate).not.toHaveBeenCalled();
        expect(result.current.run).toBeNull();
    });
    it('does not restore while a dismissal is saving or expose it after switching accounts', async () => {
        const run = makeRun();
        run.outcomes = { 'row-0': { state: 'confirming' } };
        store.list.mockResolvedValue([run]);
        store.read.mockResolvedValue(run);
        let finish!: () => void;
        store.save.mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    finish = resolve;
                })
        );
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
        const options = emptyOptions(run);
        const { result, rerender } = renderHook(
            ({ issuer }) => useIssueRoster({ ...options, issuer }),
            { initialProps: { issuer: run.scope.issuer } }
        );
        await waitFor(() => expect(result.current.recoverable?.id).toBe(run.id));
        let saving!: Promise<void>;
        act(() => {
            saving = result.current.dismissRecovery();
        });
        await waitFor(() => expect(store.save).toHaveBeenCalled());
        act(() => result.current.restore(run));
        expect(options.onRestoreTemplate).not.toHaveBeenCalled();
        store.list.mockResolvedValue([]);
        rerender({ issuer: 'other-issuer' });
        await act(async () => {
            finish();
            await saving;
        });
        expect(result.current.dismissedRecoverable).toBeNull();
        expect(result.current.recoverable).toBeNull();
    });
    it('accepts normalized emails on locked-row imports but rejects real value changes', async () => {
        const run = makeRun();
        run.templateUri = 'template';
        run.template.credentialSubject.achievement.description = dynamicField('score');
        run.scopes = { score: 'perRecipient' };
        run.draft.recipients[0] = { kind: 'email', rowId: 'row-0', email: ' PERSON0@TEST.COM ' };
        run.draft.values = { 'row-0': { score: '95' } };
        run.outcomes = { 'row-0': { state: 'sent' } };
        store.list.mockResolvedValue([]);
        store.read.mockResolvedValue(run);
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
        const options = emptyOptions(run);
        const variables = ['score'];
        const { result } = renderHook(() => {
            const [recipients, setRecipients] = useState(options.recipients);
            const [values, setValues] = useState(options.values);
            const [shared, setShared] = useState(options.shared);
            return useIssueRoster({
                ...options,
                recipients,
                setRecipients,
                values,
                setValues,
                shared,
                setShared,
                variables,
                template: run.template,
            });
        });
        const csv = exportRosterCsv(run.draft, ['score'], run.scopes, {});
        await act(async () => {
            await result.current.importSheet(parseSpreadsheet(readSpreadsheetText(csv)));
        });
        expect(result.current.run?.draft.recipients[0]).toEqual(run.draft.recipients[0]);
        await act(async () => {
            await expect(
                result.current.importSheet(
                    parseSpreadsheet(readSpreadsheetText(csv.replace('95', '96')))
                )
            ).rejects.toMatchObject({ code: 'locked' });
        });
    });
    it.each([
        ['escaped email', 'outcome'],
        ['escaped email', 'attempt'],
        ['edited shared value', 'outcome'],
        ['edited shared value', 'attempt'],
    ])(
        'accepts unchanged full exports of locked rows: %s (%s snapshot)',
        async (scenario, snapshot) => {
            const run = makeRun(2);
            run.templateUri = 'template';
            run.template.credentialSubject.achievement.description = dynamicField('score');
            run.scopes = { score: 'shared' };
            run.shared = { score: 'Corrected' };
            run.outcomes = {
                'row-0': { state: 'sent', templateData: { score: 'Original' } },
                'row-1': { state: 'failed' },
            };
            if (scenario === 'escaped email') {
                run.draft.recipients[0] = { kind: 'email', rowId: 'row-0', email: '+ada@test.com' };
                run.shared.score = 'Original';
            }
            if (snapshot === 'attempt') {
                const frozen = addSubmissionAttempts({
                    ...run,
                    shared: { score: 'Original' },
                    outcomes: {},
                });
                run.attempts = frozen.attempts;
                delete run.outcomes['row-0'].templateData;
            }
            store.list.mockResolvedValue([]);
            store.read.mockResolvedValue(run);
            store.save.mockResolvedValue(undefined);
            const options = emptyOptions(run);
            const variables = ['score'];
            const { result } = renderHook(() => {
                const [recipients, setRecipients] = useState(options.recipients);
                const [values, setValues] = useState(options.values);
                const [shared, setShared] = useState(options.shared);
                return useIssueRoster({
                    ...options,
                    recipients,
                    setRecipients,
                    values,
                    setValues,
                    shared,
                    setShared,
                    variables,
                    template: run.template,
                });
            });
            const csv = exportIssuanceCsv(run, variables);
            await act(async () => {
                await result.current.importSheet(parseSpreadsheet(readSpreadsheetText(csv)));
            });
            expect(result.current.run?.draft.recipients[0]).toEqual(run.draft.recipients[0]);
            expect(result.current.valuesForRow(run.draft.recipients[0])).toEqual({
                score: 'Original',
            });
            expect(result.current.draft.values['row-1']).toEqual({ score: run.shared.score });
            await act(async () => {
                await expect(
                    result.current.importSheet(
                        parseSpreadsheet(readSpreadsheetText(csv.replace('Original', 'Tampered')))
                    )
                ).rejects.toMatchObject({ code: 'locked' });
            });
        }
    );
    it('blocks source formula errors when a template variable is mapped after import', async () => {
        const run = makeRun();
        store.list.mockResolvedValue([]);
        store.read.mockResolvedValue(undefined);
        store.save.mockResolvedValue(undefined);
        const options = emptyOptions(run);
        const initWallet = vi.fn();
        const { result, rerender } = renderHook(
            ({ variables }: { variables: string[] }) => {
                const [recipients, setRecipients] = useState(run.draft.recipients);
                const [values, setValues] = useState(run.draft.values);
                const template = structuredClone(run.template);
                if (variables.length)
                    template.credentialSubject.achievement.description = dynamicField('score');
                return {
                    ...useIssueRoster({
                        ...options,
                        recipients,
                        setRecipients,
                        values,
                        setValues,
                        variables,
                        template,
                        initWallet,
                    }),
                    correct: () =>
                        setValues(previous => ({ ...previous, 'row-0': { score: 'Corrected' } })),
                };
            },
            { initialProps: { variables: [] as string[] } }
        );
        const sheet = parseSpreadsheet(readSpreadsheetText('Email,score\nperson0@test.com,#REF!'));
        sheet.rows[0].cells[sheet.columns.find(column => column.label === 'score')!.id].problem =
            'formula';
        await act(async () => {
            await result.current.importSheet(sheet);
        });
        rerender({ variables: ['score'] });
        await waitFor(() => expect(result.current.draft.values['row-0']?.score).toBe('#REF!'));
        expect(result.current.problems['row-0']).toEqual(['formula']);
        expect(result.current.hasProblems).toBe(true);
        await act(async () => {
            await result.current.execute();
        });
        expect(initWallet).not.toHaveBeenCalled();
        act(() => result.current.correct());
        expect(result.current.hasProblems).toBe(false);
    });
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
        expect(analytics.track).toHaveBeenCalledWith(
            AnalyticsEvents.CREDENTIAL_ISSUE_FAILED,
            expect.objectContaining({ step_id: 'jsonld_validation', recipient_count: 1 })
        );
    });
    it.each([false, true])(
        'validates result ranges before resume/retry (retry=%s)',
        async retryFailed => {
            const run = makeRun();
            run.template = writeResult(run.template, {
                resultType: 'Percent',
                value: dynamicField('percent'),
                valueMin: '0',
                valueMax: '100',
            });
            run.scopes = { percent: 'perRecipient' };
            run.draft.values = { 'row-0': { percent: '101' } };
            run.outcomes['row-0'] = { state: retryFailed ? 'failed' : 'ready' };
            store.list.mockResolvedValue([]);
            store.read.mockResolvedValue(run);
            const options = emptyOptions(run);
            const { result } = renderHook(() => useIssueRoster(options));
            await act(async () => {
                await result.current.execute(retryFailed, run);
            });
            expect(result.current.error).not.toBe('');
            expect(options.initWallet).not.toHaveBeenCalled();
        }
    );
    it.each([0, 100])('permits the Percent boundary %s on resume', async percent => {
        const run = makeRun();
        run.template = writeResult(run.template, {
            resultType: 'Percent',
            value: dynamicField('percent'),
            valueMin: '0',
            valueMax: '100',
        });
        run.scopes = { percent: 'perRecipient' };
        run.draft.values = { 'row-0': { percent: String(percent) } };
        store.list.mockResolvedValue([]);
        store.read.mockResolvedValue(run);
        const options = emptyOptions(run);
        options.initWallet = vi.fn().mockRejectedValue(new Error('stop after validation'));
        const { result } = renderHook(() => useIssueRoster(options));
        await act(async () => {
            await result.current.execute(false, run);
        });
        expect(options.initWallet).toHaveBeenCalledOnce();
    });
    it('validates only failed candidates when a retry includes a new unattempted row', async () => {
        const run = makeRun(2);
        run.template = writeResult(run.template, {
            resultType: 'Percent',
            value: dynamicField('percent'),
            valueMin: '0',
            valueMax: '100',
        });
        run.scopes = { percent: 'perRecipient' };
        run.draft.values = { 'row-0': { percent: '95' }, 'row-1': { percent: '101' } };
        run.outcomes['row-0'] = { state: 'failed' };
        store.list.mockResolvedValue([]);
        store.read.mockResolvedValue(run);
        const options = emptyOptions(run);
        options.initWallet = vi.fn().mockRejectedValue(new Error('stop after validation'));
        const { result } = renderHook(() => useIssueRoster(options));
        await act(async () => {
            await result.current.execute(true, run);
        });
        expect(options.initWallet).toHaveBeenCalledOnce();
    });
    it.each([0, 1])('tracks only new send candidates (%s failed recipients)', async failures => {
        const run = makeRun(2);
        run.outcomes = {
            'row-0': { state: failures ? 'failed' : 'sent' },
            'row-1': { state: 'sent' },
        };
        store.list.mockResolvedValue([]);
        store.read.mockResolvedValue(run);
        const options = emptyOptions(run);
        options.initWallet = vi.fn().mockRejectedValue(new Error('stop after validation'));
        const { result } = renderHook(() => useIssueRoster(options));
        await act(async () => {
            await result.current.execute(true, run);
        });
        if (failures) {
            expect(analytics.track).toHaveBeenCalledWith(
                AnalyticsEvents.CREDENTIAL_ISSUE_STARTED,
                expect.objectContaining({ recipient_count: 1 })
            );
            expect(analytics.track).toHaveBeenCalledWith(
                AnalyticsEvents.CREDENTIAL_ISSUE_FAILED,
                expect.objectContaining({ recipient_count: 1 })
            );
        } else expect(analytics.track).not.toHaveBeenCalled();
    });
    it('preserves dismissal while viewing, and clears it only after editing', async () => {
        const run = makeRun();
        run.dismissedAt = 123;
        store.list.mockResolvedValue([]);
        let stored = structuredClone(run);
        store.read.mockImplementation(async () => structuredClone(stored));
        store.save.mockImplementation(async next => {
            stored = structuredClone(next);
        });
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
        const { result } = renderHook(() => {
            const [recipients, setRecipients] = useState<typeof run.draft.recipients>([]);
            const [values, setValues] = useState<typeof run.draft.values>({});
            const [shared, setShared] = useState({});
            const [attachments, setAttachments] = useState({});
            const [template, setTemplate] = useState<typeof run.template | null>(null);
            return useIssueRoster({
                ...emptyOptions(run),
                recipients,
                setRecipients,
                values,
                setValues,
                shared,
                setShared,
                attachments,
                setAttachments,
                template,
                onRestoreTemplate: setTemplate,
            });
        });
        act(() => result.current.restore(run));
        await waitFor(() => expect(store.save).toHaveBeenCalled(), { timeout: 3000 });
        expect(stored.dismissedAt).toBe(123);
        store.save.mockClear();
        act(() =>
            result.current.changeRecipients([{ ...run.draft.recipients[0], displayName: 'Edited' }])
        );
        await waitFor(() => expect(store.save).toHaveBeenCalled(), { timeout: 3000 });
        expect(stored.dismissedAt).toBeUndefined();
    });
    it.each(['send', 'reset', 'failed', 'unconfirmed', 'profile'] as const)(
        '%s during autosave',
        async action => {
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
            if (action === 'profile')
                run.draft.recipients = [0, 1].map(index => ({
                    kind: 'profile',
                    rowId: `row-${index}`,
                    profileId: `profile-${index}`,
                    displayName: `Person ${index}`,
                }));
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
                    waitForInboxCredentialBatch: vi.fn(async () => {
                        const status = statusFor('batch', 2, action === 'failed' ? [1] : []);
                        if (action === 'unconfirmed')
                            status.items[1].result = {
                                success: false,
                                index: 1,
                                error: {
                                    code: 'CONFLICT',
                                    reason: 'UNCONFIRMED',
                                    message: 'private detail',
                                },
                            };
                        return status;
                    }),
                    send: vi.fn(async () => ({})),
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
            expect(submit).toHaveBeenCalledTimes(action === 'profile' ? 0 : 1);
            expect(result.current.error).toBe('');
            expect(Object.values(result.current.run!.outcomes).map(row => row.state)).toEqual([
                'sent',
                action === 'failed' ? 'failed' : action === 'unconfirmed' ? 'confirming' : 'sent',
            ]);
            expect(analytics.track).toHaveBeenCalledWith(
                AnalyticsEvents.CREDENTIAL_ISSUE_STARTED,
                expect.objectContaining({ recipient_mode: 'people', recipient_count: 2 })
            );
            expect(analytics.track).toHaveBeenCalledWith(
                ['failed', 'unconfirmed'].includes(action)
                    ? AnalyticsEvents.CREDENTIAL_ISSUE_FAILED
                    : AnalyticsEvents.CREDENTIAL_ISSUE_SUCCEEDED,
                expect.objectContaining({ flow_id: 'issue-flow', recipient_count: 2 })
            );
            expect(
                analytics.track.mock.calls.some(([event]) => event === AnalyticsEvents.SEND_BOOST)
            ).toBe(!['failed', 'unconfirmed'].includes(action));
            const payload = JSON.stringify(analytics.track.mock.calls);
            for (const row of run.draft.recipients)
                expect(payload).not.toContain(row.kind === 'email' ? row.email : row.profileId);
        }
    );
});
