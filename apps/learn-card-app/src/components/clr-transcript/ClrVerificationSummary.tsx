import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    businessOutline,
    checkmarkCircleOutline,
    chevronDownOutline,
    documentTextOutline,
    helpCircleOutline,
    keyOutline,
    refreshOutline,
    shieldCheckmarkOutline,
    shieldOutline,
    timeOutline,
} from 'ionicons/icons';
import * as m from '../../paraglide/messages.js';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';
import {
    isClrPublisherVerified,
    isClrRecordConfirmed,
} from 'learn-card-base/helpers/credentials/clr/verification';
import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import type {
    ClrVerificationSnapshot,
    ClrCredentialVerification,
} from 'learn-card-base/helpers/credentials/clr/verification.types';
import { ClrRecordDrawerSection } from './ClrRecordDrawerSection';
import { ClrDrawerIdentifier } from './ClrDrawerIdentifier';

/** Signature, lifecycle and learner binding are separate facts, even when several fail. */
const statusText = (node: ClrCredentialVerification): string => {
    if (node.proof === 'checking') return m['clrRenderer.checkingVerification']();
    const labels: string[] = [];
    if (node.proof === 'invalid') labels.push(m['clrRenderer.signatureUnconfirmed']());
    if (node.lifecycle === 'revoked') labels.push(m['clrRenderer.revoked']());
    if (node.lifecycle === 'suspended') labels.push(m['clrRenderer.suspended']());
    if (node.proof === 'unavailable' || node.lifecycle === 'unavailable')
        labels.push(m['clrRenderer.couldNotVerify']());
    if (node.binding === 'mismatch') labels.push(m['clrRenderer.issuedDifferentLearner']());
    if (node.binding === 'unknown') labels.push(m['clrRenderer.learnerMatchUnknown']());
    if (labels.length) return labels.join(' · ');
    return node.proof === 'verified'
        ? m['clrRenderer.verifiedLabel']()
        : m['clrRenderer.unsigned']();
};

const verificationTheme = (
    node: ClrCredentialVerification,
    confirmed = isClrRecordConfirmed(node)
) => {
    if (node.proof === 'checking')
        return { icon: timeOutline, tone: 'bg-grayscale-100 text-grayscale-700' };

    if (node.proof === 'invalid')
        return { icon: alertCircleOutline, tone: 'bg-red-50 text-red-700' };

    if (
        node.lifecycle === 'revoked' ||
        node.lifecycle === 'suspended' ||
        node.binding === 'mismatch'
    )
        return { icon: alertCircleOutline, tone: 'bg-amber-50 text-amber-900' };

    return confirmed
        ? { icon: checkmarkCircleOutline, tone: 'bg-emerald-50 text-emerald-800' }
        : { icon: helpCircleOutline, tone: 'bg-grayscale-100 text-grayscale-700' };
};

const VerificationMark = ({
    icon,
    tone,
    children,
}: ReturnType<typeof verificationTheme> & { children: React.ReactNode }) => (
    <span
        className={`inline-flex max-w-full items-start gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium leading-4 ${tone}`}
    >
        <IonIcon aria-hidden="true" icon={icon} className="h-4 w-4 shrink-0" />
        <span className="min-w-0 wrap-anywhere">{children}</span>
    </span>
);

const EvidenceLine = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
    <p className="flex min-w-0 items-start gap-2 text-xs leading-relaxed text-grayscale-600">
        <IonIcon aria-hidden="true" icon={icon} className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0 wrap-anywhere">{children}</span>
    </p>
);

const VerificationDisclosureChevron = () => (
    <IonIcon
        aria-hidden="true"
        icon={chevronDownOutline}
        className="h-4 w-4 shrink-0 self-center text-grayscale-500 group-open:rotate-180 motion-safe:transition-transform"
    />
);

const disclosureClass =
    'flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-grayscale-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-600 [&::-webkit-details-marker]:hidden';

export interface ClrRecordVerificationProps {
    node?: ClrCredentialVerification;
    recordId: string;
    recordName?: string;
    publisherDid?: string;
    drawer?: boolean;
}

/** An existing row owns the record name; its status retains the same footprint while checking. */
export const ClrRecordVerification = ({
    node,
    recordId,
    recordName,
    publisherDid,
    drawer = false,
}: ClrRecordVerificationProps) => {
    if (!node) return null;
    const descendants: ClrCredentialVerification[] = [];
    const remaining = [...node.descendants];
    while (remaining.length) {
        const child = remaining.pop()!;
        if (child.proof !== 'unsigned') descendants.push(child);
        remaining.push(...child.descendants);
    }
    if (node.proof === 'unsigned' && !descendants.length) return null;
    const descendantIssue = descendants.some(child => !isClrRecordConfirmed(child));
    const descendantLabel = descendants.some(child => child.proof === 'checking')
        ? m['clrRenderer.checkingVerification']()
        : m['clrRenderer.includedRecordAttention']();
    const quiet =
        (node.proof === 'unsigned' && !descendantIssue) ||
        (!drawer &&
            Boolean(publisherDid) &&
            node.issuerDid === publisherDid &&
            (node.proof === 'checking' || isClrRecordConfirmed(node)));
    const label =
        node.proof === 'unsigned'
            ? descendantLabel
            : `${statusText(node)}${descendantIssue ? ` · ${descendantLabel}` : ''}`;
    if (quiet) return null;

    const issuer = node.issuerName ?? node.issuerDid ?? m['clrRenderer.issuerUnknown']();
    const theme =
        descendantIssue && (node.proof === 'unsigned' || isClrRecordConfirmed(node))
            ? { icon: helpCircleOutline, tone: 'bg-grayscale-100 text-grayscale-700' }
            : verificationTheme(node);
    return (
        <span className="block min-h-6">
            <span
                data-testid="clr-record-verification"
                data-record-id={recordId}
                aria-label={m['clrRenderer.recordVerificationLabel']({
                    record: recordName ?? m['clrRenderer.includedRecord'](),
                    issuer,
                    status: label,
                })}
            >
                <VerificationMark {...theme}>{label}</VerificationMark>
            </span>
        </span>
    );
};

const VerificationField = ({
    icon,
    label,
    children,
}: {
    icon: string;
    label: string;
    children: React.ReactNode;
}) => (
    <div className="relative min-w-0 ps-8 wrap-anywhere">
        <dt className="font-semibold">
            <IonIcon
                aria-hidden="true"
                icon={icon}
                className="absolute start-0 top-0.5 size-5 text-grayscale-600"
            />
            {label}
        </dt>
        <dd className="mt-0.5">{children}</dd>
    </div>
);

const hasSignedOccurrence = (node: ClrCredentialVerification): boolean =>
    node.proof !== 'unsigned' || node.descendants.some(hasSignedOccurrence);

/** Detail-only evidence; never substitute a descendant's signer for the containing record. */
export const ClrRecordVerificationDetails = (props: ClrRecordVerificationProps) => {
    if (!props.node) return null;
    const evidence = <RecordVerificationEvidence {...props} showVerdict={!props.drawer} />;
    if (!props.drawer) return evidence;
    if (!hasSignedOccurrence(props.node)) return null;

    return (
        <ClrRecordDrawerSection title={m['clrTranscript.details.verificationDetails']()}>
            {evidence}
        </ClrRecordDrawerSection>
    );
};

const RecordVerificationEvidence = (
    props: ClrRecordVerificationProps & { showVerdict: boolean }
) => {
    const { node, recordId, drawer, showVerdict } = props;
    if (!node) return null;
    const visible =
        node.proof !== 'unsigned' &&
        (drawer || !(node.issuerDid === props.publisherDid && isClrRecordConfirmed(node)));
    return (
        <div
            className={
                drawer
                    ? 'space-y-3 text-sm text-grayscale-900'
                    : 'flex flex-col gap-2 text-xs leading-relaxed text-grayscale-700'
            }
        >
            {visible && (
                <>
                    {showVerdict && <ClrRecordVerification {...props} />}
                    {node.proof === 'invalid' && (
                        <p>{m['clrRenderer.signatureCheckFailedExplanation']()}</p>
                    )}
                    {(node.proof === 'unavailable' || node.lifecycle === 'unavailable') && (
                        <p>{m['clrRenderer.verificationIncompleteExplanation']()}</p>
                    )}
                    {drawer ? (
                        <dl className="space-y-3">
                            <VerificationField
                                icon={businessOutline}
                                label={m['clrTranscript.details.issuerDid']()}
                            >
                                {node.issuerDid ? (
                                    <ClrDrawerIdentifier
                                        key={node.issuerDid}
                                        label={m['clrTranscript.details.issuerDid']()}
                                        value={node.issuerDid}
                                    />
                                ) : (
                                    m['clrRenderer.issuerUnknown']()
                                )}
                            </VerificationField>
                            {node.verificationMethods.map(method => (
                                <VerificationField
                                    key={method}
                                    icon={keyOutline}
                                    label={m['clrTranscript.details.verificationMethod']()}
                                >
                                    <ClrDrawerIdentifier
                                        label={m['clrTranscript.details.verificationMethod']()}
                                        value={method}
                                    />
                                </VerificationField>
                            ))}
                            {node.checks.length > 0 && (
                                <VerificationField
                                    icon={shieldOutline}
                                    label={m['clrTranscript.details.checksCompleted']()}
                                >
                                    {node.checks.join(', ')}
                                </VerificationField>
                            )}
                        </dl>
                    ) : (
                        <>
                            <EvidenceLine icon={businessOutline}>
                                {m['clrRenderer.issuerDid']({
                                    did: node.issuerDid ?? m['clrRenderer.issuerUnknown'](),
                                })}
                            </EvidenceLine>
                            {node.verificationMethods.map(method => (
                                <EvidenceLine key={method} icon={keyOutline}>
                                    {m['clrRenderer.verificationMethod']({ method })}
                                </EvidenceLine>
                            ))}
                            {node.checks.length > 0 && (
                                <EvidenceLine icon={shieldOutline}>
                                    {m['clrRenderer.checksRun']({ checks: node.checks.join(', ') })}
                                </EvidenceLine>
                            )}
                        </>
                    )}
                </>
            )}
            {node.descendants.map(child => (
                <RecordVerificationEvidence
                    key={child.occurrencePath}
                    node={child}
                    recordId={`${recordId}::${child.occurrencePath}`}
                    recordName={m['clrRenderer.includedRecord']()}
                    publisherDid={props.publisherDid}
                    drawer={drawer}
                    showVerdict
                />
            ))}
        </div>
    );
};

const RegistryLabel = ({
    did,
    attempt,
    canRetry,
}: {
    did?: string;
    attempt: number;
    canRetry: boolean;
}) => {
    const query = useKnownDIDRegistry(did);
    const [timedOut, setTimedOut] = useState(false);
    const [retried, setRetried] = useState(false);
    useEffect(() => {
        setTimedOut(false);
        const timer = window.setTimeout(() => setTimedOut(true), 30_000);
        return () => window.clearTimeout(timer);
    }, [did, attempt]);
    useEffect(() => {
        if (attempt > 0 && did) void query.refetch();
    }, [attempt, did, query.refetch]);

    const unavailable = !did || query.isError || query.data?.incomplete || query.isPending;
    const data = query.data;
    const matches = data && data.source !== 'unknown' ? data.results.matchingIssuers : [];
    const label = unavailable
        ? `${m['clrRenderer.registryUnavailable']()}${query.isPending && !timedOut ? '…' : ''}`
        : data?.source === 'trusted'
          ? m['clrRenderer.trustedRegistry']()
          : data?.source === 'untrusted'
            ? m['clrRenderer.untrustedRegistry']()
            : m['clrRenderer.notListed']();
    return (
        <div className="flex flex-col gap-1.5">
            <EvidenceLine icon={shieldOutline}>{label}</EvidenceLine>
            {!unavailable && (
                <div className="flex flex-col gap-1.5 ps-6 text-xs leading-relaxed text-grayscale-600">
                    <p>{m['clrRenderer.verificationRegistryInfo']()}</p>
                    {matches.map((match, index) => (
                        <details key={index}>
                            <summary className="cursor-pointer font-medium">
                                {m['clrRenderer.registryEntry']()}
                            </summary>
                            <pre className="max-h-40 overflow-auto whitespace-pre-wrap wrap-anywhere">
                                {JSON.stringify(match, null, 2)}
                            </pre>
                        </details>
                    ))}
                </div>
            )}
            {canRetry && did && (retried || (unavailable && !query.isPending)) && (
                <button
                    type="button"
                    aria-disabled={query.isFetching}
                    onClick={() => {
                        if (query.isFetching) return;
                        setRetried(true);
                        void query.refetch();
                    }}
                    className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-[20px] px-2 text-xs font-medium text-grayscale-700 hover:bg-grayscale-100 focus-visible:outline-2 focus-visible:outline-emerald-600 aria-disabled:opacity-40"
                >
                    <IonIcon aria-hidden="true" icon={refreshOutline} className="h-4 w-4" />
                    {m['common.tryAgain']()}
                </button>
            )}
        </div>
    );
};

interface IssuerRecord {
    id: string;
    ownerId: string;
    hasCanonicalOwner: boolean;
    name: string;
    node: ClrCredentialVerification;
}

export const ClrVerificationSummary = ({
    snapshot,
    retry,
    publisherDid,
    issuerNames = {},
    model,
    onSelectRecord,
}: {
    snapshot?: ClrVerificationSnapshot;
    retry?: () => void;
    publisherDid?: string;
    issuerNames?: Record<string, string>;
    model?: ClrTranscriptDisplayModel;
    onSelectRecord?: (id: string) => void;
}) => {
    const [registryAttempt, setRegistryAttempt] = useState(0);
    if (!snapshot) return null;
    const entries: IssuerRecord[] = [];
    const canonicalRecords = new Map(model?.canonical.records.map(record => [record.id, record]));
    const seenPaths = new Set<string>();
    const visit = (
        ownerId: string,
        node: ClrCredentialVerification,
        descendant = false,
        hasCanonicalOwner = true
    ): void => {
        if (seenPaths.has(node.occurrencePath)) return;
        seenPaths.add(node.occurrencePath);
        if (node.proof !== 'unsigned' && node.occurrencePath !== '') {
            const record = canonicalRecords.get(ownerId);
            entries.push({
                id: descendant ? `${ownerId}::${node.occurrencePath}` : ownerId,
                ownerId,
                hasCanonicalOwner,
                name:
                    record?.name?.value ??
                    record?.credentialName?.value ??
                    m['clrRenderer.includedRecord'](),
                node,
            });
        }
        node.descendants.forEach(child => visit(ownerId, child, true, hasCanonicalOwner));
    };
    Object.entries(snapshot.records).forEach(([id, node]) => visit(id, node));
    snapshot.outer.descendants.forEach(node => {
        if (!seenPaths.has(node.occurrencePath)) visit(node.occurrencePath, node, true, false);
    });
    const differentIssuers = new Map<string, IssuerRecord[]>();
    for (const entry of entries) {
        if (entry.node.issuerDid === publisherDid) continue;
        const did = entry.node.issuerDid ?? '';
        const records = differentIssuers.get(did);
        if (records) records.push(entry);
        else differentIssuers.set(did, [entry]);
    }
    const exceptions = entries.filter(entry => !isClrRecordConfirmed(entry.node));
    const qualifiers: string[] = [];
    for (const [matches, label] of [
        [
            exceptions.filter(entry => entry.node.proof === 'invalid'),
            m['clrRenderer.recordsSignatureUnconfirmed'],
        ],
        [
            exceptions.filter(entry => entry.node.lifecycle === 'revoked'),
            m['clrRenderer.recordsRevoked'],
        ],
        [
            exceptions.filter(entry => entry.node.lifecycle === 'suspended'),
            m['clrRenderer.recordsSuspended'],
        ],
        [
            exceptions.filter(
                entry =>
                    entry.node.proof === 'unavailable' || entry.node.lifecycle === 'unavailable'
            ),
            m['clrRenderer.recordsCouldNotVerify'],
        ],
        [
            exceptions.filter(
                entry => entry.node.binding === 'mismatch' || entry.node.binding === 'unknown'
            ),
            m['clrRenderer.recordsLearnerUnconfirmed'],
        ],
    ] as const) {
        const count = new Set(matches.map(entry => entry.ownerId)).size;
        if (count) qualifiers.push(label({ count }));
    }
    const publisher =
        model?.header.issuerName?.value ??
        snapshot.outer.issuerName ??
        (publisherDid && issuerNames[publisherDid]) ??
        publisherDid ??
        m['clrRenderer.issuerUnknown']();
    const outerStatus = snapshot.complete
        ? statusText(snapshot.outer)
        : m['clrRenderer.checkingVerification']();
    let headline: string = m['clrRenderer.publisherSummary']({ status: outerStatus, publisher });
    if (snapshot.complete && qualifiers.length) headline += ` · ${qualifiers.join(' · ')}`;
    else if (snapshot.complete && differentIssuers.size)
        headline += ` · ${m['clrRenderer.certifyingIssuers']({ count: differentIssuers.size })}`;
    const retryable =
        snapshot.outer.proof === 'unavailable' ||
        snapshot.outer.lifecycle === 'unavailable' ||
        exceptions.some(
            entry => entry.node.proof === 'unavailable' || entry.node.lifecycle === 'unavailable'
        );
    const runRetry = () => {
        if (!snapshot.complete) return;
        setRegistryAttempt(value => value + 1);
        retry?.();
    };
    const retryControl = (
        <button
            type="button"
            onClick={runRetry}
            aria-disabled={!snapshot.complete}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-[20px] border border-grayscale-300 bg-white px-3 text-xs font-medium text-grayscale-700 hover:bg-grayscale-10 focus-visible:outline-2 focus-visible:outline-emerald-600 aria-disabled:cursor-wait aria-disabled:opacity-40"
        >
            <IonIcon aria-hidden="true" icon={refreshOutline} className="h-4 w-4 shrink-0" />
            {snapshot.complete
                ? m['clrRenderer.retryVerification']()
                : m['clrRenderer.checkingVerification']()}
        </button>
    );
    const outerTheme = snapshot.complete
        ? verificationTheme(snapshot.outer, isClrPublisherVerified(snapshot))
        : { icon: timeOutline, tone: 'bg-grayscale-100 text-grayscale-700' };
    const hasDepth = differentIssuers.size > 0;
    if (!entries.length && snapshot.outer.proof === 'unsigned') return null;
    return (
        <section data-testid="clr-verification-summary" className="flex flex-col gap-2.5">
            <p
                data-testid="clr-outer-verification"
                className="flex items-start gap-2.5 rounded-xl border border-grayscale-200 bg-grayscale-10 px-3 py-2.5 text-sm font-medium leading-5 text-grayscale-900"
            >
                <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${outerTheme.tone}`}
                >
                    <IonIcon aria-hidden="true" icon={outerTheme.icon} className="h-4 w-4" />
                </span>
                <span
                    className={`min-w-0 self-center wrap-anywhere ${
                        hasDepth ? 'min-h-[4lh] sm:min-h-[2lh]' : 'min-h-[2lh]'
                    } lg:min-h-[1lh]`}
                >
                    {headline}
                </span>
            </p>
            <span className="sr-only" role="status" aria-live="polite">
                {snapshot.complete ? headline : ''}
            </span>
            {hasDepth && (
                <div className="flex flex-col gap-2">
                    <details className="group rounded-xl border border-grayscale-200 bg-white">
                        <summary className={disclosureClass}>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-700">
                                <IonIcon
                                    aria-hidden="true"
                                    icon={shieldCheckmarkOutline}
                                    className="h-[18px] w-[18px]"
                                />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="text-sm font-semibold leading-5 text-grayscale-900">
                                    {m['clrRenderer.publisherDetails']()}
                                </span>
                                <span className="text-xs leading-4 text-grayscale-600 wrap-anywhere">
                                    {publisher}
                                </span>
                            </span>
                            <VerificationDisclosureChevron />
                        </summary>
                        <div className="flex flex-col gap-2 border-t border-grayscale-200 px-3 py-3 sm:px-4">
                            <EvidenceLine icon={businessOutline}>
                                {m['clrRenderer.issuerDid']({
                                    did: publisherDid ?? m['clrRenderer.issuerUnknown'](),
                                })}
                            </EvidenceLine>
                            <RegistryLabel
                                did={publisherDid}
                                attempt={registryAttempt}
                                canRetry={Boolean(retry)}
                            />
                            {snapshot.outer.verificationMethods.map(method => (
                                <EvidenceLine key={method} icon={keyOutline}>
                                    {m['clrRenderer.verificationMethod']({ method })}
                                </EvidenceLine>
                            ))}
                        </div>
                    </details>
                    {[...differentIssuers].map(([did, records]) => {
                        const source = records[0].node;
                        const profile = canonicalRecords.get(records[0].ownerId)?.provenance.issuer;
                        const name =
                            issuerNames[did] ??
                            source.issuerName ??
                            profile?.name?.value ??
                            (did || m['clrRenderer.issuerUnknown']());
                        const image =
                            source.issuerImage ??
                            (typeof profile?.image === 'string'
                                ? profile.image
                                : profile?.image?.id);
                        const groupConfirmed = records.every(entry =>
                            isClrRecordConfirmed(entry.node)
                        );
                        const groupStatus = groupConfirmed
                            ? m['clrRenderer.verifiedLabel']()
                            : !snapshot.complete
                              ? m['clrRenderer.checkingVerification']()
                              : m['clrRenderer.recordsNotFullyVerified']({
                                    count: new Set(
                                        records
                                            .filter(entry => !isClrRecordConfirmed(entry.node))
                                            .map(entry => entry.ownerId)
                                    ).size,
                                });
                        return (
                            <details
                                key={did}
                                aria-label={m['clrRenderer.verificationDetailsFor']({
                                    issuer: name,
                                })}
                                className="group rounded-xl border border-grayscale-200 bg-white"
                            >
                                <summary
                                    aria-label={m['clrRenderer.verificationDetailsFor']({
                                        issuer: name,
                                    })}
                                    className={disclosureClass}
                                >
                                    {typeof image === 'string' ? (
                                        <img
                                            src={image}
                                            alt=""
                                            width={36}
                                            height={36}
                                            className="h-9 w-9 shrink-0 rounded-full bg-grayscale-10 object-contain"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-sm font-semibold text-grayscale-800"
                                        >
                                            {name.slice(0, 1)}
                                        </span>
                                    )}
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="text-sm font-semibold leading-5 text-grayscale-900 wrap-anywhere">
                                            {name}
                                        </span>
                                        <span className="flex flex-col items-start gap-x-2 gap-y-0.5 text-xs leading-4 text-grayscale-600 sm:flex-row sm:flex-wrap sm:items-center">
                                            <span>
                                                {m['clrRenderer.verificationRecordsCount']({
                                                    count: records.length,
                                                })}
                                            </span>
                                            <span
                                                className={`inline-flex max-w-full items-start gap-1 ${
                                                    groupConfirmed
                                                        ? 'text-emerald-800'
                                                        : snapshot.complete
                                                          ? 'text-amber-900'
                                                          : ''
                                                }`}
                                            >
                                                <IonIcon
                                                    aria-hidden="true"
                                                    icon={
                                                        groupConfirmed
                                                            ? checkmarkCircleOutline
                                                            : snapshot.complete
                                                              ? alertCircleOutline
                                                              : timeOutline
                                                    }
                                                    className="h-4 w-4 shrink-0"
                                                />
                                                <span className="grid min-w-0 wrap-anywhere">
                                                    {/* Keep translated status wrapping stable during verification. */}
                                                    <span
                                                        aria-hidden="true"
                                                        className="invisible col-start-1 row-start-1"
                                                    >
                                                        {m['clrRenderer.checkingVerification']()}
                                                    </span>
                                                    <span
                                                        aria-hidden="true"
                                                        className="invisible col-start-1 row-start-1"
                                                    >
                                                        {m['clrRenderer.recordsNotFullyVerified']({
                                                            count: records.length,
                                                        })}
                                                    </span>
                                                    <span className="col-start-1 row-start-1">
                                                        {groupStatus}
                                                    </span>
                                                </span>
                                            </span>
                                        </span>
                                    </span>
                                    <VerificationDisclosureChevron />
                                </summary>
                                <div className="flex flex-col gap-2.5 border-t border-grayscale-200 px-3 py-3 sm:px-4">
                                    <EvidenceLine icon={businessOutline}>
                                        {m['clrRenderer.issuerDid']({
                                            did: did || m['clrRenderer.issuerUnknown'](),
                                        })}
                                    </EvidenceLine>
                                    <RegistryLabel
                                        did={did || undefined}
                                        attempt={registryAttempt}
                                        canRetry={Boolean(retry)}
                                    />
                                    {[
                                        ...new Set(
                                            records.flatMap(entry => entry.node.verificationMethods)
                                        ),
                                    ].map(method => (
                                        <EvidenceLine key={method} icon={keyOutline}>
                                            {m['clrRenderer.verificationMethod']({ method })}
                                        </EvidenceLine>
                                    ))}
                                    <ul className="divide-y divide-grayscale-200 rounded-xl border border-grayscale-200 bg-grayscale-10">
                                        {records.map(entry => (
                                            <li
                                                key={entry.id}
                                                className="flex min-w-0 gap-2 px-2.5 py-2 sm:gap-2.5 sm:p-3"
                                            >
                                                <IonIcon
                                                    aria-hidden="true"
                                                    icon={documentTextOutline}
                                                    className="mt-0.5 h-4 w-4 shrink-0 text-grayscale-500"
                                                />
                                                <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                                                    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5">
                                                        {onSelectRecord &&
                                                        entry.hasCanonicalOwner ? (
                                                            <button
                                                                type="button"
                                                                className="rounded-[20px] text-start text-sm font-medium leading-5 text-grayscale-900 underline decoration-grayscale-400 underline-offset-2 hover:decoration-grayscale-900 focus-visible:outline-2 focus-visible:outline-emerald-600 wrap-anywhere"
                                                                onClick={() =>
                                                                    onSelectRecord(entry.ownerId)
                                                                }
                                                            >
                                                                {entry.name}
                                                            </button>
                                                        ) : (
                                                            <span className="text-sm font-medium leading-5 text-grayscale-900 wrap-anywhere">
                                                                {entry.name}
                                                            </span>
                                                        )}
                                                        <VerificationMark
                                                            {...verificationTheme(entry.node)}
                                                        >
                                                            {statusText(entry.node)}
                                                        </VerificationMark>
                                                    </div>
                                                    {entry.node.proof === 'invalid' && (
                                                        <p className="text-xs leading-relaxed text-grayscale-600">
                                                            {m[
                                                                'clrRenderer.signatureCheckFailedExplanation'
                                                            ]()}
                                                        </p>
                                                    )}
                                                    {(entry.node.proof === 'unavailable' ||
                                                        entry.node.lifecycle === 'unavailable') && (
                                                        <p className="text-xs leading-relaxed text-grayscale-600">
                                                            {m[
                                                                'clrRenderer.verificationIncompleteExplanation'
                                                            ]()}
                                                        </p>
                                                    )}
                                                    {entry.node.checks.length > 0 && (
                                                        <p className="text-xs leading-relaxed text-grayscale-600 wrap-anywhere">
                                                            {m['clrRenderer.checksRun']({
                                                                checks: entry.node.checks.join(
                                                                    ', '
                                                                ),
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                        );
                    })}
                </div>
            )}
            {retry && ((snapshot.complete && retryable) || registryAttempt > 0) && retryControl}
        </section>
    );
};
