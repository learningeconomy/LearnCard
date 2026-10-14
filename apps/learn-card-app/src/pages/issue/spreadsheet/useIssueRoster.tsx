import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
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
    exportRosterCsv,
    downloadRosterCsv,
    type ColumnScopes,
} from './roster';
import { executeIssuance } from './issuance';
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
import { normalizeColumn, type ParsedSpreadsheet, type RosterDraft } from './types';
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
    onRestoreTemplate: (template: OBv3CredentialTemplate) => void;
    onPeople: () => void;
    initWallet: () => Promise<BespokeLearnCard>;
    ensureSigningAuthority: (wallet: BespokeLearnCard) => Promise<unknown>;
}

export const useIssueRoster = (options: RosterOptions) => {
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
    const [source, setSource] = useState<ParsedSpreadsheet>();
    const [scopes, setScopes] = useState<ColumnScopes>({});
    const [formulaCells, setFormulaCells] = useState<RosterDraft['formulaCells']>({});
    const [evidence, setEvidence] = useState<Record<string, string>>({});
    const [run, setRun] = useState<IssuanceRun | null>(null);
    const runRef = useRef(run);
    runRef.current = run;
    const [recoverable, setRecoverable] = useState<IssuanceRun | null>(null);
    const [busy, setBusy] = useState(false);
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
        setId(saved.id);
        setSource(saved.draft.source);
        setScopes(saved.scopes);
        setEvidence(saved.draft.evidence);
        setFormulaCells(saved.draft.formulaCells ?? {});
        options.setRecipients(saved.draft.recipients);
        options.setValues(saved.draft.values);
        options.setShared(saved.shared);
        options.setAttachments(saved.draft.attachments ?? {});
        options.onRestoreTemplate(saved.template);
        options.onPeople();
        setRun(saved);
        runRef.current = saved;
        setRecoverable(null);
    };
    const reset = (): void => {
        abort.current?.abort();
        setId(crypto.randomUUID());
        setSource(undefined);
        setFormulaCells({});
        setScopes({});
        setEvidence({});
        setRun(null);
        runRef.current = null;
        setRecoverable(null);
        setPreviewIndex(0);
        setError('');
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
                setId(crypto.randomUUID());
                setSource(undefined);
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
                setRecoverable(
                    runs.find(
                        saved =>
                            saved.attempts.some(attempt => !attempt.done) ||
                            !Object.values(saved.outcomes).every(row => row.state === 'sent')
                    ) ?? null
                );
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
    const saveDraft = async (saved: IssuanceRun): Promise<void> => {
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
        if (mounted.current && issuanceScopeKey(saved.scope) === issuanceScopeKey(currentScope())) {
            setRun(saved);
            runRef.current = saved;
        }
    };
    useEffect(() => {
        if (busy || !scope.issuer || !options.template || !options.recipients.length) return;
        const timer = setTimeout(() => {
            void saveDraft(capture()).catch(reason => {
                if (mounted.current) setError(spreadsheetErrorMessage(reason));
            });
        }, 600);
        return () => clearTimeout(timer);
    }, [
        id,
        scopeKey,
        busy,
        source,
        scopes,
        evidence,
        formulaCells,
        options.template,
        options.recipients,
        options.shared,
        options.values,
        options.attachments,
    ]);

    const download = async (failuresOnly = false): Promise<void> => {
        const saved = capture();
        if (saved.draft.recipients.length) await saveDraft(saved);
        const failures = failuresOnly
            ? Object.fromEntries(
                  Object.entries(saved.outcomes)
                      .filter(([, value]) => value.state === 'failed')
                      .map(([rowId, value]) => [
                          rowId,
                          getFriendlyIssueError({ message: value.error?.message }, 'people')
                              .message,
                      ])
              )
            : undefined;
        downloadRosterCsv(
            exportRosterCsv(
                {
                    ...saved.draft,
                    values: Object.fromEntries(
                        saved.draft.recipients.map(row => [recipientKey(row), valuesForRow(row)])
                    ),
                },
                options.variables,
                Object.fromEntries(options.variables.map(name => [name, 'perRecipient' as const])),
                {},
                failures
            ),
            failuresOnly ? 'people-to-retry.csv' : 'credential-recipients.csv'
        );
    };
    const importSheet = async (sheet: ParsedSpreadsheet): Promise<void> => {
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
                        (existing.kind === 'email' && existing.email === row.email)
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
                    (existing.kind === 'email' && incoming.email !== existing.email) ||
                    merged.mapped.some(name => after[name] !== before[name]) ||
                    merged.draft.evidence[key] !== saved.draft.evidence[key]
                )
                    throw new IssuanceRecoveryError('busy');
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
            setSource(sheet);
            options.setRecipients(merged.draft.recipients);
            options.setValues(merged.draft.values);
            setEvidence(merged.draft.evidence);
            setFormulaCells(merged.draft.formulaCells ?? {});
            setScopes(nextScopes);
            options.onPeople();
        }
    };
    const execute = async (retryFailed = false, restore?: IssuanceRun): Promise<void> => {
        if (busy) return;
        setBusy(true);
        setError('');
        abort.current = new AbortController();
        try {
            const saved = restore ?? capture();
            if (restore) apply(restore);
            const variables = extractVariablesByType(saved.template).dynamic;
            const candidates = saved.draft.recipients.filter(row =>
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
                if (candidates.some(row => issues[recipientKey(row)]?.length))
                    throw new SpreadsheetError('mapping');
                const checked = new Set<string>();
                for (const row of candidates) {
                    const filled = applyVariableValues(
                        templateToJson(saved.template),
                        effectiveRowValues(
                            row,
                            variables,
                            saved.scopes,
                            saved.shared,
                            saved.draft.values
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
            const wallet = await options.initWallet();
            const activeProfile = await wallet.invoke.getProfile();
            if (activeProfile?.profileId !== saved.scope.issuer)
                throw new IssuanceRecoveryError('context');
            if (saved.draft.recipients.some(row => row.kind === 'email'))
                await options.ensureSigningAuthority(wallet);
            await executeIssuance(
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
        } catch (reason) {
            if (mounted.current)
                setError(
                    reason instanceof IssuanceRecoveryError || reason instanceof SpreadsheetError
                        ? spreadsheetErrorMessage(reason)
                        : getFriendlyIssueError(reason, 'people').message
                );
        } finally {
            if (mounted.current) setBusy(false);
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
        Object.entries(allProblems).filter(([key]) => !locked(key))
    );
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
        draft,
        scopes: effectiveScopes,
        evidence,
        setEvidence,
        run,
        recoverable,
        busy,
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
