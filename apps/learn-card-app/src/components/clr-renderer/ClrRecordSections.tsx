import React, { useId } from 'react';
import {
    findClrRecordByCanonicalId,
    formatClrDate,
    groupClrRecords,
    type ClrTranscriptDisplayModel,
    type ClrLayoutKind,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { formatAchievementType } from 'learn-card-base/helpers/credentials/clr/presentation';
import ClrResultWithScaleList from '../clr-transcript/ClrResultWithScaleList';
import { getClrSectionLabel } from './labels';
import * as m from '../../paraglide/messages.js';

/** Shared source-backed sections; only the section labels differ by collection layout. */
export const ClrRecordSections = ({
    model,
    layout,
    onSelectRecord,
}: {
    model: ClrTranscriptDisplayModel;
    layout: ClrLayoutKind;
    onSelectRecord: (id: string) => void;
}) => {
    const id = useId();
    const sections = groupClrRecords(model.records, layout);
    const military = layout === 'military';
    if (!sections.length)
        return <p className="p-6 text-sm text-grayscale-600">{m['clrRenderer.empty']()}</p>;
    return (
        <>
            {sections.map((section, sectionIndex) => (
                <section
                    key={section.kind}
                    aria-labelledby={`${id}-${section.kind}`}
                    className={
                        military
                            ? 'overflow-hidden rounded-[20px] border border-grayscale-300 bg-white shadow-sm'
                            : 'space-y-3'
                    }
                >
                    <h3
                        id={`${id}-${section.kind}`}
                        className={
                            military
                                ? 'flex items-center gap-3 border-b border-grayscale-200 bg-grayscale-100 px-5 py-4 text-base font-semibold text-grayscale-900'
                                : 'text-lg font-semibold text-grayscale-900'
                        }
                    >
                        {military && (
                            <span
                                aria-hidden="true"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grayscale-900 text-xs text-white"
                            >
                                {String(sectionIndex + 1).padStart(2, '0')}
                            </span>
                        )}
                        <span className="min-w-0 flex-1">
                            {getClrSectionLabel(section.kind, layout)}
                        </span>
                        {military && (
                            <span
                                aria-hidden="true"
                                className="text-xs font-medium text-grayscale-600"
                            >
                                {section.records.length}
                            </span>
                        )}
                    </h3>
                    <ul className={military ? 'divide-y divide-grayscale-200' : 'space-y-3'}>
                        {section.records.map(record => {
                            const display = findClrRecordByCanonicalId(model, record.id)?.record;
                            const issuer = record.provenance.issuer;
                            const issuerName =
                                issuer?.name?.value ?? issuer?.id?.value ?? issuer?.url?.value;
                            return (
                                <li
                                    key={record.id}
                                    className={
                                        military
                                            ? 'space-y-3 border-s-4 border-grayscale-900 p-5 sm:p-6'
                                            : 'space-y-3 rounded-[20px] border border-grayscale-200 bg-white p-5'
                                    }
                                    data-clr-record-id={record.id}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSelectRecord(record.id)}
                                        className="w-full rounded-[20px] text-start text-base font-semibold text-grayscale-900 hover:text-grayscale-700 focus-visible:outline-emerald-600 [overflow-wrap:anywhere]"
                                    >
                                        {record.name?.value ??
                                            record.credentialName?.value ??
                                            m['clrRenderer.recordDetails']()}
                                    </button>
                                    {record.achievementTypes.length > 0 && (
                                        <p className="text-xs text-grayscale-600">
                                            {record.achievementTypes
                                                .map(type => formatAchievementType(type.value))
                                                .join(' · ')}
                                        </p>
                                    )}
                                    <dl className="grid gap-3 sm:grid-cols-2">
                                        {issuerName && (
                                            <div>
                                                <dt className="text-xs text-grayscale-600">
                                                    {m['clrRenderer.issuedBy']()}
                                                </dt>
                                                <dd className="text-sm text-grayscale-900 [overflow-wrap:anywhere]">
                                                    {issuerName}
                                                </dd>
                                            </div>
                                        )}
                                        {record.role && (
                                            <div>
                                                <dt className="text-xs text-grayscale-600">
                                                    {m['clrRenderer.role']()}
                                                </dt>
                                                <dd className="text-sm text-grayscale-900">
                                                    {record.role.value}
                                                </dd>
                                            </div>
                                        )}
                                        {(
                                            [
                                                [
                                                    m['clrRenderer.activityStart'](),
                                                    record.dates.activityStart,
                                                ],
                                                [
                                                    m['clrRenderer.activityEnd'](),
                                                    record.dates.activityEnd,
                                                ],
                                            ] as const
                                        ).map(
                                            ([label, date]) =>
                                                date && (
                                                    <div key={label}>
                                                        <dt className="text-xs text-grayscale-600">
                                                            {label}
                                                        </dt>
                                                        <dd className="text-sm text-grayscale-900">
                                                            <time dateTime={date.value}>
                                                                {formatClrDate(date.value)}
                                                            </time>
                                                        </dd>
                                                    </div>
                                                )
                                        )}
                                    </dl>
                                    {display && (
                                        <ClrResultWithScaleList results={display.results} compact />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </>
    );
};
