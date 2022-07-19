import { Accumulation, AccumulationRecord, Aggregator, AggregatorKind, Histogram } from './types';
import { HistogramMetricData } from '../export/MetricData';
import { HrTime } from '@opentelemetry/api';
import { InstrumentDescriptor } from '../InstrumentDescriptor';
import { Maybe } from '../utils';
export declare class HistogramAccumulation implements Accumulation {
    private readonly _boundaries;
    private _current;
    constructor(_boundaries: number[], _current?: Histogram);
    record(value: number): void;
    toPointValue(): Histogram;
}
/**
 * Basic aggregator which observes events and counts them in pre-defined buckets
 * and provides the total sum and count of all observations.
 */
export declare class HistogramAggregator implements Aggregator<HistogramAccumulation> {
    private readonly _boundaries;
    kind: AggregatorKind.HISTOGRAM;
    /**
     * @param _boundaries upper bounds of recorded values.
     */
    constructor(_boundaries: number[]);
    createAccumulation(): HistogramAccumulation;
    /**
     * Return the result of the merge of two histogram accumulations. As long as one Aggregator
     * instance produces all Accumulations with constant boundaries we don't need to worry about
     * merging accumulations with different boundaries.
     */
    merge(previous: HistogramAccumulation, delta: HistogramAccumulation): HistogramAccumulation;
    /**
     * Returns a new DELTA aggregation by comparing two cumulative measurements.
     */
    diff(previous: HistogramAccumulation, current: HistogramAccumulation): HistogramAccumulation;
    toMetricData(descriptor: InstrumentDescriptor, accumulationByAttributes: AccumulationRecord<HistogramAccumulation>[], startTime: HrTime, endTime: HrTime): Maybe<HistogramMetricData>;
}
//# sourceMappingURL=Histogram.d.ts.map