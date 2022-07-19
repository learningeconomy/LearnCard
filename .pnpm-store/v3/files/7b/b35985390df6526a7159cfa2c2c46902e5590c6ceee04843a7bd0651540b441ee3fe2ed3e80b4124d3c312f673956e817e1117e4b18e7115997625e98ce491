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
exports.MetricCollector = void 0;
const core_1 = require("@opentelemetry/core");
/**
 * An internal opaque interface that the MetricReader receives as
 * MetricProducer. It acts as the storage key to the internal metric stream
 * state for each MetricReader.
 */
class MetricCollector {
    constructor(_sharedState, _metricReader) {
        this._sharedState = _sharedState;
        this._metricReader = _metricReader;
        this.aggregatorTemporality = this._metricReader.getPreferredAggregationTemporality();
    }
    async collect() {
        const collectionTime = (0, core_1.hrTime)();
        const meterCollectionPromises = Array.from(this._sharedState.meterSharedStates.values())
            .map(meterSharedState => meterSharedState.collect(this, collectionTime));
        const instrumentationLibraryMetrics = await Promise.all(meterCollectionPromises);
        return {
            resource: this._sharedState.resource,
            instrumentationLibraryMetrics,
        };
    }
    /**
     * Delegates for MetricReader.forceFlush.
     */
    async forceFlush(options) {
        await this._metricReader.forceFlush(options);
    }
    /**
     * Delegates for MetricReader.shutdown.
     */
    async shutdown(options) {
        await this._metricReader.shutdown(options);
    }
}
exports.MetricCollector = MetricCollector;
//# sourceMappingURL=MetricCollector.js.map