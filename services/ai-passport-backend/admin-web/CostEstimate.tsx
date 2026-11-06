import type { estimateCosts, CostPricing } from '../src/admin/cost-model';
import type { ReactNode } from 'react';
import ObservedUsage, { type ObservedCosts } from './ObservedUsage';

export type EstimatedCosts = ReturnType<typeof estimateCosts>;

// Old API responses must remain usable without implying that missing rates are free.
export const unavailablePricing: CostPricing = {
    embeddingModel: 'Unavailable',
    generationModel: null,
    region: 'Unavailable',
    checkedAt: '',
    embeddingRateSource: null,
    generationRateSource: null,
    privacyRateSource: null,
    embeddingUsdPerMillionTokens: null,
    generationInputUsdPerMillionTokens: null,
    generationOutputUsdPerMillionTokens: null,
    privacyUsdPerThousandTextUnits: null,
};

const dollars = (value: number) =>
    value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    });
const count = (value: number) => value.toLocaleString('en-US');

type Props = {
    title: string;
    estimate: EstimatedCosts | null;
    pricing?: CostPricing;
    children?: ReactNode;
    observedUsage?: ObservedCosts | null;
    recordLimit?: number;
};

export default function CostEstimate({
    title,
    estimate,
    pricing,
    children,
    observedUsage,
    recordLimit,
}: Props) {
    const lines = [
        { label: 'Embedding', value: estimate?.embeddingUsd ?? null },
        {
            label: 'Representation generation',
            value: estimate?.generationUsd ?? null,
        },
        { label: 'Privacy inspection', value: estimate?.privacyUsd ?? null },
    ];
    const missing = lines.filter(line => line.value === null);
    const sources = [
        { label: 'AWS embedding pricing', url: pricing?.embeddingRateSource },
        { label: 'AWS generation pricing', url: pricing?.generationRateSource },
        { label: 'AWS Guardrails pricing', url: pricing?.privacyRateSource },
    ];
    return (
        <section
            aria-label={title}
            className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm"
        >
            <h3 className="font-semibold text-slate-950">{title}</h3>
            <ObservedUsage usage={observedUsage} recordLimit={recordLimit} />
            {pricing ? (
                <>
                    <p className="mt-2">
                        Public AWS on-demand rates · {pricing.region} · checked {pricing.checkedAt}.
                    </p>
                    <p className="mt-1 break-words">
                        Embedding model: {pricing.embeddingModel}. Generation model:{' '}
                        {pricing.generationModel ?? 'Unknown or unsupported'}.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>
                            Embedding:{' '}
                            {pricing.embeddingUsdPerMillionTokens === null
                                ? 'unknown rate'
                                : `${dollars(pricing.embeddingUsdPerMillionTokens)} per million tokens`}
                            .
                        </li>
                        <li>
                            Generation input:{' '}
                            {pricing.generationInputUsdPerMillionTokens === null
                                ? 'unknown rate'
                                : `${dollars(pricing.generationInputUsdPerMillionTokens)} per million tokens`}
                            ; output:{' '}
                            {pricing.generationOutputUsdPerMillionTokens === null
                                ? 'unknown rate'
                                : `${dollars(pricing.generationOutputUsdPerMillionTokens)} per million tokens`}
                            .
                        </li>
                        <li>
                            Privacy inspection:{' '}
                            {pricing.privacyUsdPerThousandTextUnits === null
                                ? 'unknown rate'
                                : `${dollars(pricing.privacyUsdPerThousandTextUnits)} per thousand text units`}
                            .
                        </li>
                    </ul>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {sources.map(
                            source =>
                                source.url && (
                                    <li key={source.label}>
                                        <a
                                            className="text-indigo-700 underline underline-offset-2"
                                            href={source.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {source.label}
                                        </a>
                                    </li>
                                )
                        )}
                    </ul>
                </>
            ) : (
                <p className="mt-2">Pricing metadata is unavailable for this response.</p>
            )}
            <details className="mt-3 text-slate-700">
                <summary className="cursor-pointer font-medium">
                    Conservative stress scenario (not a forecast or spending cap)
                </summary>
                <p className="mt-2">
                    These deliberately high usage allowances do not represent typical usage or
                    expected spending.
                </p>
                {children}
                {estimate && (
                    <>
                        <dl className="mt-3 space-y-2">
                            {lines.map(line => (
                                <div
                                    key={line.label}
                                    className="flex flex-wrap justify-between gap-x-4 gap-y-1"
                                >
                                    <dt>{line.label}</dt>
                                    <dd className="font-medium tabular-nums">
                                        {line.value === null ? 'Unknown' : dollars(line.value)}
                                    </dd>
                                </div>
                            ))}
                            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-indigo-100 pt-2 font-semibold">
                                <dt>
                                    {estimate.totalUsd === null
                                        ? 'Known subtotal (incomplete)'
                                        : 'Scenario total (USD)'}
                                </dt>
                                <dd className="tabular-nums">
                                    {dollars(estimate.totalUsd ?? estimate.knownSubtotalUsd)}
                                </dd>
                            </div>
                        </dl>
                        {estimate.totalUsd === null && (
                            <p className="mt-2 text-amber-900">
                                {missing.map(line => line.label).join(', ')} unknown. The known
                                subtotal excludes unknown charges; a full total is unavailable.
                            </p>
                        )}
                        <p className="mt-3 text-slate-700">
                            Stress scenario only, not a measured bill or a hard dollar cap. Skipped
                            or already-complete records and cache hits may reduce actual cost;
                            retries can incur charges again.
                        </p>
                        <h4 className="mt-3 font-medium">Scenario assumptions</h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            <li>
                                {count(estimate.embeddingRequests)} embedding requests ×{' '}
                                {count(estimate.embeddingTokensPerRequest)} tokens/request
                                allowance.
                            </li>
                            <li>
                                {count(estimate.representationCalls)} representation calls ×{' '}
                                {count(estimate.generationInputTokensPerCall)} input tokens/call
                                planning allowance, plus the enforced{' '}
                                {count(estimate.generationOutputTokensPerCall)} output-token
                                cap/call.
                            </li>
                            <li>
                                {count(estimate.privacyRequests)} privacy requests ×{' '}
                                {count(estimate.privacyTextUnitsPerRequest)} text units/request,
                                using the accepted 100,000-character maximum-length allowance. A
                                credential case uses three privacy requests.
                            </li>
                        </ul>
                    </>
                )}
            </details>
        </section>
    );
}
