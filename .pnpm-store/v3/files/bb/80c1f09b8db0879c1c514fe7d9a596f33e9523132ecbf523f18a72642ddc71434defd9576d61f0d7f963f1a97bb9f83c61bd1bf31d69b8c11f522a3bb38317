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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
import { AggregationTemporality } from '../export/AggregationTemporality';
import { AttributeHashMap } from './HashMap';
/**
 * Internal interface.
 *
 * Provides unique reporting for each collectors. Allows synchronous collection
 * of metrics and reports given temporality values.
 */
var TemporalMetricProcessor = /** @class */ (function () {
    function TemporalMetricProcessor(_aggregator) {
        this._aggregator = _aggregator;
        this._unreportedAccumulations = new Map();
        this._reportHistory = new Map();
    }
    /**
     * Builds the {@link MetricData} streams to report against a specific MetricCollector.
     * @param collector The information of the MetricCollector.
     * @param collectors The registered collectors.
     * @param resource The resource to attach these metrics against.
     * @param instrumentationLibrary The instrumentation library that generated these metrics.
     * @param instrumentDescriptor The instrumentation descriptor that these metrics generated with.
     * @param currentAccumulations The current accumulation of metric data from instruments.
     * @param sdkStartTime The sdk start timestamp.
     * @param collectionTime The current collection timestamp.
     * @returns The {@link MetricData} points or `null`.
     */
    TemporalMetricProcessor.prototype.buildMetrics = function (collector, collectors, instrumentDescriptor, currentAccumulations, sdkStartTime, collectionTime) {
        var aggregationTemporality = collector.aggregatorTemporality;
        // In case it's our first collection, default to start timestamp (see below for explanation).
        var lastCollectionTime = sdkStartTime;
        this._stashAccumulations(collectors, currentAccumulations);
        var unreportedAccumulations = this._getMergedUnreportedAccumulations(collector);
        var result = unreportedAccumulations;
        // Check our last report time.
        if (this._reportHistory.has(collector)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            var last = this._reportHistory.get(collector);
            lastCollectionTime = last.collectionTime;
            // Use aggregation temporality + instrument to determine if we do a merge or a diff of
            // previous. We have the following four scenarios:
            // 1. Cumulative Aggregation (temporality) + Delta recording (sync instrument).
            //    Here we merge with our last record to get a cumulative aggregation.
            // 2. Cumulative Aggregation + Cumulative recording - do nothing
            // 3. Delta Aggregation + Delta recording - do nothing.
            // 4. Delta Aggregation + Cumulative recording (async instrument) - do nothing
            if (aggregationTemporality === AggregationTemporality.CUMULATIVE) {
                // We need to make sure the current delta recording gets merged into the previous cumulative
                // for the next cumulative measurement.
                result = TemporalMetricProcessor.merge(last.accumulations, unreportedAccumulations, this._aggregator);
            }
        }
        // Update last reported (cumulative) accumulation.
        this._reportHistory.set(collector, {
            accumulations: result,
            collectionTime: collectionTime,
        });
        // Metric data time span is determined as:
        // 1. Cumulative Aggregation time span: (sdkStartTime, collectionTime]
        // 2. Delta Aggregation time span: (lastCollectionTime, collectionTime]
        return this._aggregator.toMetricData(instrumentDescriptor, AttributesMapToAccumulationRecords(result), 
        /* startTime */ aggregationTemporality === AggregationTemporality.CUMULATIVE ? sdkStartTime : lastCollectionTime, 
        /* endTime */ collectionTime);
    };
    TemporalMetricProcessor.prototype._stashAccumulations = function (collectors, currentAccumulation) {
        var _this = this;
        collectors.forEach(function (it) {
            var stash = _this._unreportedAccumulations.get(it);
            if (stash === undefined) {
                stash = [];
                _this._unreportedAccumulations.set(it, stash);
            }
            stash.push(currentAccumulation);
        });
    };
    TemporalMetricProcessor.prototype._getMergedUnreportedAccumulations = function (collector) {
        var e_1, _a;
        var result = new AttributeHashMap();
        var unreportedList = this._unreportedAccumulations.get(collector);
        this._unreportedAccumulations.set(collector, []);
        if (unreportedList === undefined) {
            return result;
        }
        try {
            for (var unreportedList_1 = __values(unreportedList), unreportedList_1_1 = unreportedList_1.next(); !unreportedList_1_1.done; unreportedList_1_1 = unreportedList_1.next()) {
                var it_1 = unreportedList_1_1.value;
                result = TemporalMetricProcessor.merge(result, it_1, this._aggregator);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (unreportedList_1_1 && !unreportedList_1_1.done && (_a = unreportedList_1.return)) _a.call(unreportedList_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    };
    TemporalMetricProcessor.merge = function (last, current, aggregator) {
        var _a;
        var result = last;
        var iterator = current.entries();
        var next = iterator.next();
        while (next.done !== true) {
            var _b = __read(next.value, 3), key = _b[0], record = _b[1], hash = _b[2];
            var lastAccumulation = (_a = last.get(key, hash)) !== null && _a !== void 0 ? _a : aggregator.createAccumulation();
            result.set(key, aggregator.merge(lastAccumulation, record), hash);
            next = iterator.next();
        }
        return result;
    };
    return TemporalMetricProcessor;
}());
export { TemporalMetricProcessor };
// TypeScript complains about converting 3 elements tuple to AccumulationRecord<T>.
function AttributesMapToAccumulationRecords(map) {
    return Array.from(map.entries());
}
//# sourceMappingURL=TemporalMetricProcessor.js.map