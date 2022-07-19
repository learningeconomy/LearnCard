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
import { AggregatorKind, } from './types';
import { DataPointType } from '../export/MetricData';
function createNewEmptyCheckpoint(boundaries) {
    var counts = boundaries.map(function () { return 0; });
    counts.push(0);
    return {
        buckets: {
            boundaries: boundaries,
            counts: counts,
        },
        sum: 0,
        count: 0,
    };
}
var HistogramAccumulation = /** @class */ (function () {
    function HistogramAccumulation(_boundaries, _current) {
        if (_current === void 0) { _current = createNewEmptyCheckpoint(_boundaries); }
        this._boundaries = _boundaries;
        this._current = _current;
    }
    HistogramAccumulation.prototype.record = function (value) {
        this._current.count += 1;
        this._current.sum += value;
        for (var i = 0; i < this._boundaries.length; i++) {
            if (value < this._boundaries[i]) {
                this._current.buckets.counts[i] += 1;
                return;
            }
        }
        // value is above all observed boundaries
        this._current.buckets.counts[this._boundaries.length] += 1;
    };
    HistogramAccumulation.prototype.toPointValue = function () {
        return this._current;
    };
    return HistogramAccumulation;
}());
export { HistogramAccumulation };
/**
 * Basic aggregator which observes events and counts them in pre-defined buckets
 * and provides the total sum and count of all observations.
 */
var HistogramAggregator = /** @class */ (function () {
    /**
     * @param _boundaries upper bounds of recorded values.
     */
    function HistogramAggregator(_boundaries) {
        this._boundaries = _boundaries;
        this.kind = AggregatorKind.HISTOGRAM;
    }
    HistogramAggregator.prototype.createAccumulation = function () {
        return new HistogramAccumulation(this._boundaries);
    };
    /**
     * Return the result of the merge of two histogram accumulations. As long as one Aggregator
     * instance produces all Accumulations with constant boundaries we don't need to worry about
     * merging accumulations with different boundaries.
     */
    HistogramAggregator.prototype.merge = function (previous, delta) {
        var previousValue = previous.toPointValue();
        var deltaValue = delta.toPointValue();
        var previousCounts = previousValue.buckets.counts;
        var deltaCounts = deltaValue.buckets.counts;
        var mergedCounts = new Array(previousCounts.length);
        for (var idx = 0; idx < previousCounts.length; idx++) {
            mergedCounts[idx] = previousCounts[idx] + deltaCounts[idx];
        }
        return new HistogramAccumulation(previousValue.buckets.boundaries, {
            buckets: {
                boundaries: previousValue.buckets.boundaries,
                counts: mergedCounts,
            },
            count: previousValue.count + deltaValue.count,
            sum: previousValue.sum + deltaValue.sum,
        });
    };
    /**
     * Returns a new DELTA aggregation by comparing two cumulative measurements.
     */
    HistogramAggregator.prototype.diff = function (previous, current) {
        var previousValue = previous.toPointValue();
        var currentValue = current.toPointValue();
        var previousCounts = previousValue.buckets.counts;
        var currentCounts = currentValue.buckets.counts;
        var diffedCounts = new Array(previousCounts.length);
        for (var idx = 0; idx < previousCounts.length; idx++) {
            diffedCounts[idx] = currentCounts[idx] - previousCounts[idx];
        }
        return new HistogramAccumulation(previousValue.buckets.boundaries, {
            buckets: {
                boundaries: previousValue.buckets.boundaries,
                counts: diffedCounts,
            },
            count: currentValue.count - previousValue.count,
            sum: currentValue.sum - previousValue.sum,
        });
    };
    HistogramAggregator.prototype.toMetricData = function (descriptor, accumulationByAttributes, startTime, endTime) {
        return {
            descriptor: descriptor,
            dataPointType: DataPointType.HISTOGRAM,
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
    return HistogramAggregator;
}());
export { HistogramAggregator };
//# sourceMappingURL=Histogram.js.map