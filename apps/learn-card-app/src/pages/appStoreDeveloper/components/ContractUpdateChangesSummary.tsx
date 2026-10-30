import React from 'react';
import type { classifyContractChange } from '@learncard/helpers';
import type { ConsentFlowContract, ConsentFlowContractChanges } from '@learncard/types';
import { contractCategoryNameToCategoryMetadata } from 'learn-card-base';
import { mDynamic } from '../../../i18n/mDynamic';
import {
    CONTRACT_FORM_EXTRA_CATEGORY_LABELS,
    CONTRACT_FORM_TEXT_FIELDS,
} from './consentContractForm.helpers';
import type { ConsentContractFormValue } from './consentContractForm.types';

const FIELD_LABELS: Record<(typeof CONTRACT_FORM_TEXT_FIELDS)[number], string> = {
    name: 'developerPortal.components.createConsentContractModal.contractName',
    subtitle: 'developerPortal.components.createConsentContractModal.subtitle',
    description: 'developerPortal.components.createConsentContractModal.description',
    image: 'consentUpdate.editor.image',
    reasonForAccessing: 'developerPortal.components.createConsentContractModal.reasonForAccessing',
    redirectUrl: 'developerPortal.components.createConsentContractModal.redirectUrl',
};

type Props = {
    baseline: ConsentContractFormValue;
    value: ConsentContractFormValue;
    changes: ConsentFlowContractChanges;
    kind: ReturnType<typeof classifyContractChange>;
};

type ChangeRowProps = {
    title: string;
    change: 'new' | 'removed' | 'updated';
    before: React.ReactNode;
    after: React.ReactNode;
};

const enabledLabel = (enabled: boolean) =>
    mDynamic(enabled ? 'consentUpdate.editor.enabled' : 'consentUpdate.editor.disabled');

const scopeSetting = (config: ConsentFlowContract['read']['personal'][string]) => (
    <>
        {mDynamic(
            config.required
                ? 'consentUpdate.ui.required'
                : config.defaultEnabled
                  ? 'consentUpdate.editor.optionalOn'
                  : 'consentUpdate.editor.optionalOff'
        )}
        {config.reason && <p className="mt-1 text-xs text-grayscale-500">{config.reason}</p>}
    </>
);

const ChangeRow: React.FC<ChangeRowProps> = ({ title, change, before, after }) => (
    <li className="space-y-3 rounded-xl border border-grayscale-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-grayscale-900">{title}</p>
            <span className="shrink-0 rounded-full bg-grayscale-100 px-2 py-0.5 text-xs text-grayscale-700">
                {mDynamic(`consentUpdate.ui.${change}`)}
            </span>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
                <p className="mb-1 text-xs text-grayscale-500">
                    {mDynamic('consentUpdate.summary.before')}
                </p>
                <div className="break-words whitespace-pre-wrap text-grayscale-600">{before}</div>
            </div>
            <div>
                <p className="mb-1 text-xs text-grayscale-500">
                    {mDynamic('consentUpdate.summary.after')}
                </p>
                <div className="break-words whitespace-pre-wrap text-grayscale-900">{after}</div>
            </div>
        </div>
    </li>
);

const Group: React.FC<{ title: string; rows: React.ReactElement[] }> = ({ title, rows }) =>
    rows.length ? (
        <section className="space-y-3" aria-label={title}>
            <h4 className="text-sm font-medium text-grayscale-800">{title}</h4>
            <ul className="space-y-3">{rows}</ul>
        </section>
    ) : null;

/** Summarizes only the draft patch; it never changes or publishes the request. */
const ContractUpdateChangesSummary: React.FC<Props> = ({ baseline, value, changes, kind }) => {
    const rows: Record<'request' | 'read' | 'write', React.ReactElement[]> = {
        request: [],
        read: [],
        write: [],
    };
    for (const area of ['read', 'write'] as const) {
        const areaChanges = changes.contract?.[area];
        for (const type of ['credentials', 'personal'] as const) {
            const scopes =
                type === 'credentials'
                    ? areaChanges?.credentials?.categories
                    : areaChanges?.personal;
            const oldScopes =
                type === 'credentials'
                    ? baseline.contract[area].credentials.categories
                    : baseline.contract[area].personal;
            for (const [key, next] of Object.entries(scopes ?? {})) {
                const previous = oldScopes[key];
                const labelKey = CONTRACT_FORM_EXTRA_CATEGORY_LABELS[key];
                const title =
                    type === 'personal'
                        ? key
                        : labelKey
                          ? mDynamic(labelKey)
                          : (contractCategoryNameToCategoryMetadata(key)?.title ?? key);
                rows[area].push(
                    <ChangeRow
                        key={`${type}-${key}`}
                        title={title}
                        change={!next ? 'removed' : previous ? 'updated' : 'new'}
                        before={
                            previous
                                ? scopeSetting(previous)
                                : mDynamic('consentUpdate.summary.notRequested')
                        }
                        after={
                            next
                                ? scopeSetting(next)
                                : mDynamic('consentUpdate.summary.notRequested')
                        }
                    />
                );
            }
        }
        if (area === 'read' && areaChanges && 'anonymize' in areaChanges) {
            rows.read.push(
                <ChangeRow
                    key="anonymize"
                    title={mDynamic(
                        'developerPortal.components.createConsentContractModal.anonymizeData'
                    )}
                    change="updated"
                    before={enabledLabel(baseline.contract.read.anonymize ?? true)}
                    after={enabledLabel(value.contract.read.anonymize ?? true)}
                />
            );
        }
    }
    for (const field of CONTRACT_FORM_TEXT_FIELDS) {
        if (!(field in changes)) continue;
        const before = baseline[field];
        const after = value[field];
        rows.request.push(
            <ChangeRow
                key={field}
                title={mDynamic(FIELD_LABELS[field])}
                change="updated"
                before={
                    field === 'image' && before ? (
                        <img
                            src={before}
                            alt={mDynamic('consentUpdate.summary.before')}
                            className="h-12 w-12 rounded-xl object-cover"
                        />
                    ) : (
                        before || mDynamic('consentUpdate.editor.notSet')
                    )
                }
                after={
                    field === 'image' && after ? (
                        <img
                            src={after}
                            alt={mDynamic('consentUpdate.summary.after')}
                            className="h-12 w-12 rounded-xl object-cover"
                        />
                    ) : (
                        after || mDynamic('consentUpdate.editor.cleared')
                    )
                }
            />
        );
    }
    if ('needsGuardianConsent' in changes) {
        rows.request.push(
            <ChangeRow
                key="guardian"
                title={mDynamic(
                    'developerPortal.components.createConsentContractModal.guardianConsentFlow'
                )}
                change="updated"
                before={enabledLabel(Boolean(baseline.needsGuardianConsent))}
                after={enabledLabel(Boolean(value.needsGuardianConsent))}
            />
        );
    }
    if (!rows.request.length && !rows.read.length && !rows.write.length) return null;
    return (
        <section aria-label={mDynamic('consentUpdate.editor.summary')} className="space-y-5">
            <div>
                <h3 className="text-base font-semibold text-grayscale-900">
                    {mDynamic('consentUpdate.editor.summary')}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                    {mDynamic(
                        kind === 'requires_consent'
                            ? 'consentUpdate.editor.approvalNeeded'
                            : kind === 'expanded_optional'
                              ? 'consentUpdate.editor.optionalNotice'
                              : 'consentUpdate.editor.quietNotice'
                    )}
                </p>
            </div>
            <Group title={mDynamic('consentUpdate.summary.requestDetails')} rows={rows.request} />
            <Group title={mDynamic('consentUpdate.ui.readAccess')} rows={rows.read} />
            <Group title={mDynamic('consentUpdate.ui.writeAccess')} rows={rows.write} />
        </section>
    );
};

export default ContractUpdateChangesSummary;
