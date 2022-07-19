import { HrTime } from '@opentelemetry/api';
import { ObservableCallback } from '@opentelemetry/api-metrics';
import { Accumulation, Aggregator } from '../aggregator/types';
import { View } from '../view/View';
import { InstrumentDescriptor } from '../InstrumentDescriptor';
import { AttributesProcessor } from '../view/AttributesProcessor';
import { MetricStorage } from './MetricStorage';
import { MetricData } from '../export/MetricData';
import { Maybe } from '../utils';
import { MetricCollectorHandle } from './MetricCollector';
/**
 * Internal interface.
 *
 * Stores and aggregates {@link MetricData} for asynchronous instruments.
 */
export declare class AsyncMetricStorage<T extends Maybe<Accumulation>> extends MetricStorage {
    private _attributesProcessor;
    private _callback;
    private _deltaMetricStorage;
    private _temporalMetricStorage;
    constructor(_instrumentDescriptor: InstrumentDescriptor, aggregator: Aggregator<T>, _attributesProcessor: AttributesProcessor, _callback: ObservableCallback);
    private _record;
    /**
     * Collects the metrics from this storage. The ObservableCallback is invoked
     * during the collection.
     *
     * Note: This is a stateful operation and may reset any interval-related
     * state for the MetricCollector.
     */
    collect(collector: MetricCollectorHandle, collectors: MetricCollectorHandle[], sdkStartTime: HrTime, collectionTime: HrTime): Promise<Maybe<MetricData>>;
    static create(view: View, instrument: InstrumentDescriptor, callback: ObservableCallback): AsyncMetricStorage<Maybe<Accumulation>>;
}
//# sourceMappingURL=AsyncMetricStorage.d.ts.map