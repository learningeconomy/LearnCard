/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createInstrumentDescriptorWithView } from '../InstrumentDescriptor';
import { Meter } from '../Meter';
import { isNotNullish } from '../utils';
import { AsyncMetricStorage } from './AsyncMetricStorage';
import { MetricStorageRegistry } from './MetricStorageRegistry';
import { MultiMetricStorage } from './MultiWritableMetricStorage';
import { SyncMetricStorage } from './SyncMetricStorage';
/**
 * An internal record for shared meter provider states.
 */
export class MeterSharedState {
    constructor(_meterProviderSharedState, _instrumentationLibrary) {
        this._meterProviderSharedState = _meterProviderSharedState;
        this._instrumentationLibrary = _instrumentationLibrary;
        this._metricStorageRegistry = new MetricStorageRegistry();
        this.meter = new Meter(this);
    }
    registerMetricStorage(descriptor) {
        const views = this._meterProviderSharedState.viewRegistry.findViews(descriptor, this._instrumentationLibrary);
        const storages = views
            .map(view => {
            const viewDescriptor = createInstrumentDescriptorWithView(view, descriptor);
            const aggregator = view.aggregation.createAggregator(viewDescriptor);
            const storage = new SyncMetricStorage(viewDescriptor, aggregator, view.attributesProcessor);
            return this._metricStorageRegistry.register(storage);
        })
            .filter(isNotNullish);
        if (storages.length === 1) {
            return storages[0];
        }
        return new MultiMetricStorage(storages);
    }
    registerAsyncMetricStorage(descriptor, callback) {
        const views = this._meterProviderSharedState.viewRegistry.findViews(descriptor, this._instrumentationLibrary);
        views.forEach(view => {
            const viewDescriptor = createInstrumentDescriptorWithView(view, descriptor);
            const aggregator = view.aggregation.createAggregator(viewDescriptor);
            const viewStorage = new AsyncMetricStorage(viewDescriptor, aggregator, view.attributesProcessor, callback);
            this._metricStorageRegistry.register(viewStorage);
        });
    }
    /**
     * @param collector opaque handle of {@link MetricCollector} which initiated the collection.
     * @param collectionTime the HrTime at which the collection was initiated.
     * @returns the list of {@link MetricData} collected.
     */
    async collect(collector, collectionTime) {
        /**
         * 1. Call all observable callbacks first.
         * 2. Collect metric result for the collector.
         */
        const metricDataList = await Promise.all(Array.from(this._metricStorageRegistry.getStorages())
            .map(metricStorage => {
            return metricStorage.collect(collector, this._meterProviderSharedState.metricCollectors, this._meterProviderSharedState.sdkStartTime, collectionTime);
        })
            .filter(isNotNullish));
        return {
            instrumentationLibrary: this._instrumentationLibrary,
            metrics: metricDataList.filter(isNotNullish),
        };
    }
}
//# sourceMappingURL=MeterSharedState.js.map