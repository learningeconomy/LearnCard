import { materializeCredentialFields } from '@learncard/helpers';
import {
    mapSpreadsheetColumn,
    credentialRowProblems,
    removeSpreadsheetMapping,
    replaceSpreadsheetTemplate,
} from './columnMapping';
import type { ColumnMapping, MappingTarget } from './types';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { UnsignedVC } from '@learncard/types';
import { AnalyticsEvents, newFlowId, useAnalytics } from '../../../analytics';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import {
    buildReusableBoostTemplate,
    buildSimpleTemplate,
} from '../../../components/simple-send/simpleSend.helpers';
import { recipientKey, recipientDisplayName, type Recipient } from '../components/recipientTypes';
import type { SimpleMediaAttachment } from '../components/MediaAttachments';
import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import {
    extractVariablesByType,
    validateTemplate,
    templateToJson,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { validateCredentialJsonLd } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd';
import { applyVariableValues } from '../components/variableSubstitution';
import {
    effectiveRowValues,
    getRowProblems,
    mergeSpreadsheet,
    downloadRosterCsv,
    type ColumnScopes,
} from './roster';
import { exportIssuanceCsv } from './exportIssuance';
import { executeIssuance, canRemoveIssuanceRow, canReplaceIssuanceRecipients } from './issuance';
import {
    listIssuanceRuns,
    readIssuanceRun,
    saveIssuanceRun,
    pruneIssuanceRuns,
} from './issuanceStore';
import {
    issuanceScopeKey,
    IssuanceRecoveryError,
    type IssuanceRun,
    type IssuanceScope,
} from './issuanceTypes';
import { normalizeColumn, normalizeEmail, type ParsedSpreadsheet, type RosterDraft } from './types';
import { SpreadsheetError } from './parseSpreadsheet';
import { spreadsheetErrorMessage } from './messages';
import { getFriendlyIssueError } from '../issueErrors';

interface RosterOptions {
    issuer: string;
    recipients: Recipient[];
    setRecipients: Dispatch<SetStateAction<Recipient[]>>;
    shared: Record<string, string>;
    setShared: Dispatch<SetStateAction<Record<string, string>>>;
    values: RosterDraft['values'];
    setValues: Dispatch<SetStateAction<RosterDraft['values']>>;
    attachments: Record<string, SimpleMediaAttachment[]>;
    setAttachments: Dispatch<SetStateAction<Record<string, SimpleMediaAttachment[]>>>;
    variables: string[];
    template: OBv3CredentialTemplate | null;
    onRestoreTemplate: (template: OBv3CredentialTemplate | null) => void;
    onPeople: () => void;
    initWallet: () => Promise<BespokeLearnCard>;
    ensureSigningAuthority: (wallet: BespokeLearnCard) => Promise<unknown>;
    entryPoint?: string;
}

export const useIssueRoster = (options: RosterOptions) => {
    const { track } = useAnalytics();
    const network = networkStore.use.networkUrl();
    const tenant = networkStore.use.tenantId();
    const scope: IssuanceScope = { issuer: options.issuer, domain: network, tenant };
    const scopeKey = issuanceScopeKey(scope);
    const issuerRef = useRef(options.issuer);
    issuerRef.current = options.issuer;
    const currentScope = (): IssuanceScope => ({
        issuer: mounted.current ? issuerRef.current : '',
        domain: networkStore.get.networkUrl(),
        tenant: networkStore.get.tenantId(),
    });
    const [id, setId] = useState<string>(() => crypto.randomUUID());
    const activeDraftId = useRef(id);
    const changeDraftId = (nextId: string): void => {
        activeDraftId.current = nextId;
        setId(nextId);
    };
    const [source, setSource] = useState<ParsedSpreadsheet>();
    const [scopes, setScopes] = useState<ColumnScopes>({});
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [formulaCells, setFormulaCells] = useState<RosterDraft['formulaCells']>({});
    const [evidence, setEvidence] = useState<Record<string, string>>({});
    const [run, setRun] = useState<IssuanceRun | null>(null);
    const runRef = useRef(run);
    runRef.current = run;
    const [recoverable, setRecoverable] = useState<IssuanceRun | null>(null);
    const [dismissedRecoverable, setDismissedRecoverable] = useState<IssuanceRun | null>(null);
    const [busy, setBusy] = useState(false);
    const [checking, setChecking] = useState(false);
    const executing = useRef(false);
    const draftSaveTimer = useRef<ReturnType<typeof setTimeout>>();
    const pendingDraftSaves = useRef(new Set<Promise<void>>());
    const [error, setError] = useState('');
    const [pastedText, setPastedText] = useState('');
    const [previewIndex, setPreviewIndex] = useState(0);
    const mounted = useRef(true);
    const abort = useRef<AbortController>();
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            abort.current?.abort();
        };
    }, []);
    const effectiveScopes = useMemo<ColumnScopes>(
        () => Object.fromEntries(options.variables.map(name => [name, scopes[name] ?? 'shared'])),
        [options.variables, scopes]
    );
    const draft: RosterDraft = {
        id,
        recipients: options.recipients,
        values: options.values,
        evidence,
        formulaCells,
        mappings,
        attachments: options.attachments,
        source,
        sourceName: source?.source.name,
    };
    useEffect(() => {
        if (!source || runRef.current?.templateUri) return;
        const mapped = options.variables
            .map(name => ({
                name,
                column: source.columns.find(
                    column => normalizeColumn(column.label) === normalizeColumn(name)
                ),
            }))
            .filter(item => item.column);
        if (!mapped.length) return;
        options.setValues(previous => {
            const next = { ...previous };
            for (const row of options.recipients) {
                const key = recipientKey(row);
                const imported = source.rows.find(
                    item => item.exportedRowId === key || item.rowId === key
                );
                if (!imported) continue;
                for (const { name, column } of mapped) {
                    if (name in (next[key] ?? {})) continue;
                    next[key] = { ...next[key], [name]: imported.cells[column!.id]?.text ?? '' };
                }
            }
            return next;
        });
        setScopes(previous => ({
            ...Object.fromEntries(mapped.map(({ name }) => [name, 'perRecipient' as const])),
            ...previous,
        }));
    }, [source, options.variables]);

    const apply = (saved: IssuanceRun): void => {
        if (issuanceScopeKey(saved.scope) !== issuanceScopeKey(currentScope()))
            throw new IssuanceRecoveryError('context');
        changeDraftId(saved.id);
        setSource(saved.draft.source);
        setScopes(saved.scopes);
        setEvidence(saved.draft.evidence);
        setFormulaCells(saved.draft.formulaCells ?? {});
        setMappings(saved.draft.mappings ?? []);
        options.setRecipients(saved.draft.recipients);
        options.setValues(saved.draft.values);
        options.setShared(saved.shared);
        options.setAttachments(saved.draft.attachments ?? {});
        options.onRestoreTemplate(saved.templateSelected === false ? null : saved.template);
        options.onPeople();
        setRun(saved);
        runRef.current = saved;
        setRecoverable(null);
        setDismissedRecoverable(null);
    };
    const reset = (): void => {
        abort.current?.abort();
        changeDraftId(crypto.randomUUID());
        setSource(undefined);
        setMappings([]);
        setFormulaCells({});
        setScopes({});
        setEvidence({});
        setRun(null);
        runRef.current = null;
        setRecoverable(null);
        setPreviewIndex(0);
        setError('');
    };
    const restore = (saved: IssuanceRun): void => {
        if (busy || executing.current) return;
        try {
            apply(saved);
            setError('');
        } catch (reason) {
            setError(spreadsheetErrorMessage(reason));
        }
    };
    const previousScope = useRef(scope);
    useEffect(() => {
        let active = true;
        if (issuanceScopeKey(previousScope.current) !== scopeKey) {
            if (previousScope.current.issuer) {
                abort.current?.abort();
                setRun(null);
                runRef.current = null;
                setRecoverable(null);
                setDismissedRecoverable(null);
                changeDraftId(crypto.randomUUID());
                setSource(undefined);
                setMappings([]);
                setFormulaCells({});
                setEvidence({});
                setScopes({});
                options.setRecipients([]);
                options.setValues({});
                options.setShared({});
                options.setAttachments({});
            }
            previousScope.current = scope;
        }
        if (!scope.issuer) return;
        void listIssuanceRuns(scope)
            .then(runs => {
                if (!active) return;
                const pending = runs.filter(
                    saved =>
                        saved.attempts.some(attempt => !attempt.done) ||
                        Object.values(saved.outcomes).some(row => row.state !== 'sent')
                );
                setRecoverable(pending.find(saved => !saved.dismissedAt) ?? null);
                setDismissedRecoverable(pending.find(saved => saved.dismissedAt) ?? null);
                void pruneIssuanceRuns(scope).catch(() => undefined);
            })
            .catch(reason => {
                if (active) setError(spreadsheetErrorMessage(reason));
            });
        return () => {
            active = false;
            abort.current?.abort();
        };
    }, [scopeKey]);

    const capture = (): IssuanceRun => {
        if (!scope.issuer) throw new IssuanceRecoveryError('context');
        const base = runRef.current;
        return {
            version: 1,
            id,
            scope,
            createdAt: base?.createdAt ?? Date.now(),
            updatedAt: base?.updatedAt ?? Date.now(),
            template: base?.templateUri
                ? base.template
                : (options.template ??
                  buildSimpleTemplate({ credentialType: 'badge', name: '', description: '' })),
            templateSelected: base?.templateUri ? true : Boolean(options.template),
            templateUri: base?.templateUri,
            draft,
            scopes: effectiveScopes,
            shared: options.shared,
            outcomes: Object.fromEntries(
                options.recipients.map(row => [
                    recipientKey(row),
                    base?.outcomes[recipientKey(row)] ?? { state: 'ready' as const },
                ])
            ),
            attempts: base?.attempts ?? [],
        };
    };
    const persistDraft = async (saved: IssuanceRun): Promise<void> => {
        if (issuanceScopeKey(saved.scope) !== issuanceScopeKey(currentScope()))
            throw new IssuanceRecoveryError('context');
        if (!navigator.locks) throw new IssuanceRecoveryError('storage');
        await navigator.locks.request(
            `learncard-issuance:${saved.id}`,
            { ifAvailable: true },
            async lock => {
                if (!lock) throw new IssuanceRecoveryError('busy');
                const previous = await readIssuanceRun(saved.id, saved.scope);
                if (previous && previous.updatedAt !== saved.updatedAt)
                    throw new IssuanceRecoveryError('busy');
                saved.updatedAt = Math.max(Date.now(), saved.updatedAt + 1);
                if (issuanceScopeKey(saved.scope) !== issuanceScopeKey(currentScope()))
                    throw new IssuanceRecoveryError('context');
                await saveIssuanceRun(saved);
            }
        );
        // A late write may preserve the previous run, but must not resurrect its UI.
        if (
            mounted.current &&
            activeDraftId.current === saved.id &&
            issuanceScopeKey(saved.scope) === issuanceScopeKey(currentScope())
        ) {
            setRun(saved);
            runRef.current = saved;
        }
    };
    const saveDraft = (saved: IssuanceRun): Promise<void> => {
        const saving = persistDraft(saved);
        pendingDraftSaves.current.add(saving);
        void saving.then(
            () => pendingDraftSaves.current.delete(saving),
            () => pendingDraftSaves.current.delete(saving)
        );
        return saving;
    };
    const dismissRecovery = async (): Promise<void> => {
        if (!recoverable || busy || executing.current) return;
        executing.current = true;
        setBusy(true);
        try {
            const dismissed = { ...recoverable, dismissedAt: Date.now() };
            await persistDraft(dismissed);
            if (
                mounted.current &&
                issuanceScopeKey(dismissed.scope) === issuanceScopeKey(currentScope())
            ) {
                setDismissedRecoverable(dismissed);
                setRecoverable(null);
            }
        } catch (reason) {
            setError(spreadsheetErrorMessage(reason));
        } finally {
            executing.current = false;
            if (mounted.current) setBusy(false);
        }
    };
    useEffect(() => {
        if (busy || !scope.issuer || !options.recipients.length) return;
        const timer = setTimeout(() => {
            if (executing.current) return;
            void saveDraft(capture()).catch(reason => {
                if (mounted.current) setError(spreadsheetErrorMessage(reason));
            });
        }, 600);
        draftSaveTimer.current = timer;
        return () => clearTimeout(timer);
    }, [
        id,
        scopeKey,
        busy,
        source,
        scopes,
        evidence,
        formulaCells,
        mappings,
        options.template,
        options.recipients,
        options.shared,
        options.values,
        options.attachments,
    ]);

    const download = async (failuresOnly = false): Promise<void> => {
        const saved = capture();
        if (saved.draft.recipients.length) await saveDraft(saved);
        downloadRosterCsv(
            exportIssuanceCsv(saved, options.variables, failuresOnly),
            failuresOnly ? 'people-to-retry.csv' : 'credential-recipients.csv'
        );
    };
    const importSheet = async (sheet: ParsedSpreadsheet): Promise<void> => {
        if (issuanceScopeKey(scope) !== issuanceScopeKey(currentScope()))
            throw new IssuanceRecoveryError('context');
        if (busy) throw new IssuanceRecoveryError('busy');
        const ids = new Set(sheet.rows.map(row => row.exportedRunId).filter(Boolean));
        if (ids.size > 1) throw new SpreadsheetError('run');
        const importedId = [...ids][0];
        let saved = runRef.current;
        let baseDraft = draft;
        let baseScopes = effectiveScopes;
        let shared = options.shared;
        if (importedId && importedId !== id) {
            saved = (await readIssuanceRun(importedId, scope)) ?? null;
            if (!saved) throw new SpreadsheetError('run');
            baseDraft = saved.draft;
            baseScopes = saved.scopes;
            shared = saved.shared;
        }
        const variables = saved
            ? extractVariablesByType(saved.template).dynamic
            : options.variables;
        // Seed every existing row before switching a shared column to per-person.
        baseDraft = {
            ...baseDraft,
            values: Object.fromEntries(
                baseDraft.recipients.map(row => [
                    recipientKey(row),
                    {
                        ...baseDraft.values[recipientKey(row)],
                        ...effectiveRowValues(row, variables, baseScopes, shared, baseDraft.values),
                    },
                ])
            ),
        };
        const merged = mergeSpreadsheet(baseDraft, sheet, variables);
        if (saved?.templateUri) {
            for (const existing of saved.draft.recipients) {
                const key = recipientKey(existing);
                if (['ready', 'failed'].includes(saved.outcomes[key]?.state ?? 'ready')) continue;
                const incoming = sheet.rows.find(
                    row =>
                        row.exportedRowId === key ||
                        (existing.kind === 'email' && normalizeEmail(existing.email) === row.email)
                );
                if (!incoming) continue;
                const before = effectiveRowValues(
                    existing,
                    variables,
                    saved.scopes,
                    saved.shared,
                    saved.draft.values
                );
                const after = merged.draft.values[key] ?? {};
                if (
                    (existing.kind === 'email' &&
                        incoming.email !== normalizeEmail(existing.email)) ||
                    merged.mapped.some(name => after[name] !== before[name]) ||
                    (merged.draft.evidence[key]?.trim() ?? '') !==
                        (saved.draft.evidence[key]?.trim() ?? '')
                )
                    throw new IssuanceRecoveryError('locked');
                merged.draft.recipients = merged.draft.recipients.map(row =>
                    recipientKey(row) === key ? existing : row
                );
            }
        }
        const nextScopes = {
            ...baseScopes,
            ...Object.fromEntries(merged.mapped.map(name => [name, 'perRecipient' as const])),
        };
        if (saved) {
            const next = { ...saved, draft: merged.draft, scopes: nextScopes, shared };
            await saveDraft(next);
            apply(next);
        } else {
            setSource(merged.draft.source);
            options.setRecipients(merged.draft.recipients);
            options.setValues(merged.draft.values);
            setEvidence(merged.draft.evidence);
            setFormulaCells(merged.draft.formulaCells ?? {});
            setMappings(merged.draft.mappings ?? []);
            setScopes(nextScopes);
            options.onPeople();
        }
    };
    const execute = async (
        retryFailed = false,
        restore?: IssuanceRun,
        checkOnly = false
    ): Promise<void> => {
        if (busy || executing.current) return;
        executing.current = true;
        clearTimeout(draftSaveTimer.current);
        setBusy(true);
        setChecking(checkOnly);
        setError('');
        abort.current = new AbortController();
        const startedAt = Date.now();
        const analyticsTemplate = restore?.template ?? runRef.current?.template ?? options.template;
        const metadata = {
            flow_id: newFlowId(),
            recipient_mode: 'people' as const,
            credential_type:
                analyticsTemplate?.credentialSubject.achievement.achievementType?.value,
            category: undefined as string | undefined,
            recipient_count: restore?.draft.recipients.length ?? options.recipients.length,
        };
        let step: 'jsonld_validation' | 'issuance' = 'jsonld_validation';
        try {
            if (analyticsTemplate)
                metadata.category =
                    getDefaultCategoryForCredential(
                        templateToJson(analyticsTemplate) as UnsignedVC
                    ) || undefined;
            if (!checkOnly)
                track(AnalyticsEvents.CREDENTIAL_ISSUE_STARTED, {
                    ...metadata,
                    used_dynamic_variables: options.variables.length > 0,
                    entry_point: options.entryPoint,
                });
            // Finish this tab's autosave before capturing its revision. Other tabs
            // still fail the controller's lock/revision checks rather than overwrite it.
            await Promise.all([...pendingDraftSaves.current]);
            const saved = restore ?? capture();
            if (restore) apply(restore);
            const variables = extractVariablesByType(saved.template).dynamic;
            const candidates = checkOnly
                ? []
                : saved.draft.recipients.filter(row =>
                      (retryFailed ? ['ready', 'failed'] : ['ready']).includes(
                          saved.outcomes[recipientKey(row)]?.state ?? 'ready'
                      )
                  );
            if (candidates.length) {
                if (validateTemplate(saved.template).length)
                    throw new Error('Credential validation failed');
                const issues = getRowProblems(
                    saved.draft.recipients,
                    variables,
                    saved.scopes,
                    saved.shared,
                    saved.draft.values,
                    saved.draft.evidence,
                    saved.draft.formulaCells
                );
                if (
                    candidates.some(
                        row =>
                            issues[recipientKey(row)]?.length ||
                            credentialRowProblems(
                                saved.template,
                                effectiveRowValues(
                                    row,
                                    variables,
                                    saved.scopes,
                                    saved.shared,
                                    saved.draft.values
                                )
                            ).length
                    )
                )
                    throw new SpreadsheetError('mapping');
                const checked = new Set<string>();
                for (const row of candidates) {
                    const filled = materializeCredentialFields(
                        applyVariableValues(
                            templateToJson(saved.template),
                            effectiveRowValues(
                                row,
                                variables,
                                saved.scopes,
                                saved.shared,
                                saved.draft.values
                            )
                        )
                    );
                    const identity = JSON.stringify(filled);
                    if (checked.has(identity)) continue;
                    const validation = await validateCredentialJsonLd(filled, {
                        allowRemoteContexts: true,
                    });
                    if (!validation.valid) throw new Error('Credential validation failed');
                    checked.add(identity);
                }
            }
            step = 'issuance';
            const wallet = await options.initWallet();
            const activeProfile = await wallet.invoke.getProfile();
            if (activeProfile?.profileId !== saved.scope.issuer)
                throw new IssuanceRecoveryError('context');
            if (!checkOnly && saved.draft.recipients.some(row => row.kind === 'email'))
                await options.ensureSigningAuthority(wallet);
            const completed = await executeIssuance(
                saved,
                {
                    createTemplate: async () => {
                        const credential = buildReusableBoostTemplate(
                            saved.template,
                            wallet.id.did()
                        );
                        return wallet.invoke.createBoost(credential, {
                            name: saved.template.name.value,
                            category: getDefaultCategoryForCredential(credential) || 'Achievement',
                        });
                    },
                    submit: body => wallet.invoke.sendCredentialsViaInbox(body),
                    wait: (batchId, onProgress) =>
                        wallet.invoke.waitForInboxCredentialBatch(batchId, {
                            onProgress,
                            signal: abort.current?.signal,
                        }),
                    sendProfile: (profileId, templateUri, templateData) =>
                        wallet.invoke.send({
                            type: 'boost',
                            recipient: profileId,
                            templateUri,
                            templateData,
                        }),
                },
                {
                    currentScope,
                    retryFailed,
                    checkOnly,
                    onChange: next => {
                        if (
                            mounted.current &&
                            issuanceScopeKey(next.scope) === issuanceScopeKey(currentScope())
                        ) {
                            setRun(next);
                            runRef.current = next;
                        }
                    },
                }
            );
            if (!checkOnly) {
                const outcomes = Object.values(completed.outcomes);
                const duration = Date.now() - startedAt;
                if (outcomes.length && outcomes.every(row => row.state === 'sent')) {
                    track(AnalyticsEvents.CREDENTIAL_ISSUE_SUCCEEDED, {
                        ...metadata,
                        duration_ms: duration,
                    });
                    track(AnalyticsEvents.SEND_BOOST, {
                        category: metadata.category,
                        boostType: metadata.credential_type,
                        method: 'Issue Page',
                        msSinceMethodStarted: duration,
                    });
                } else
                    track(AnalyticsEvents.CREDENTIAL_ISSUE_FAILED, {
                        ...metadata,
                        step_id: 'issuance',
                        duration_ms: duration,
                        error_code: outcomes.some(row => row.state === 'confirming')
                            ? 'UNCONFIRMED'
                            : 'PARTIAL_FAILURE',
                    });
            }
        } catch (reason) {
            if (!checkOnly)
                track(AnalyticsEvents.CREDENTIAL_ISSUE_FAILED, {
                    ...metadata,
                    step_id: step,
                    duration_ms: Date.now() - startedAt,
                    error_code: reason instanceof IssuanceRecoveryError ? reason.code : undefined,
                });
            if (mounted.current)
                setError(
                    reason instanceof IssuanceRecoveryError || reason instanceof SpreadsheetError
                        ? spreadsheetErrorMessage(reason)
                        : getFriendlyIssueError(reason, 'people').message
                );
        } finally {
            executing.current = false;
            if (mounted.current) {
                setBusy(false);
                setChecking(false);
            }
        }
    };
    const locked = (rowId: string): boolean =>
        Boolean(run?.outcomes[rowId] && !['ready', 'failed'].includes(run.outcomes[rowId]!.state));
    const valuesForRow = (row: Recipient): Record<string, string> => {
        const key = recipientKey(row);
        if (locked(key)) {
            const frozen = run?.outcomes[key]?.templateData;
            if (frozen)
                return Object.fromEntries(
                    Object.entries(frozen).filter(([, value]) => typeof value === 'string')
                ) as Record<string, string>;
            for (const attempt of [...(run?.attempts ?? [])].reverse()) {
                const index = attempt.rowIds.indexOf(key);
                if (index >= 0)
                    return Object.fromEntries(
                        Object.entries(
                            attempt.body.items[index]?.configuration?.templateData ?? {}
                        ).filter(([, value]) => typeof value === 'string')
                    ) as Record<string, string>;
            }
        }
        return effectiveRowValues(
            row,
            options.variables,
            effectiveScopes,
            options.shared,
            options.values
        );
    };
    const canRemove = (rowId: string): boolean => canRemoveIssuanceRow(runRef.current, rowId);
    const changeRecipients = (recipients: Recipient[]): void => {
        if (!canReplaceIssuanceRecipients(runRef.current, recipients)) {
            setError(spreadsheetErrorMessage(new IssuanceRecoveryError('busy')));
            return;
        }
        options.setRecipients(
            recipients.map(row => ({ ...row, rowId: row.rowId ?? crypto.randomUUID() }))
        );
    };
    const allProblems = getRowProblems(
        options.recipients,
        options.variables,
        effectiveScopes,
        options.shared,
        options.values,
        evidence,
        formulaCells
    );
    const problems = Object.fromEntries(
        options.recipients
            .filter(row => !locked(recipientKey(row)))
            .map(row => {
                const key = recipientKey(row);
                return [
                    key,
                    [
                        ...(allProblems[key] ?? []),
                        ...(options.template
                            ? credentialRowProblems(options.template, valuesForRow(row))
                            : []),
                    ],
                ];
            })
    );
    const addColumn = (
        columnId: string,
        target: MappingTarget,
        config: Pick<ColumnMapping, 'dateFormat' | 'numericFormat' | 'creditUnit'>
    ): void => {
        if (busy || run?.templateUri) throw new IssuanceRecoveryError('busy');
        const column = source?.columns.find(item => item.id === columnId);
        if (!options.template || !column) throw new SpreadsheetError('mapping');
        const result = mapSpreadsheetColumn(options.template, draft, column, target, config);
        options.onRestoreTemplate(result.template);
        options.setValues(result.draft.values);
        setFormulaCells(result.draft.formulaCells ?? {});
        setMappings(result.draft.mappings ?? []);
        setScopes(previous => ({ ...previous, [result.variable]: 'perRecipient' }));
    };
    const removeColumn = (variable: string): void => {
        if (busy || run?.templateUri) throw new IssuanceRecoveryError('busy');
        if (!options.template) return;
        const result = removeSpreadsheetMapping(options.template, draft, variable);
        options.onRestoreTemplate(result.template);
        setMappings(result.draft.mappings ?? []);
    };
    const replaceTemplate = (template: OBv3CredentialTemplate, preserveMappings: boolean): void => {
        if (busy || runRef.current?.templateUri) throw new IssuanceRecoveryError('locked');
        const next = replaceSpreadsheetTemplate(template, draft, preserveMappings);
        options.setShared({});
        options.setValues(next.draft.values);
        setFormulaCells(next.draft.formulaCells ?? {});
        setMappings(next.draft.mappings ?? []);
        setScopes(
            Object.fromEntries(
                (next.draft.mappings ?? []).map(mapping => [mapping.variable, 'perRecipient'])
            )
        );
        options.onRestoreTemplate(next.template);
    };
    const previewRecipient =
        options.recipients[Math.min(previewIndex, Math.max(0, options.recipients.length - 1))];
    const changeScope = (name: string, value: 'shared' | 'perRecipient'): void => {
        if (value === 'perRecipient')
            options.setValues(previous =>
                Object.fromEntries(
                    options.recipients.map(row => [
                        recipientKey(row),
                        {
                            ...previous[recipientKey(row)],
                            [name]:
                                effectiveRowValues(
                                    row,
                                    [name],
                                    effectiveScopes,
                                    options.shared,
                                    previous
                                )[name] ?? '',
                        },
                    ])
                )
            );
        setScopes(previous => ({ ...previous, [name]: value }));
    };
    return {
        id,
        source,
        mappings,
        addColumn,
        removeColumn,
        replaceTemplate,
        draft,
        scopes: effectiveScopes,
        evidence,
        setEvidence,
        run,
        recoverable,
        dismissedRecoverable,
        dismissRecovery,
        restore,
        checkStatus: () => execute(false, undefined, true),
        busy,
        checking,
        error,
        setError,
        pastedText,
        setPastedText,
        importSheet,
        download,
        execute,
        apply,
        reset,
        locked,
        canRemove,
        changeRecipients,
        valuesForRow,
        problems,
        hasProblems: Object.values(problems).some(value => value.length > 0),
        previewRecipient,
        previewIndex,
        setPreviewIndex,
        previewLabel: previewRecipient ? recipientDisplayName(previewRecipient) : '',
        changeScope,
    };
};
