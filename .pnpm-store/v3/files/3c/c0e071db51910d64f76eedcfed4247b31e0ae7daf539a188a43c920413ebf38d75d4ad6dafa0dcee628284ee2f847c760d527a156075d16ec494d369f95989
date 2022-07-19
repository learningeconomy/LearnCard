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
import { AggregatorKind, } from './types';
import { DataPointType } from '../export/MetricData';
function createNewEmptyCheckpoint(boundaries) {
    const counts = boundaries.map(() => 0);
    counts.push(0);
    return {
        buckets: {
            boundaries,
            counts,
        },
        sum: 0,
        count: 0,
    };
}
export class HistogramAccumulation {
    constructor(_boundaries, _current = createNewEmptyCheckpoint(_boundaries)) {
        this._boundaries = _boundaries;
        this._current = _current;
    }
    record(value) {
        this._current.count += 1;
        this._current.sum += value;
        for (let i = 0; i < this._boundaries.length; i++) {
            if (value < this._boundaries[i]) {
                this._current.buckets.counts[i] += 1;
                return;
            }
        }
        // value is above all observed boundaries
        this._current.buckets.counts[this._boundaries.length] += 1;
    }
    toPointValue() {
        return this._current;
    }
}
/**
 * Basic aggregator which observes events and counts them in pre-defined buckets
 * and provides the total sum and count of all observations.
 */
export class HistogramAggregator {
    /**
     * @param _boundaries upper bounds of recorded values.
     */
    constructor(_boundaries) {
        this._boundaries = _boundaries;
        this.kind = AggregatorKind.HISTOGRAM;
    }
    createAccumulation() {
        return new HistogramAccumulation(this._boundaries);
    }
    /**
     * Return the result of the merge of two histogram accumulations. As long as one Aggregator
     * instance produces all Accumulations with constant boundaries we don't need to worry about
     * merging accumulations with different boundaries.
     */
    merge(previous, delta) {
        const previousValue = previous.toPointValue();
        const deltaValue = delta.toPointValue();
        const previousCounts = previousValue.buckets.counts;
        const deltaCounts = deltaValue.buckets.counts;
        const mergedCounts = new Array(previousCounts.length);
        for (let idx = 0; idx < previousCounts.length; idx++) {
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
    }
    /**
     * Returns a new DELTA aggregation by comparing two cumulative measurements.
     */
    diff(previous, current) {
        const previousValue = previous.toPointValue();
        const currentValue = current.toPointValue();
        const previousCounts = previousValue.buckets.counts;
        const currentCounts = currentValue.buckets.counts;
        const diffedCounts = new Array(previousCounts.length);
        for (let idx = 0; idx < previousCounts.length; idx++) {
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
    }
    toMetricData(descriptor, accumulationByAttributes, startTime, endTime) {
        return {
            descriptor,
            dataPointType: DataPointType.HISTOGRAM,
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
//# sourceMappingURL=Histogram.js.map