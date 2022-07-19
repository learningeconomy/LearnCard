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
import { AggregatorKind } from './types';
import { DataPointType } from '../export/MetricData';
var SumAccumulation = /** @class */ (function () {
    function SumAccumulation(_current) {
        if (_current === void 0) { _current = 0; }
        this._current = _current;
    }
    SumAccumulation.prototype.record = function (value) {
        this._current += value;
    };
    SumAccumulation.prototype.toPointValue = function () {
        return this._current;
    };
    return SumAccumulation;
}());
export { SumAccumulation };
/** Basic aggregator which calculates a Sum from individual measurements. */
var SumAggregator = /** @class */ (function () {
    function SumAggregator() {
        this.kind = AggregatorKind.SUM;
    }
    SumAggregator.prototype.createAccumulation = function () {
        return new SumAccumulation();
    };
    /**
     * Returns the result of the merge of the given accumulations.
     */
    SumAggregator.prototype.merge = function (previous, delta) {
        return new SumAccumulation(previous.toPointValue() + delta.toPointValue());
    };
    /**
     * Returns a new DELTA aggregation by comparing two cumulative measurements.
     */
    SumAggregator.prototype.diff = function (previous, current) {
        return new SumAccumulation(current.toPointValue() - previous.toPointValue());
    };
    SumAggregator.prototype.toMetricData = function (descriptor, accumulationByAttributes, startTime, endTime) {
        return {
            descriptor: descriptor,
            dataPointType: DataPointType.SINGULAR,
            dataPoints: accumulationByAttributes.map(function (_a) {
                var _b = __read(_a, 2), attributes = _b[0], accumulation = _b[1];
                return {
                    attributes: attributes,
                    startTime: startTime,
                    endTime: endTime,
                    value: accumulation.toPointValue(),
                };
            })
        };
    };
    return SumAggregator;
}());
export { SumAggregator };
//# sourceMappingURL=Sum.js.map