import { AggregationTemporality } from '../export/AggregationTemporality';
import { ResourceMetrics } from '../export/MetricData';
import { MetricProducer } from '../export/MetricProducer';
import { MetricReader } from '../export/MetricReader';
import { ForceFlushOptions, ShutdownOptions } from '../types';
import { MeterProviderSharedState } from './MeterProviderSharedState';
/**
 * An internal opaque interface that the MetricReader receives as
 * MetricProducer. It acts as the storage key to the internal metric stream
 * state for each MetricReader.
 */
export declare class MetricCollector implements MetricProducer {
    private _sharedState;
    private _metricReader;
    readonly aggregatorTemporality: AggregationTemporality;
    constructor(_sharedState: MeterProviderSharedState, _metricReader: MetricReader);
    collect(): Promise<ResourceMetrics>;
    /**
     * Delegates for MetricReader.forceFlush.
     */
    forceFlush(options?: ForceFlushOptions): Promise<void>;
    /**
     * Delegates for MetricReader.shutdown.
     */
    shutdown(options?: ShutdownOptions): Promise<void>;
}
/**
 * An internal interface for MetricCollector. Exposes the necessary
 * information for metric collection.
 */
export interface MetricCollectorHandle {
    aggregatorTemporality: AggregationTemporality;
}
//# sourceMappingURL=MetricCollector.d.ts.map