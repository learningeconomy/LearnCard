import React from 'react';
import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import {
    formatClrDate,
    type ClrRecordSection,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import type { ClrLayoutKind } from 'learn-card-base/helpers/credentials/clr/layout';
import ClrTranscriptTrustBadge from '../clr-transcript/ClrTranscriptTrustBadge';
import ClrIssuerAddress from '../clr-transcript/ClrIssuerAddress';
import { getClrLayoutLabel, getClrSectionLabel } from './labels';
import * as m from '../../paraglide/messages.js';

export const ClrCollectionHeader = ({
    model,
    layout,
    sections,
    actions,
    compact = false,
}: {
    model: ClrTranscriptDisplayModel;
    layout: Exclude<ClrLayoutKind, 'academic'>;
    sections: ClrRecordSection[];
    actions?: React.ReactNode;
    compact?: boolean;
}) => {
    const military = layout === 'military';
    const collection = model.canonical.collection;
    const publisher = collection.publisher;
    const publisherName = publisher?.name?.value ?? publisher?.id?.value ?? publisher?.url?.value;
    const dates = [
        [m['clrRenderer.issued'](), collection.issued],
        [m['clrRenderer.awarded'](), collection.awarded],
        [m['clrRenderer.validFrom'](), collection.validFrom],
        [m['clrRenderer.validUntil'](), collection.validUntil],
    ] as const;

    return (
        <header
            data-clr-header={layout}
            className={
                military
                    ? 'overflow-hidden rounded-[20px] border border-grayscale-300 bg-white shadow-sm'
                    : 'space-y-4 rounded-[20px] border border-grayscale-200 bg-white p-6'
            }
        >
            <div className={military ? 'bg-grayscale-900 px-6 py-7 sm:px-8' : ''}>
                <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row">
                    <div className="min-w-0 flex-1 space-y-2">
                        <p
                            className={
                                military
                                    ? 'text-xs font-semibold uppercase tracking-[0.16em] text-grayscale-200'
                                    : 'text-xs font-medium text-grayscale-600'
                            }
                        >
                            {getClrLayoutLabel(layout)}
                        </p>
                        <h2
                            className={`break-words font-semibold ${
                                military
                                    ? 'text-2xl leading-tight text-white'
                                    : 'text-xl text-grayscale-900'
                            }`}
                        >
                            {collection.name?.value || getClrLayoutLabel(layout)}
                        </h2>
                        {model.header.learnerName && (
                            <p
                                className={`break-words text-sm ${
                                    military ? 'text-grayscale-200' : 'text-grayscale-700'
                                }`}
                            >
                                {model.header.learnerName.value}
                            </p>
                        )}
                    </div>
                    {actions && <div className="shrink-0 self-end sm:self-start">{actions}</div>}
                </div>
                {military && collection.description && (
                    <p
                        className={`mt-5 border-t border-white/20 pt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-grayscale-100 ${
                            compact ? 'line-clamp-3' : ''
                        }`}
                    >
                        {collection.description.value}
                    </p>
                )}
            </div>
            <div className={military ? 'space-y-5 p-6 sm:px-8' : 'space-y-4'}>
                {collection.partial && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        {m['clrRenderer.partial']()}
                    </p>
                )}
                {!military && collection.description && (
                    <p
                        className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-grayscale-600 ${
                            compact ? 'line-clamp-3' : ''
                        }`}
                    >
                        {collection.description.value}
                    </p>
                )}
                {(publisherName ||
                    model.header.issuerAddress ||
                    dates.some(([, date]) => date)) && (
                    <div
                        className={
                            military ? 'space-y-4 border-b border-grayscale-200 pb-5' : 'space-y-4'
                        }
                    >
                        {publisherName && (
                            <dl>
                                <dt className="text-xs font-medium text-grayscale-700">
                                    {m['clrRenderer.publishedBy']()}
                                </dt>
                                <dd className="break-words text-sm font-medium text-grayscale-900 [overflow-wrap:anywhere]">
                                    {publisherName}
                                </dd>
                            </dl>
                        )}
                        {model.header.issuerAddress && (
                            <ClrIssuerAddress
                                address={model.header.issuerAddress}
                                showSource={false}
                            />
                        )}
                        <dl className="flex flex-wrap gap-4">
                            {dates.map(
                                ([label, date]) =>
                                    date && (
                                        <div key={label}>
                                            <dt className="text-xs text-grayscale-600">{label}</dt>
                                            <dd className="text-sm text-grayscale-900">
                                                <time dateTime={date.value}>
                                                    {formatClrDate(date.value)}
                                                </time>
                                            </dd>
                                        </div>
                                    )
                            )}
                        </dl>
                    </div>
                )}
                <ul
                    className={
                        military ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'flex flex-wrap gap-2'
                    }
                >
                    {sections.map(section => (
                        <li
                            key={section.kind}
                            className={
                                military
                                    ? 'flex min-w-0 items-center justify-between gap-2 rounded-xl border border-grayscale-200 bg-grayscale-10 px-3 py-2 text-xs text-grayscale-700'
                                    : 'rounded-full bg-grayscale-100 px-3 py-1 text-xs text-grayscale-700'
                            }
                        >
                            <span className="min-w-0 break-words">
                                {getClrSectionLabel(section.kind, layout)}
                            </span>
                            <span className={military ? 'font-semibold text-grayscale-900' : ''}>
                                {military ? section.records.length : `: ${section.records.length}`}
                            </span>
                        </li>
                    ))}
                </ul>
                <ClrTranscriptTrustBadge
                    verification={model.verification}
                    evidenceCount={model.evidence.length}
                />
            </div>
        </header>
    );
};
