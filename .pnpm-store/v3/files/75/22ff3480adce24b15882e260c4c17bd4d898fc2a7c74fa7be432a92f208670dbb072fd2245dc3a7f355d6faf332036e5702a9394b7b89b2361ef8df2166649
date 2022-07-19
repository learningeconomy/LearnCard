import { Context } from '@opentelemetry/api';
import { MetricAttributes } from '@opentelemetry/api-metrics';
import { Maybe } from '../utils';
import { Accumulation, Aggregator } from '../aggregator/types';
import { AttributeHashMap } from './HashMap';
/**
 * Internal interface.
 *
 * Allows synchronous collection of metrics. This processor should allow
 * allocation of new aggregation cells for metrics and convert cumulative
 * recording to delta data points.
 */
export declare class DeltaMetricProcessor<T extends Maybe<Accumulation>> {
    private _aggregator;
    private _activeCollectionStorage;
    private _cumulativeMemoStorage;
    constructor(_aggregator: Aggregator<T>);
    /** Bind an efficient storage handle for a set of attributes. */
    private bind;
    record(value: number, attributes: MetricAttributes, _context: Context): void;
    batchCumulate(measurements: AttributeHashMap<number>): void;
    collect(): AttributeHashMap<T>;
}
//# sourceMappingURL=DeltaMetricProcessor.d.ts.map