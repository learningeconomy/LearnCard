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
exports.SumAggregator = exports.SumAccumulation = void 0;
const types_1 = require("./types");
const MetricData_1 = require("../export/MetricData");
class SumAccumulation {
    constructor(_current = 0) {
        this._current = _current;
    }
    record(value) {
        this._current += value;
    }
    toPointValue() {
        return this._current;
    }
}
exports.SumAccumulation = SumAccumulation;
/** Basic aggregator which calculates a Sum from individual measurements. */
class SumAggregator {
    constructor() {
        this.kind = types_1.AggregatorKind.SUM;
    }
    createAccumulation() {
        return new SumAccumulation();
    }
    /**
     * Returns the result of the merge of the given accumulations.
     */
    merge(previous, delta) {
        return new SumAccumulation(previous.toPointValue() + delta.toPointValue());
    }
    /**
     * Returns a new DELTA aggregation by comparing two cumulative measurements.
     */
    diff(previous, current) {
        return new SumAccumulation(current.toPointValue() - previous.toPointValue());
    }
    toMetricData(descriptor, accumulationByAttributes, startTime, endTime) {
        return {
            descriptor,
            dataPointType: MetricData_1.DataPointType.SINGULAR,
            dataPoints: accumulationByAttributes.map(([attributes, accumulation]) => {
                return {
                    attributes,
                    startTime,
                    endTime,
                    value: accumulation.toPointValue(),
                };
            })
        };
    }
}
exports.SumAggregator = SumAggregator;
//# sourceMappingURL=Sum.js.map