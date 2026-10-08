import React from 'react';
import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { formatClrDate, groupClrRecords } from 'learn-card-base/helpers/credentials/clr/renderer';
import type { ClrLayoutKind } from 'learn-card-base/helpers/credentials/clr/layout';
import ClrTranscriptTrustBadge from '../clr-transcript/ClrTranscriptTrustBadge';
import ClrIssuerAddress from '../clr-transcript/ClrIssuerAddress';
import { getClrLayoutLabel, getClrSectionLabel } from './labels';
import * as m from '../../paraglide/messages.js';

export const ClrCollectionHeader = ({
    model,
    layout,
    actions,
    compact = false,
}: {
    model: ClrTranscriptDisplayModel;
    layout: Exclude<ClrLayoutKind, 'academic'>;
    actions?: React.ReactNode;
    compact?: boolean;
}) => {
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
        <header className="space-y-4 rounded-[20px] border border-grayscale-200 bg-white p-6">
            {collection.partial && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {m['clrRenderer.partial']()}
                </p>
            )}
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-medium text-grayscale-600">
                        {getClrLayoutLabel(layout)}
                    </p>
                    <h2 className="break-words text-xl font-semibold text-grayscale-900">
                        {collection.name?.value || getClrLayoutLabel(layout)}
                    </h2>
                    {model.header.learnerName && (
                        <p className="break-words text-sm text-grayscale-700">
                            {model.header.learnerName.value}
                        </p>
                    )}
                </div>
                {actions && <div className="shrink-0 self-end sm:self-start">{actions}</div>}
            </div>
            {collection.description && (
                <p
                    className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-grayscale-600 ${compact ? 'line-clamp-3' : ''}`}
                >
                    {collection.description.value}
                </p>
            )}
            {publisherName && (
                <dl>
                    <dt className="text-xs font-medium text-grayscale-700">
                        {m['clrRenderer.publishedBy']()}
                    </dt>
                    <dd className="break-words text-sm text-grayscale-900 [overflow-wrap:anywhere]">
                        {publisherName}
                    </dd>
                </dl>
            )}
            {model.header.issuerAddress && (
                <ClrIssuerAddress address={model.header.issuerAddress} showSource={false} />
            )}
            <dl className="flex flex-wrap gap-4">
                {dates.map(
                    ([label, date]) =>
                        date && (
                            <div key={label}>
                                <dt className="text-xs text-grayscale-600">{label}</dt>
                                <dd className="text-sm text-grayscale-900">
                                    <time dateTime={date.value}>{formatClrDate(date.value)}</time>
                                </dd>
                            </div>
                        )
                )}
            </dl>
            <ul className="flex flex-wrap gap-2">
                {groupClrRecords(model.records, layout).map(section => (
                    <li
                        key={section.kind}
                        className="rounded-full bg-grayscale-100 px-3 py-1 text-xs text-grayscale-700"
                    >
                        {getClrSectionLabel(section.kind, layout)}: {section.records.length}
                    </li>
                ))}
            </ul>
            <ClrTranscriptTrustBadge
                verification={model.verification}
                evidenceCount={model.evidence.length}
            />
        </header>
    );
};
