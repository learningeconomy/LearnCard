import type { usageCostSummary } from '../src/admin/usage-cost';

export type ObservedCosts = NonNullable<ReturnType<typeof usageCostSummary>>;
const dollars = (value: number) =>
    value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    });
const count = (value: number) => value.toLocaleString('en-US');

type Props = {
    usage?: ObservedCosts | null;
    recordLimit?: number;
};

export default function ObservedUsage({ usage, recordLimit }: Props) {
    if (!usage)
        return (
            <p className="mt-2 font-semibold text-slate-950">
                Expected cost unknown. Measured token/text usage is not available.
            </p>
        );
    const sample = usage.pricesMatch && !usage.unpricedComponents?.length ? usage.sample : null;
    const projectionLimit =
        typeof recordLimit === 'number' && Number.isInteger(recordLimit) && recordLimit > 0
            ? recordLimit
            : undefined;
    return (
        <section
            aria-label="Recorded provider usage"
            className="mt-3 rounded-xl border border-slate-200 bg-white p-3"
        >
            <h4 className="font-semibold">Recorded provider usage for this job</h4>
            <p className="mt-1 font-medium">
                Measured-usage subtotal at list prices: {dollars(usage.knownListPriceUsd)}
            </p>
            <p className="mt-1 text-slate-700">
                This is a partial priced subtotal, not a bill. Unmeasured requests and charges with
                unavailable rates are excluded, not free.
            </p>
            {Boolean(usage.unpricedComponents?.length) && (
                <p className="mt-2 text-amber-900">
                    Unpriced measured components: {usage.unpricedComponents.join(', ')}. Their rates
                    and charges are unknown; they are excluded from the subtotal.
                </p>
            )}
            <ul className="mt-2 space-y-1 text-slate-700">
                <li>
                    Generation: {count(usage.totals.generation.measuredRequests)}/
                    {count(usage.totals.generation.requests)} requests measured;{' '}
                    {count(usage.totals.generation.inputTokens)} input and{' '}
                    {count(usage.totals.generation.outputTokens)} output tokens.
                </li>
                <li>
                    Embedding: {count(usage.totals.embedding.measuredRequests)}/
                    {count(usage.totals.embedding.requests)} requests measured;{' '}
                    {count(usage.totals.embedding.inputTokens)} reported input tokens. Nova response
                    metadata does not report embedding token usage.
                </li>
                <li>
                    Privacy: {count(usage.totals.privacy.measuredRequests)}/
                    {count(usage.totals.privacy.requests)} requests measured;{' '}
                    {count(usage.totals.privacy.textUnits)} text units and{' '}
                    {count(usage.totals.privacy.freeTextUnits)} free text units reported.
                </li>
                <li>
                    Unmeasured requests: {count(usage.unmeasuredRequests.generation)} generation,{' '}
                    {count(usage.unmeasuredRequests.embedding)} embedding,{' '}
                    {count(usage.unmeasuredRequests.privacy)} privacy. Their charges remain unknown.
                </li>
            </ul>
            <p className="mt-2 text-slate-700">
                {count(usage.attempts)} recorded attempts; {count(usage.failedAttempts)} failed.
                Failed or partial requests may still incur charges; retries can charge again.
            </p>
            {usage.historicalRequestsUnmeasured && (
                <p className="mt-2 text-amber-900">
                    Earlier job attempts have no measured usage. Their charges are unknown and are
                    not included in this subtotal.
                </p>
            )}
            {!usage.pricesMatch && (
                <p className="mt-2 text-amber-900">
                    Pricing configuration changed. The recorded subtotal uses prior attempt rates; a
                    sample-based projection is unavailable.
                </p>
            )}
            {sample ? (
                <div className="mt-3 border-t border-slate-200 pt-3">
                    <h4 className="font-semibold">
                        Measured generation/privacy + embedding allowance
                    </h4>
                    {projectionLimit && (
                        <p className="mt-1 font-semibold">
                            Sample-based planning range for {count(projectionLimit)} records:{' '}
                            {dollars(sample.meanKnownUsd * projectionLimit)}–
                            {dollars(sample.meanWithEmbeddingAllowanceUsd * projectionLimit)}
                        </p>
                    )}
                    <p className="mt-1">
                        Based on {count(sample.count)} successful credential attempts. Per-record
                        sample mean: {dollars(sample.meanKnownUsd)} measured subtotal;{' '}
                        {dollars(sample.meanWithEmbeddingAllowanceUsd)} including embedding
                        allowance.
                    </p>
                    <p className="mt-1">
                        Observed sample minimum subtotal: {dollars(sample.minKnownUsd)}. Sample
                        maximum including embedding allowance:{' '}
                        {dollars(sample.maxWithEmbeddingAllowanceUsd)}.
                    </p>
                    <p className="mt-2 text-slate-700">
                        The lower figure excludes unmeasured embedding charges; the upper figure
                        adds an 8,192-token allowance per unmeasured embedding request. These are
                        not fully measured totals or guaranteed spending bounds. Future records may
                        differ. Failed or incomplete attempts are excluded from the sample.
                    </p>
                </div>
            ) : (
                <p className="mt-3 font-semibold">
                    Expected cost unknown. No comparable completed credential sample with measured
                    generation/privacy usage is available.
                </p>
            )}
        </section>
    );
}
