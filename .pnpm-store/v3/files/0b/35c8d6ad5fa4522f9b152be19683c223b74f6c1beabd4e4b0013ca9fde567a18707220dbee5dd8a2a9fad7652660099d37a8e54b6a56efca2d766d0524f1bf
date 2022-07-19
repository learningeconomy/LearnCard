import { HrTime } from '@opentelemetry/api';
import { Aggregator } from '../aggregator/types';
import { MetricData } from '../export/MetricData';
import { InstrumentDescriptor } from '../InstrumentDescriptor';
import { Maybe } from '../utils';
import { MetricCollectorHandle } from './MetricCollector';
import { AttributeHashMap } from './HashMap';
/**
 * Internal interface.
 *
 * Provides unique reporting for each collectors. Allows synchronous collection
 * of metrics and reports given temporality values.
 */
export declare class TemporalMetricProcessor<T> {
    private _aggregator;
    private _unreportedAccumulations;
    private _reportHistory;
    constructor(_aggregator: Aggregator<T>);
    /**
     * Builds the {@link MetricData} streams to report against a specific MetricCollector.
     * @param collector The information of the MetricCollector.
     * @param collectors The registered collectors.
     * @param resource The resource to attach these metrics against.
     * @param instrumentationLibrary The instrumentation library that generated these metrics.
     * @param instrumentDescriptor The instrumentation descriptor that these metrics generated with.
     * @param currentAccumulations The current accumulation of metric data from instruments.
     * @param sdkStartTime The sdk start timestamp.
     * @param collectionTime The current collection timestamp.
     * @returns The {@link MetricData} points or `null`.
     */
    buildMetrics(collector: MetricCollectorHandle, collectors: MetricCollectorHandle[], instrumentDescriptor: InstrumentDescriptor, currentAccumulations: AttributeHashMap<T>, sdkStartTime: HrTime, collectionTime: HrTime): Maybe<MetricData>;
    private _stashAccumulations;
    private _getMergedUnreportedAccumulations;
    static merge<T>(last: AttributeHashMap<T>, current: AttributeHashMap<T>, aggregator: Aggregator<T>): AttributeHashMap<T>;
}
//# sourceMappingURL=TemporalMetricProcessor.d.ts.map