import React from 'react';
import * as m from '../../paraglide/messages.js';

import { formatClrDate } from 'learn-card-base/helpers/credentials/clr/renderer';
import type {
    ClrIdentifierModel,
    ClrNormalizedRecord,
} from 'learn-card-base/helpers/credentials/clr/types';
import { ClrRecordDrawerSection } from './ClrRecordDrawerSection';
import { ClrDrawerIdentifier } from './ClrDrawerIdentifier';

const safeWebUrl = (value?: string): string | undefined => {
    if (!value) return undefined;
    try {
        const url = new URL(value);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
    } catch {
        return undefined;
    }
};

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="min-w-0 space-y-v3-1">
        <dt className="text-xs font-medium text-grayscale-700">{label}</dt>
        <dd className="m-0 whitespace-pre-wrap wrap-break-word text-sm text-grayscale-900 wrap-anywhere">
            {children}
        </dd>
    </div>
);

const IdentifierRows = ({ identifiers }: { identifiers: ClrIdentifierModel[] }) => (
    <dl className="space-y-v3-3">
        {identifiers.map(identifier => {
            const value = identifier.identifier?.value ?? identifier.identityHash?.value;
            if (!value) return null;
            const label = identifier.identifierType?.value ?? identifier.identityType?.value;
            const hashed = identifier.hashed?.value === true;
            return (
                <DetailRow
                    key={identifier.sourcePath}
                    label={
                        hashed
                            ? m['clrTranscript.details.hashedIdentifier']({
                                  label: label || m['clrTranscript.details.identifier'](),
                              })
                            : label || m['clrTranscript.details.identifier']()
                    }
                >
                    {value}
                </DetailRow>
            );
        })}
    </dl>
);

const IdentifierGroup = ({
    title,
    identifiers,
}: {
    title: string;
    identifiers: ClrIdentifierModel[];
}) =>
    identifiers.length > 0 && (
        <section className="space-y-2">
            <h4 className="text-sm font-semibold text-grayscale-900">{title}</h4>
            <IdentifierRows identifiers={identifiers} />
        </section>
    );

/** Displays supplied child-record facts without borrowing claims from its transcript publisher. */
export const ClrRecordDetails = ({
    record,
    prominentFields = false,
    drawer = false,
    verification,
}: {
    record?: ClrNormalizedRecord;
    prominentFields?: boolean;
    drawer?: boolean;
    verification?: React.ReactNode;
}) => {
    if (!record) return verification ?? null;

    const profiles = [
        { label: m['clrTranscript.details.issuedBy'](), profile: record.provenance.issuer },
        { label: m['clrTranscript.details.assessedBy'](), profile: record.provenance.assessor },
        { label: m['clrTranscript.details.createdBy'](), profile: record.provenance.creator },
    ].filter(({ profile }) => profile?.name?.value || profile?.id?.value || profile?.url?.value);
    const dates = [
        { label: m['clrTranscript.details.activityStarted'](), date: record.dates.activityStart },
        { label: m['clrTranscript.details.activityEnded'](), date: record.dates.activityEnd },
        { label: m['clrTranscript.details.awarded'](), date: record.dates.awarded },
        { label: m['clrTranscript.details.validFrom'](), date: record.dates.validFrom },
        { label: m['clrTranscript.details.validUntil'](), date: record.dates.validUntil },
    ].filter(({ date }) => date?.value);
    const primaryFields = [
        { label: m['clrTranscript.details.role'](), field: record.role },
        { label: m['clrTranscript.details.narrative'](), field: record.narrative },
        { label: m['clrTranscript.details.licenseNumber'](), field: record.licenseNumber },
    ].filter(({ field }) => field?.value);
    const metadata = [
        { label: m['clrTranscript.details.fieldOfStudy'](), field: record.fieldOfStudy },
        { label: m['clrTranscript.details.specialization'](), field: record.specialization },
        { label: m['clrTranscript.details.language'](), field: record.language },
        { label: m['clrTranscript.details.version'](), field: record.version },
        ...(!prominentFields ? primaryFields : []),
    ].filter(({ field }) => field?.value);
    const achievementIdentifiers = record.achievementIdentifiers.filter(
        identifier => identifier.identifier?.value || identifier.identityHash?.value
    );
    const subjectIdentifiers = record.subjectIdentifiers.filter(
        identifier => identifier.identifier?.value || identifier.identityHash?.value
    );
    const ids = [
        { label: m['clrTranscript.details.achievementId'](), value: record.achievementId?.value },
        { label: m['clrTranscript.details.learnerId'](), value: record.subjectId?.value },
    ];
    const hasIds = ids.some(({ value }) => Boolean(value));
    const hasIdentifiers =
        hasIds || achievementIdentifiers.length > 0 || subjectIdentifiers.length > 0;
    const hasAdditional =
        metadata.length > 0 ||
        record.tags.length > 0 ||
        (!drawer &&
            (hasIds ||
                subjectIdentifiers.length > 0 ||
                (!prominentFields && achievementIdentifiers.length > 0)));
    const criteria = record.criteria;
    const criteriaUrl = safeWebUrl(criteria?.id?.value);
    const hasCriteria = Boolean(criteria?.narrative?.value || criteria?.id?.value);

    if (
        !profiles.length &&
        !dates.length &&
        !hasCriteria &&
        !verification &&
        !hasAdditional &&
        !primaryFields.length &&
        !hasIdentifiers
    )
        return null;

    return (
        <div
            className={
                drawer
                    ? 'flex min-w-0 flex-col gap-5 empty:hidden'
                    : 'space-y-v3-5 rounded-2xl border border-grayscale-200 bg-white p-4 font-poppins'
            }
        >
            {prominentFields && primaryFields.length > 0 && (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {primaryFields.map(({ label, field }) => (
                        <DetailRow key={label} label={label}>
                            {field?.value}
                        </DetailRow>
                    ))}
                </dl>
            )}
            {prominentFields && !drawer && (
                <IdentifierGroup
                    title={m['clrTranscript.details.achievementIdentifiers']()}
                    identifiers={achievementIdentifiers}
                />
            )}
            {profiles.length > 0 && (
                <dl className={drawer ? 'grid gap-3' : 'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
                    {profiles.map(({ label, profile }) => {
                        const name =
                            profile?.name?.value ?? profile?.id?.value ?? profile?.url?.value;
                        const url =
                            safeWebUrl(profile?.url?.value) ?? safeWebUrl(profile?.id?.value);
                        return (
                            <DetailRow key={label} label={label}>
                                {url ? (
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline underline-offset-2 hover:text-grayscale-700 focus-visible:outline-emerald-600"
                                    >
                                        {name}
                                    </a>
                                ) : (
                                    name
                                )}
                            </DetailRow>
                        );
                    })}
                </dl>
            )}
            {dates.length > 0 && (
                <dl className={drawer ? 'grid gap-3' : 'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
                    {dates.map(({ label, date }) => (
                        <DetailRow key={label} label={label}>
                            {date && <time dateTime={date.value}>{formatClrDate(date.value)}</time>}
                        </DetailRow>
                    ))}
                </dl>
            )}
            {verification}
            {drawer && hasIdentifiers && (
                <ClrRecordDrawerSection title={m['clrTranscript.details.credentialIdentifiers']()}>
                    <div className="space-y-4">
                        {hasIds && (
                            <dl className="grid gap-3">
                                {ids.map(({ label, value }) =>
                                    value ? (
                                        <DetailRow key={label} label={label}>
                                            <ClrDrawerIdentifier
                                                key={value}
                                                label={label}
                                                value={value}
                                            />
                                        </DetailRow>
                                    ) : null
                                )}
                            </dl>
                        )}
                        <IdentifierGroup
                            title={m['clrTranscript.details.achievementIdentifiers']()}
                            identifiers={achievementIdentifiers}
                        />
                        <IdentifierGroup
                            title={m['clrTranscript.details.learnerIdentifiers']()}
                            identifiers={subjectIdentifiers}
                        />
                    </div>
                </ClrRecordDrawerSection>
            )}
            {hasCriteria && (
                <section className="space-y-v3-2">
                    <h3 className="text-base font-semibold text-grayscale-900">
                        {m['clrTranscript.details.criteria']()}
                    </h3>
                    {criteria?.narrative?.value && (
                        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-grayscale-600">
                            {criteria.narrative.value}
                        </p>
                    )}
                    {criteriaUrl ? (
                        <a
                            href={criteriaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-grayscale-700 underline underline-offset-2 focus-visible:outline-emerald-600"
                        >
                            {m['clrTranscript.details.viewCriteria']()}
                        </a>
                    ) : criteria?.id?.value ? (
                        <dl>
                            <DetailRow label={m['clrTranscript.details.criteriaReference']()}>
                                {criteria.id.value}
                            </DetailRow>
                        </dl>
                    ) : null}
                </section>
            )}
            {hasAdditional && (
                <details className="group">
                    <summary className="cursor-pointer rounded-[20px] text-sm font-semibold text-grayscale-900 focus-visible:outline-emerald-600">
                        {m['clrTranscript.details.additionalDetails']()}
                    </summary>
                    <div className="mt-4 space-y-v3-4">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {metadata.map(({ label, field }) => (
                                <DetailRow key={label} label={label}>
                                    {field?.value}
                                </DetailRow>
                            ))}
                            {record.tags.length > 0 && (
                                <DetailRow label={m['clrTranscript.details.tags']()}>
                                    <span className="flex flex-wrap gap-2">
                                        {record.tags.map(tag => (
                                            <span
                                                key={tag.sourcePath}
                                                className="rounded-full bg-grayscale-100 px-3 py-1 text-xs text-grayscale-700"
                                            >
                                                {tag.value}
                                            </span>
                                        ))}
                                    </span>
                                </DetailRow>
                            )}
                            {!drawer &&
                                ids.map(({ label, value }) =>
                                    value ? (
                                        <DetailRow key={label} label={label}>
                                            {value}
                                        </DetailRow>
                                    ) : null
                                )}
                        </dl>
                        {!drawer && !prominentFields && (
                            <IdentifierGroup
                                title={m['clrTranscript.details.achievementIdentifiers']()}
                                identifiers={achievementIdentifiers}
                            />
                        )}
                        {!drawer && (
                            <IdentifierGroup
                                title={m['clrTranscript.details.learnerIdentifiers']()}
                                identifiers={subjectIdentifiers}
                            />
                        )}
                    </div>
                </details>
            )}
        </div>
    );
};
