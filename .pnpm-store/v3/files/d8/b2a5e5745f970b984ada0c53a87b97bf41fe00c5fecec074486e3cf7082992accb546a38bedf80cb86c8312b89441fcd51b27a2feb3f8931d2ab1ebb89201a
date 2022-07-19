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
import { AggregationTemporality } from '../export/AggregationTemporality';
import { AttributeHashMap } from './HashMap';
/**
 * Internal interface.
 *
 * Provides unique reporting for each collectors. Allows synchronous collection
 * of metrics and reports given temporality values.
 */
export class TemporalMetricProcessor {
    constructor(_aggregator) {
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
    buildMetrics(collector, collectors, instrumentDescriptor, currentAccumulations, sdkStartTime, collectionTime) {
        const aggregationTemporality = collector.aggregatorTemporality;
        // In case it's our first collection, default to start timestamp (see below for explanation).
        let lastCollectionTime = sdkStartTime;
        this._stashAccumulations(collectors, currentAccumulations);
        const unreportedAccumulations = this._getMergedUnreportedAccumulations(collector);
        let result = unreportedAccumulations;
        // Check our last report time.
        if (this._reportHistory.has(collector)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const last = this._reportHistory.get(collector);
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
            collectionTime,
        });
        // Metric data time span is determined as:
        // 1. Cumulative Aggregation time span: (sdkStartTime, collectionTime]
        // 2. Delta Aggregation time span: (lastCollectionTime, collectionTime]
        return this._aggregator.toMetricData(instrumentDescriptor, AttributesMapToAccumulationRecords(result), 
        /* startTime */ aggregationTemporality === AggregationTemporality.CUMULATIVE ? sdkStartTime : lastCollectionTime, 
        /* endTime */ collectionTime);
    }
    _stashAccumulations(collectors, currentAccumulation) {
        collectors.forEach(it => {
            let stash = this._unreportedAccumulations.get(it);
            if (stash === undefined) {
                stash = [];
                this._unreportedAccumulations.set(it, stash);
            }
            stash.push(currentAccumulation);
        });
    }
    _getMergedUnreportedAccumulations(collector) {
        let result = new AttributeHashMap();
        const unreportedList = this._unreportedAccumulations.get(collector);
        this._unreportedAccumulations.set(collector, []);
        if (unreportedList === undefined) {
            return result;
        }
        for (const it of unreportedList) {
            result = TemporalMetricProcessor.merge(result, it, this._aggregator);
        }
        return result;
    }
    static merge(last, current, aggregator) {
        var _a;
        const result = last;
        const iterator = current.entries();
        let next = iterator.next();
        while (next.done !== true) {
            const [key, record, hash] = next.value;
            const lastAccumulation = (_a = last.get(key, hash)) !== null && _a !== void 0 ? _a : aggregator.createAccumulation();
            result.set(key, aggregator.merge(lastAccumulation, record), hash);
            next = iterator.next();
        }
        return result;
    }
}
// TypeScript complains about converting 3 elements tuple to AccumulationRecord<T>.
function AttributesMapToAccumulationRecords(map) {
    return Array.from(map.entries());
}
//# sourceMappingURL=TemporalMetricProcessor.js.map