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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { AttributeHashMap } from './HashMap';
/**
 * Internal interface.
 *
 * Allows synchronous collection of metrics. This processor should allow
 * allocation of new aggregation cells for metrics and convert cumulative
 * recording to delta data points.
 */
var DeltaMetricProcessor = /** @class */ (function () {
    function DeltaMetricProcessor(_aggregator) {
        this._aggregator = _aggregator;
        this._activeCollectionStorage = new AttributeHashMap();
        // TODO: find a reasonable mean to clean the memo;
        // https://github.com/open-telemetry/opentelemetry-specification/pull/2208
        this._cumulativeMemoStorage = new AttributeHashMap();
    }
    /** Bind an efficient storage handle for a set of attributes. */
    DeltaMetricProcessor.prototype.bind = function (attributes) {
        var _this = this;
        return this._activeCollectionStorage.getOrDefault(attributes, function () { return _this._aggregator.createAccumulation(); });
    };
    DeltaMetricProcessor.prototype.record = function (value, attributes, _context) {
        var accumulation = this.bind(attributes);
        accumulation === null || accumulation === void 0 ? void 0 : accumulation.record(value);
    };
    DeltaMetricProcessor.prototype.batchCumulate = function (measurements) {
        var _this = this;
        Array.from(measurements.entries()).forEach(function (_a) {
            var _b = __read(_a, 3), attributes = _b[0], value = _b[1], hashCode = _b[2];
            var accumulation = _this._aggregator.createAccumulation();
            accumulation === null || accumulation === void 0 ? void 0 : accumulation.record(value);
            if (_this._cumulativeMemoStorage.has(attributes, hashCode)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                var previous = _this._cumulativeMemoStorage.get(attributes, hashCode);
                accumulation = _this._aggregator.diff(previous, accumulation);
            }
            _this._cumulativeMemoStorage.set(attributes, accumulation, hashCode);
            _this._activeCollectionStorage.set(attributes, accumulation, hashCode);
        });
    };
    DeltaMetricProcessor.prototype.collect = function () {
        var unreportedDelta = this._activeCollectionStorage;
        this._activeCollectionStorage = new AttributeHashMap();
        return unreportedDelta;
    };
    return DeltaMetricProcessor;
}());
export { DeltaMetricProcessor };
//# sourceMappingURL=DeltaMetricProcessor.js.map