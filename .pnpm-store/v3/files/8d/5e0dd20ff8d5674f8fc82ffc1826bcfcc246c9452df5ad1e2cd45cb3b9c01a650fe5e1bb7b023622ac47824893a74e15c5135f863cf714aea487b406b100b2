import { LastValue, AggregatorKind, Aggregator, Accumulation, AccumulationRecord } from './types';
import { HrTime } from '@opentelemetry/api';
import { SingularMetricData } from '../export/MetricData';
import { InstrumentDescriptor } from '../InstrumentDescriptor';
import { Maybe } from '../utils';
export declare class LastValueAccumulation implements Accumulation {
    private _current;
    sampleTime: HrTime;
    constructor(_current?: number, sampleTime?: HrTime);
    record(value: number): void;
    toPointValue(): LastValue;
}
/** Basic aggregator which calculates a LastValue from individual measurements. */
export declare class LastValueAggregator implements Aggregator<LastValueAccumulation> {
    kind: AggregatorKind.LAST_VALUE;
    createAccumulation(): LastValueAccumulation;
    /**
     * Returns the result of the merge of the given accumulations.
     *
     * Return the newly captured (delta) accumulation for LastValueAggregator.
     */
    merge(previous: LastValueAccumulation, delta: LastValueAccumulation): LastValueAccumulation;
    /**
     * Returns a new DELTA aggregation by comparing two cumulative measurements.
     *
     * A delta aggregation is not meaningful to LastValueAggregator, just return
     * the newly captured (delta) accumulation for LastValueAggregator.
     */
    diff(previous: LastValueAccumulation, current: LastValueAccumulation): LastValueAccumulation;
    toMetricData(descriptor: InstrumentDescriptor, accumulationByAttributes: AccumulationRecord<LastValueAccumulation>[], startTime: HrTime, endTime: HrTime): Maybe<SingularMetricData>;
}
//# sourceMappingURL=LastValue.d.ts.map