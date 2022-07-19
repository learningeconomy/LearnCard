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
exports.DeltaMetricProcessor = void 0;
const HashMap_1 = require("./HashMap");
/**
 * Internal interface.
 *
 * Allows synchronous collection of metrics. This processor should allow
 * allocation of new aggregation cells for metrics and convert cumulative
 * recording to delta data points.
 */
class DeltaMetricProcessor {
    constructor(_aggregator) {
        this._aggregator = _aggregator;
        this._activeCollectionStorage = new HashMap_1.AttributeHashMap();
        // TODO: find a reasonable mean to clean the memo;
        // https://github.com/open-telemetry/opentelemetry-specification/pull/2208
        this._cumulativeMemoStorage = new HashMap_1.AttributeHashMap();
    }
    /** Bind an efficient storage handle for a set of attributes. */
    bind(attributes) {
        return this._activeCollectionStorage.getOrDefault(attributes, () => this._aggregator.createAccumulation());
    }
    record(value, attributes, _context) {
        const accumulation = this.bind(attributes);
        accumulation === null || accumulation === void 0 ? void 0 : accumulation.record(value);
    }
    batchCumulate(measurements) {
        Array.from(measurements.entries()).forEach(([attributes, value, hashCode]) => {
            let accumulation = this._aggregator.createAccumulation();
            accumulation === null || accumulation === void 0 ? void 0 : accumulation.record(value);
            if (this._cumulativeMemoStorage.has(attributes, hashCode)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const previous = this._cumulativeMemoStorage.get(attributes, hashCode);
                accumulation = this._aggregator.diff(previous, accumulation);
            }
            this._cumulativeMemoStorage.set(attributes, accumulation, hashCode);
            this._activeCollectionStorage.set(attributes, accumulation, hashCode);
        });
    }
    collect() {
        const unreportedDelta = this._activeCollectionStorage;
        this._activeCollectionStorage = new HashMap_1.AttributeHashMap();
        return unreportedDelta;
    }
}
exports.DeltaMetricProcessor = DeltaMetricProcessor;
//# sourceMappingURL=DeltaMetricProcessor.js.map