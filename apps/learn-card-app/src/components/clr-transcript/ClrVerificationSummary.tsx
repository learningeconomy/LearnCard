import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, helpCircleOutline } from 'ionicons/icons';
import * as m from '../../paraglide/messages.js';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';
import { isClrRecordConfirmed } from 'learn-card-base/helpers/credentials/clr/verification';
import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import type {
    ClrVerificationSnapshot,
    ClrCredentialVerification,
} from 'learn-card-base/helpers/credentials/clr/verification.types';

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

const nodeTone = (node: ClrCredentialVerification) =>
    node.proof === 'invalid'
        ? 'text-red-700'
        : node.lifecycle === 'revoked' ||
            node.lifecycle === 'suspended' ||
            node.binding === 'mismatch'
          ? 'text-amber-800'
          : isClrRecordConfirmed(node)
            ? 'text-emerald-700'
            : 'text-grayscale-600';

export interface ClrRecordVerificationProps {
    node?: ClrCredentialVerification;
    recordId: string;
    recordName?: string;
    publisherDid?: string;
}

/** An existing row owns the record name; its status retains the same footprint while checking. */
export const ClrRecordVerification = ({
    node,
    recordId,
    recordName,
    publisherDid,
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
        (Boolean(publisherDid) &&
            node.issuerDid === publisherDid &&
            (node.proof === 'checking' || isClrRecordConfirmed(node)));
    const label =
        node.proof === 'unsigned'
            ? descendantLabel
            : `${statusText(node)}${descendantIssue ? ` · ${descendantLabel}` : ''}`;
    const issuer = node.issuerName ?? node.issuerDid ?? m['clrRenderer.issuerUnknown']();
    return (
        <span className="block h-10 overflow-auto text-xs leading-5">
            {!quiet && (
                <span
                    data-testid="clr-record-verification"
                    data-record-id={recordId}
                    aria-label={m['clrRenderer.recordVerificationLabel']({
                        record: recordName ?? m['clrRenderer.includedRecord'](),
                        issuer,
                        status: label,
                    })}
                    className={`inline-flex items-start gap-1.5 ${nodeTone(node)}`}
                >
                    <IonIcon
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0"
                        icon={
                            node.proof === 'invalid' ||
                            node.lifecycle === 'revoked' ||
                            node.lifecycle === 'suspended' ||
                            node.binding === 'mismatch'
                                ? alertCircleOutline
                                : isClrRecordConfirmed(node)
                                  ? checkmarkCircleOutline
                                  : helpCircleOutline
                        }
                    />
                    {label}
                </span>
            )}
        </span>
    );
};

/** Detail-only evidence; never substitute a descendant's signer for the containing record. */
export const ClrRecordVerificationDetails = (props: ClrRecordVerificationProps) => {
    const { node, recordId } = props;
    if (!node) return null;
    const visible =
        node.proof !== 'unsigned' &&
        !(node.issuerDid === props.publisherDid && isClrRecordConfirmed(node));
    return (
        <div className="space-y-2 text-xs text-grayscale-700">
            {visible && (
                <>
                    <ClrRecordVerification {...props} />
                    {node.proof === 'invalid' && (
                        <p>{m['clrRenderer.signatureCheckFailedExplanation']()}</p>
                    )}
                    {(node.proof === 'unavailable' || node.lifecycle === 'unavailable') && (
                        <p>{m['clrRenderer.verificationIncompleteExplanation']()}</p>
                    )}
                    <p className="break-all">
                        {m['clrRenderer.issuerDid']({
                            did: node.issuerDid ?? m['clrRenderer.issuerUnknown'](),
                        })}
                    </p>
                    {node.verificationMethods.map(method => (
                        <p key={method} className="break-all">
                            {m['clrRenderer.verificationMethod']({ method })}
                        </p>
                    ))}
                    <p className="min-h-10">
                        {node.checks.length > 0
                            ? m['clrRenderer.checksRun']({ checks: node.checks.join(', ') })
                            : ''}
                    </p>
                </>
            )}
            {node.descendants.map(child => (
                <ClrRecordVerificationDetails
                    key={child.occurrencePath}
                    node={child}
                    recordId={`${recordId}::${child.occurrencePath}`}
                    recordName={m['clrRenderer.includedRecord']()}
                    publisherDid={props.publisherDid}
                />
            ))}
        </div>
    );
};

const RegistryLabel = ({
    did,
    attempt,
    details = false,
}: {
    did?: string;
    attempt: number;
    details?: boolean;
}) => {
    const query = useKnownDIDRegistry(did);
    const [timedOut, setTimedOut] = useState(false);
    useEffect(() => {
        setTimedOut(false);
        const timer = window.setTimeout(() => setTimedOut(true), 30_000);
        return () => window.clearTimeout(timer);
    }, [did, attempt]);
    useEffect(() => {
        if (attempt > 0 && did && !details) void query.refetch();
    }, [attempt, did, details, query.refetch]);
    if (!did || query.isError || query.data?.incomplete || query.isPending) {
        return (
            <span
                className={`${details ? 'block h-28' : 'flex h-10 items-center'} overflow-auto text-grayscale-600`}
            >
                {m['clrRenderer.registryUnavailable']()}
                {query.isPending && !timedOut ? '…' : ''}
            </span>
        );
    }
    const data = query.data;
    const matches = data && data.source !== 'unknown' ? data.results.matchingIssuers : [];
    const label =
        query.data?.source === 'trusted'
            ? m['clrRenderer.trustedRegistry']()
            : query.data?.source === 'untrusted'
              ? m['clrRenderer.untrustedRegistry']()
              : m['clrRenderer.notListed']();
    if (!details) return <span className="block h-10 overflow-auto">{label}</span>;
    return (
        <div className="h-28 overflow-auto space-y-1">
            <span>{label}</span>
            {matches.map((match, index) => (
                <details key={index}>
                    <summary className="cursor-pointer">{m['clrRenderer.registryEntry']()}</summary>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(match, null, 2)}
                    </pre>
                </details>
            ))}
            <p className="text-grayscale-600">{m['clrRenderer.verificationRegistryInfo']()}</p>
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
            className="rounded-[20px] border border-grayscale-300 px-3 py-2 text-sm aria-disabled:opacity-40 aria-disabled:cursor-wait"
        >
            {snapshot.complete
                ? m['clrRenderer.retryVerification']()
                : m['clrRenderer.checkingVerification']()}
        </button>
    );
    const hasDepth = differentIssuers.size > 0;
    if (!entries.length && snapshot.outer.proof === 'unsigned') return null;
    return (
        <section data-testid="clr-verification-summary" className="space-y-2 text-grayscale-700">
            <p
                data-testid="clr-outer-verification"
                className="h-20 overflow-auto text-sm leading-5 font-medium"
            >
                {headline}
            </p>
            <span className="sr-only" role="status" aria-live="polite">
                {snapshot.complete ? headline : ''}
            </span>
            {hasDepth && (
                <div className="space-y-2">
                    <details className="rounded-xl border border-grayscale-200 p-3 text-xs">
                        <summary className="cursor-pointer">
                            {m['clrRenderer.publisherDetails']()} · {publisher}
                        </summary>
                        <div className="mt-2 space-y-2">
                            <p className="break-all">
                                {m['clrRenderer.issuerDid']({
                                    did: publisherDid ?? m['clrRenderer.issuerUnknown'](),
                                })}
                            </p>
                            <RegistryLabel did={publisherDid} attempt={registryAttempt} />
                            <RegistryLabel did={publisherDid} attempt={registryAttempt} details />
                            {snapshot.outer.verificationMethods.map(method => (
                                <p key={method} className="break-all">
                                    {m['clrRenderer.verificationMethod']({ method })}
                                </p>
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
                        const groupStatus = records.every(entry => isClrRecordConfirmed(entry.node))
                            ? m['clrRenderer.verifiedLabel']()
                            : !snapshot.complete
                              ? m['clrRenderer.checkingVerification']()
                              : m['clrRenderer.recordsNeedAttention']({
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
                                className="rounded-xl border border-grayscale-200 p-3 text-xs"
                            >
                                <summary
                                    aria-label={m['clrRenderer.verificationDetailsFor']({
                                        issuer: name,
                                    })}
                                    className="flex cursor-pointer items-start gap-2"
                                >
                                    {typeof image === 'string' ? (
                                        <img
                                            src={image}
                                            alt=""
                                            width={24}
                                            height={24}
                                            className="h-6 w-6 shrink-0 rounded-full object-contain"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-grayscale-100"
                                        >
                                            {name.slice(0, 1)}
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium">{name}</span>
                                        <span className="block h-10 overflow-auto leading-5">
                                            {m['clrRenderer.verificationRecordsCount']({
                                                count: records.length,
                                            })}{' '}
                                            · {groupStatus}
                                        </span>
                                        <RegistryLabel
                                            did={did || undefined}
                                            attempt={registryAttempt}
                                        />
                                    </span>
                                </summary>
                                <div className="mt-3 space-y-2">
                                    <p className="break-all">
                                        {m['clrRenderer.issuerDid']({
                                            did: did || m['clrRenderer.issuerUnknown'](),
                                        })}
                                    </p>
                                    <RegistryLabel
                                        did={did || undefined}
                                        attempt={registryAttempt}
                                        details
                                    />
                                    {[
                                        ...new Set(
                                            records.flatMap(entry => entry.node.verificationMethods)
                                        ),
                                    ].map(method => (
                                        <p key={method} className="break-all">
                                            {m['clrRenderer.verificationMethod']({ method })}
                                        </p>
                                    ))}
                                    <ul className="max-h-80 overflow-y-auto space-y-2">
                                        {records.map(entry => (
                                            <li key={entry.id}>
                                                {onSelectRecord && entry.hasCanonicalOwner ? (
                                                    <button
                                                        type="button"
                                                        className="text-start underline"
                                                        onClick={() =>
                                                            onSelectRecord(entry.ownerId)
                                                        }
                                                    >
                                                        {entry.name}
                                                    </button>
                                                ) : (
                                                    <span>{entry.name}</span>
                                                )}
                                                <p className="h-20 overflow-auto">
                                                    {statusText(entry.node)}
                                                    {entry.node.proof === 'invalid' && (
                                                        <span className="block">
                                                            {m[
                                                                'clrRenderer.signatureCheckFailedExplanation'
                                                            ]()}
                                                        </span>
                                                    )}
                                                    {(entry.node.proof === 'unavailable' ||
                                                        entry.node.lifecycle === 'unavailable') && (
                                                        <span className="block">
                                                            {m[
                                                                'clrRenderer.verificationIncompleteExplanation'
                                                            ]()}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="h-10 overflow-auto">
                                                    {entry.node.checks.length > 0
                                                        ? m['clrRenderer.checksRun']({
                                                              checks: entry.node.checks.join(', '),
                                                          })
                                                        : ''}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                    {retry && retryControl}
                                </div>
                            </details>
                        );
                    })}
                </div>
            )}
            {retry && (
                <div className="h-10">{(retryable || registryAttempt > 0) && retryControl}</div>
            )}
        </section>
    );
};
