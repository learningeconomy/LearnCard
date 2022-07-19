import { HrTime } from '@opentelemetry/api';
import * as metrics from '@opentelemetry/api-metrics';
import { InstrumentationLibrary } from '@opentelemetry/core';
import { InstrumentationLibraryMetrics } from '../export/MetricData';
import { InstrumentDescriptor } from '../InstrumentDescriptor';
import { Meter } from '../Meter';
import { MeterProviderSharedState } from './MeterProviderSharedState';
import { MetricCollectorHandle } from './MetricCollector';
import { MultiMetricStorage } from './MultiWritableMetricStorage';
import { SyncMetricStorage } from './SyncMetricStorage';
/**
 * An internal record for shared meter provider states.
 */
export declare class MeterSharedState {
    private _meterProviderSharedState;
    private _instrumentationLibrary;
    private _metricStorageRegistry;
    meter: Meter;
    constructor(_meterProviderSharedState: MeterProviderSharedState, _instrumentationLibrary: InstrumentationLibrary);
    registerMetricStorage(descriptor: InstrumentDescriptor): MultiMetricStorage | SyncMetricStorage<import("../utils").Maybe<import("..").Accumulation>>;
    registerAsyncMetricStorage(descriptor: InstrumentDescriptor, callback: metrics.ObservableCallback): void;
    /**
     * @param collector opaque handle of {@link MetricCollector} which initiated the collection.
     * @param collectionTime the HrTime at which the collection was initiated.
     * @returns the list of {@link MetricData} collected.
     */
    collect(collector: MetricCollectorHandle, collectionTime: HrTime): Promise<InstrumentationLibraryMetrics>;
}
//# sourceMappingURL=MeterSharedState.d.ts.map