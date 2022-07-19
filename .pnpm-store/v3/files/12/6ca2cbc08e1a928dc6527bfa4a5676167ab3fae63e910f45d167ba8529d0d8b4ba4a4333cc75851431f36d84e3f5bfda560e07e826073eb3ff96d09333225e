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
import * as api from '@opentelemetry/api';
import * as metrics from '@opentelemetry/api-metrics';
import { Resource } from '@opentelemetry/resources';
import { MeterProviderSharedState } from './state/MeterProviderSharedState';
import { InstrumentSelector } from './view/InstrumentSelector';
import { MeterSelector } from './view/MeterSelector';
import { View } from './view/View';
import { MetricCollector } from './state/MetricCollector';
import { FilteringAttributesProcessor } from './view/AttributesProcessor';
import { PatternPredicate } from './view/Predicate';
function isViewOptionsEmpty(options) {
    return (options.name == null &&
        options.aggregation == null &&
        options.attributeKeys == null &&
        options.description == null);
}
/**
 * This class implements the {@link metrics.MeterProvider} interface.
 */
export class MeterProvider {
    constructor(options) {
        var _a;
        this._shutdown = false;
        this._sharedState = new MeterProviderSharedState((_a = options === null || options === void 0 ? void 0 : options.resource) !== null && _a !== void 0 ? _a : Resource.empty());
    }
    /**
     * Get a meter with the configuration of the MeterProvider.
     */
    getMeter(name, version = '', options = {}) {
        // https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/metrics/sdk.md#meter-creation
        if (this._shutdown) {
            api.diag.warn('A shutdown MeterProvider cannot provide a Meter');
            return metrics.NOOP_METER;
        }
        return this._sharedState
            .getMeterSharedState({ name, version, schemaUrl: options.schemaUrl })
            .meter;
    }
    /**
     * Register a {@link MetricReader} to the meter provider. After the
     * registration, the MetricReader can start metrics collection.
     *
     * @param metricReader the metric reader to be registered.
     */
    addMetricReader(metricReader) {
        const collector = new MetricCollector(this._sharedState, metricReader);
        metricReader.setMetricProducer(collector);
        this._sharedState.metricCollectors.push(collector);
    }
    addView(options, selectorOptions) {
        var _a;
        if (isViewOptionsEmpty(options)) {
            throw new Error('Cannot create view with no view arguments supplied');
        }
        // the SDK SHOULD NOT allow Views with a specified name to be declared with instrument selectors that
        // may select more than one instrument (e.g. wild card instrument name) in the same Meter.
        if (options.name != null &&
            (((_a = selectorOptions === null || selectorOptions === void 0 ? void 0 : selectorOptions.instrument) === null || _a === void 0 ? void 0 : _a.name) == null ||
                PatternPredicate.hasWildcard(selectorOptions.instrument.name))) {
            throw new Error('Views with a specified name must be declared with an instrument selector that selects at most one instrument per meter.');
        }
        // Create AttributesProcessor if attributeKeys are defined set.
        let attributesProcessor = undefined;
        if (options.attributeKeys != null) {
            attributesProcessor = new FilteringAttributesProcessor(options.attributeKeys);
        }
        const view = new View({
            name: options.name,
            description: options.description,
            aggregation: options.aggregation,
            attributesProcessor: attributesProcessor
        });
        const instrument = new InstrumentSelector(selectorOptions === null || selectorOptions === void 0 ? void 0 : selectorOptions.instrument);
        const meter = new MeterSelector(selectorOptions === null || selectorOptions === void 0 ? void 0 : selectorOptions.meter);
        this._sharedState.viewRegistry.addView(view, instrument, meter);
    }
    /**
     * Flush all buffered data and shut down the MeterProvider and all registered
     * MetricReaders.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    async shutdown(options) {
        if (this._shutdown) {
            api.diag.warn('shutdown may only be called once per MeterProvider');
            return;
        }
        this._shutdown = true;
        await Promise.all(this._sharedState.metricCollectors.map(collector => {
            return collector.shutdown(options);
        }));
    }
    /**
     * Notifies all registered MetricReaders to flush any buffered data.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    async forceFlush(options) {
        // do not flush after shutdown
        if (this._shutdown) {
            api.diag.warn('invalid attempt to force flush after MeterProvider shutdown');
            return;
        }
        await Promise.all(this._sharedState.metricCollectors.map(collector => {
            return collector.forceFlush(options);
        }));
    }
}
//# sourceMappingURL=MeterProvider.js.map