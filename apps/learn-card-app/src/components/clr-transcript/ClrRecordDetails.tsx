import React from 'react';

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
                    label={`${label || 'Identifier'}${hashed ? ' (hashed)' : ''}`}
                >
                    {value}
                </DetailRow>
            );
        })}
    </dl>
);

/** Displays supplied child-record facts without borrowing claims from its transcript publisher. */
export const ClrRecordDetails = ({ record }: { record?: ClrNormalizedRecord }) => {
    if (!record) return null;

    const profiles = [
        { label: 'Issued by', profile: record.provenance.issuer },
        { label: 'Assessed by', profile: record.provenance.assessor },
        { label: 'Achievement created by', profile: record.provenance.creator },
    ].filter(({ profile }) => profile?.name?.value || profile?.id?.value || profile?.url?.value);
    const dates = [
        { label: 'Activity started', date: record.dates.activityStart },
        { label: 'Activity ended', date: record.dates.activityEnd },
        { label: 'Awarded', date: record.dates.awarded },
        { label: 'Valid from', date: record.dates.validFrom },
        { label: 'Valid until', date: record.dates.validUntil },
    ].filter(({ date }) => date?.value);
    const metadata = [
        { label: 'Field of study', field: record.fieldOfStudy },
        { label: 'Specialization', field: record.specialization },
        { label: 'Language', field: record.language },
        { label: 'Version', field: record.version },
        { label: 'Role', field: record.role },
        { label: 'Learner narrative', field: record.narrative },
        { label: 'License number', field: record.licenseNumber },
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
        achievementIdentifiers.length ||
        subjectIdentifiers.length ||
        record.subjectId?.value ||
        record.achievementId?.value
    );
    const criteria = record.criteria;
    const criteriaUrl = safeWebUrl(criteria?.id?.value);
    const hasCriteria = Boolean(criteria?.narrative?.value || criteria?.id?.value);

    if (!profiles.length && !dates.length && !hasCriteria && !hasAdditional) return null;

    return (
        <div className="space-y-5 rounded-2xl border border-grayscale-200 bg-white p-4 font-poppins">
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
                    <h3 className="text-base font-semibold text-grayscale-900">Criteria</h3>
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
                            View criteria
                        </a>
                    ) : criteria?.id?.value ? (
                        <dl>
                            <DetailRow label="Criteria reference">{criteria.id.value}</DetailRow>
                        </dl>
                    ) : null}
                </section>
            )}
            {hasAdditional && (
                <details className="group">
                    <summary className="cursor-pointer rounded-[20px] text-sm font-semibold text-grayscale-900 focus-visible:outline-emerald-600">
                        Additional details
                    </summary>
                    <div className="mt-4 space-y-4">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {metadata.map(({ label, field }) => (
                                <DetailRow key={label} label={label}>
                                    {field?.value}
                                </DetailRow>
                            ))}
                            {record.tags.length > 0 && (
                                <DetailRow label="Tags">
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
                                <DetailRow label="Achievement ID">
                                    {record.achievementId.value}
                                </DetailRow>
                            )}
                            {record.subjectId?.value && (
                                <DetailRow label="Learner ID">{record.subjectId.value}</DetailRow>
                            )}
                        </dl>
                        {achievementIdentifiers.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-grayscale-900">
                                    Achievement identifiers
                                </h4>
                                <IdentifierRows identifiers={achievementIdentifiers} />
                            </section>
                        )}
                        {subjectIdentifiers.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-grayscale-900">
                                    Learner identifiers
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
