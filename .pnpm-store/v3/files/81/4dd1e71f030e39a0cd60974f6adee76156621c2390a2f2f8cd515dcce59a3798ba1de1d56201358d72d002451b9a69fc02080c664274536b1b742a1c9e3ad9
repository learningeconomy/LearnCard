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
import { MetricStorage } from './MetricStorage';
import { DeltaMetricProcessor } from './DeltaMetricProcessor';
import { TemporalMetricProcessor } from './TemporalMetricProcessor';
import { ObservableResult } from '../ObservableResult';
import { AttributeHashMap } from './HashMap';
/**
 * Internal interface.
 *
 * Stores and aggregates {@link MetricData} for asynchronous instruments.
 */
export class AsyncMetricStorage extends MetricStorage {
    constructor(_instrumentDescriptor, aggregator, _attributesProcessor, _callback) {
        super(_instrumentDescriptor);
        this._attributesProcessor = _attributesProcessor;
        this._callback = _callback;
        this._deltaMetricStorage = new DeltaMetricProcessor(aggregator);
        this._temporalMetricStorage = new TemporalMetricProcessor(aggregator);
    }
    _record(measurements) {
        const processed = new AttributeHashMap();
        Array.from(measurements.entries()).forEach(([attributes, value]) => {
            processed.set(this._attributesProcessor.process(attributes), value);
        });
        this._deltaMetricStorage.batchCumulate(processed);
    }
    /**
     * Collects the metrics from this storage. The ObservableCallback is invoked
     * during the collection.
     *
     * Note: This is a stateful operation and may reset any interval-related
     * state for the MetricCollector.
     */
    async collect(collector, collectors, sdkStartTime, collectionTime) {
        const observableResult = new ObservableResult();
        // TODO: timeout with callback
        await this._callback(observableResult);
        this._record(observableResult.buffer);
        const accumulations = this._deltaMetricStorage.collect();
        return this._temporalMetricStorage.buildMetrics(collector, collectors, this._instrumentDescriptor, accumulations, sdkStartTime, collectionTime);
    }
    static create(view, instrument, callback) {
        instrument = createInstrumentDescriptorWithView(view, instrument);
        const aggregator = view.aggregation.createAggregator(instrument);
        return new AsyncMetricStorage(instrument, aggregator, view.attributesProcessor, callback);
    }
}
//# sourceMappingURL=AsyncMetricStorage.js.map