import { Sum, AggregatorKind, Aggregator, Accumulation, AccumulationRecord } from './types';
import { HrTime } from '@opentelemetry/api';
import { SingularMetricData } from '../export/MetricData';
import { InstrumentDescriptor } from '../InstrumentDescriptor';
import { Maybe } from '../utils';
export declare class SumAccumulation implements Accumulation {
    private _current;
    constructor(_current?: number);
    record(value: number): void;
    toPointValue(): Sum;
}
/** Basic aggregator which calculates a Sum from individual measurements. */
export declare class SumAggregator implements Aggregator<SumAccumulation> {
    kind: AggregatorKind.SUM;
    createAccumulation(): SumAccumulation;
    /**
     * Returns the result of the merge of the given accumulations.
     */
    merge(previous: SumAccumulation, delta: SumAccumulation): SumAccumulation;
    /**
     * Returns a new DELTA aggregation by comparing two cumulative measurements.
     */
    diff(previous: SumAccumulation, current: SumAccumulation): SumAccumulation;
    toMetricData(descriptor: InstrumentDescriptor, accumulationByAttributes: AccumulationRecord<SumAccumulation>[], startTime: HrTime, endTime: HrTime): Maybe<SingularMetricData>;
}
//# sourceMappingURL=Sum.d.ts.map