"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncMetricStorage = void 0;
const InstrumentDescriptor_1 = require("../InstrumentDescriptor");
const MetricStorage_1 = require("./MetricStorage");
const DeltaMetricProcessor_1 = require("./DeltaMetricProcessor");
const TemporalMetricProcessor_1 = require("./TemporalMetricProcessor");
/**
 * Internal interface.
 *
 * Stores and aggregates {@link MetricData} for synchronous instruments.
 */
class SyncMetricStorage extends MetricStorage_1.MetricStorage {
    constructor(instrumentDescriptor, aggregator, _attributesProcessor) {
        super(instrumentDescriptor);
        this._attributesProcessor = _attributesProcessor;
        this._deltaMetricStorage = new DeltaMetricProcessor_1.DeltaMetricProcessor(aggregator);
        this._temporalMetricStorage = new TemporalMetricProcessor_1.TemporalMetricProcessor(aggregator);
    }
    record(value, attributes, context) {
        attributes = this._attributesProcessor.process(attributes, context);
        this._deltaMetricStorage.record(value, attributes, context);
    }
    /**
     * Collects the metrics from this storage.
     *
     * Note: This is a stateful operation and may reset any interval-related
     * state for the MetricCollector.
     */
    async collect(collector, collectors, sdkStartTime, collectionTime) {
        const accumulations = this._deltaMetricStorage.collect();
        return this._temporalMetricStorage.buildMetrics(collector, collectors, this._instrumentDescriptor, accumulations, sdkStartTime, collectionTime);
    }
    static create(view, instrument) {
        instrument = (0, InstrumentDescriptor_1.createInstrumentDescriptorWithView)(view, instrument);
        const aggregator = view.aggregation.createAggregator(instrument);
        return new SyncMetricStorage(instrument, aggregator, view.attributesProcessor);
    }
}
exports.SyncMetricStorage = SyncMetricStorage;
//# sourceMappingURL=SyncMetricStorage.js.map