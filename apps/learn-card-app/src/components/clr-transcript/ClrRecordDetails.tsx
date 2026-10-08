import React from 'react';
import * as m from '../../paraglide/messages.js';

import { formatClrDate } from 'learn-card-base/helpers/credentials/clr/renderer';
import type {
    ClrIdentifierModel,
    ClrNormalizedRecord,
} from 'learn-card-base/helpers/credentials/clr/types';

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
    <div className="min-w-0 space-y-1">
        <dt className="text-xs font-medium text-grayscale-700">{label}</dt>
        <dd className="m-0 whitespace-pre-wrap break-words text-sm text-grayscale-900 [overflow-wrap:anywhere]">
            {children}
        </dd>
    </div>
);

const IdentifierRows = ({ identifiers }: { identifiers: ClrIdentifierModel[] }) => (
    <dl className="space-y-3">
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
                            ? m['clrRenderer.hashedIdentifier']({
                                  label: label || m['clrRenderer.identifier'](),
                              })
                            : label || m['clrRenderer.identifier']()
                    }
                >
                    {value}
                </DetailRow>
            );
        })}
    </dl>
);

/** Displays supplied child-record facts without borrowing claims from its transcript publisher. */
export const ClrRecordDetails = ({
    record,
    prominentFields = false,
}: {
    record?: ClrNormalizedRecord;
    prominentFields?: boolean;
}) => {
    if (!record) return null;

    const profiles = [
        { label: m['clrRenderer.issuedBy'](), profile: record.provenance.issuer },
        { label: m['clrRenderer.assessedBy'](), profile: record.provenance.assessor },
        { label: m['clrRenderer.createdBy'](), profile: record.provenance.creator },
    ].filter(({ profile }) => profile?.name?.value || profile?.id?.value || profile?.url?.value);
    const dates = [
        { label: m['clrRenderer.activityStart'](), date: record.dates.activityStart },
        { label: m['clrRenderer.activityEnd'](), date: record.dates.activityEnd },
        { label: m['clrRenderer.awarded'](), date: record.dates.awarded },
        { label: m['clrRenderer.validFrom'](), date: record.dates.validFrom },
        { label: m['clrRenderer.validUntil'](), date: record.dates.validUntil },
    ].filter(({ date }) => date?.value);
    const primaryFields = [
        { label: m['clrRenderer.role'](), field: record.role },
        { label: m['clrRenderer.narrative'](), field: record.narrative },
        { label: m['clrRenderer.license'](), field: record.licenseNumber },
    ].filter(({ field }) => field?.value);
    const metadata = [
        { label: m['clrRenderer.field'](), field: record.fieldOfStudy },
        { label: m['clrRenderer.specialization'](), field: record.specialization },
        { label: m['clrRenderer.language'](), field: record.language },
        { label: m['clrRenderer.version'](), field: record.version },
        ...(!prominentFields ? primaryFields : []),
    ].filter(({ field }) => field?.value);
    const achievementIdentifiers = record.achievementIdentifiers.filter(
        identifier => identifier.identifier?.value || identifier.identityHash?.value
    );
    const subjectIdentifiers = record.subjectIdentifiers.filter(
        identifier => identifier.identifier?.value || identifier.identityHash?.value
    );
    const hasAdditional = Boolean(
        metadata.length ||
        record.tags.length ||
        (!prominentFields && achievementIdentifiers.length) ||
        subjectIdentifiers.length ||
        record.subjectId?.value ||
        record.achievementId?.value
    );
    const criteria = record.criteria;
    const criteriaUrl = safeWebUrl(criteria?.id?.value);
    const hasCriteria = Boolean(criteria?.narrative?.value || criteria?.id?.value);

    if (
        !profiles.length &&
        !dates.length &&
        !hasCriteria &&
        !hasAdditional &&
        !primaryFields.length &&
        !achievementIdentifiers.length
    )
        return null;

    return (
        <div className="space-y-5 rounded-2xl border border-grayscale-200 bg-white p-4 font-poppins">
            {prominentFields && primaryFields.length > 0 && (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {primaryFields.map(({ label, field }) => (
                        <DetailRow key={label} label={label}>
                            {field?.value}
                        </DetailRow>
                    ))}
                </dl>
            )}
            {prominentFields && achievementIdentifiers.length > 0 && (
                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-grayscale-900">
                        {m['clrRenderer.achievementIdentifiers']()}
                    </h4>
                    <IdentifierRows identifiers={achievementIdentifiers} />
                </section>
            )}
            {profiles.length > 0 && (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {dates.map(({ label, date }) => (
                        <DetailRow key={label} label={label}>
                            {date && <time dateTime={date.value}>{formatClrDate(date.value)}</time>}
                        </DetailRow>
                    ))}
                </dl>
            )}
            {hasCriteria && (
                <section className="space-y-2">
                    <h3 className="text-base font-semibold text-grayscale-900">
                        {m['clrRenderer.criteria']()}
                    </h3>
                    {criteria?.narrative?.value && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-grayscale-600">
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
                            {m['clrRenderer.viewCriteria']()}
                        </a>
                    ) : criteria?.id?.value ? (
                        <dl>
                            <DetailRow label={m['clrRenderer.criteriaReference']()}>
                                {criteria.id.value}
                            </DetailRow>
                        </dl>
                    ) : null}
                </section>
            )}
            {hasAdditional && (
                <details className="group">
                    <summary className="cursor-pointer rounded-[20px] text-sm font-semibold text-grayscale-900 focus-visible:outline-emerald-600">
                        {m['clrRenderer.additional']()}
                    </summary>
                    <div className="mt-4 space-y-4">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {metadata.map(({ label, field }) => (
                                <DetailRow key={label} label={label}>
                                    {field?.value}
                                </DetailRow>
                            ))}
                            {record.tags.length > 0 && (
                                <DetailRow label={m['clrRenderer.tags']()}>
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
                            {record.achievementId?.value && (
                                <DetailRow label={m['clrRenderer.achievementId']()}>
                                    {record.achievementId.value}
                                </DetailRow>
                            )}
                            {record.subjectId?.value && (
                                <DetailRow label={m['clrRenderer.learnerId']()}>
                                    {record.subjectId.value}
                                </DetailRow>
                            )}
                        </dl>
                        {!prominentFields && achievementIdentifiers.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-grayscale-900">
                                    {m['clrRenderer.achievementIdentifiers']()}
                                </h4>
                                <IdentifierRows identifiers={achievementIdentifiers} />
                            </section>
                        )}
                        {subjectIdentifiers.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-grayscale-900">
                                    {m['clrRenderer.learnerIdentifiers']()}
                                </h4>
                                <IdentifierRows identifiers={subjectIdentifiers} />
                            </section>
                        )}
                    </div>
                </details>
            )}
        </div>
    );
};
