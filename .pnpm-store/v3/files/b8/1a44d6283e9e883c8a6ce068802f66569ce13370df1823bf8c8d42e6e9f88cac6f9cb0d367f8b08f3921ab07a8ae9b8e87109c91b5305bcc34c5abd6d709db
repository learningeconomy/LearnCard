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
import { AggregatorKind } from './types';
import { hrTime, hrTimeToMicroseconds } from '@opentelemetry/core';
import { DataPointType } from '../export/MetricData';
export class LastValueAccumulation {
    constructor(_current = 0, sampleTime = [0, 0]) {
        this._current = _current;
        this.sampleTime = sampleTime;
    }
    record(value) {
        this._current = value;
        this.sampleTime = hrTime();
    }
    toPointValue() {
        return this._current;
    }
}
/** Basic aggregator which calculates a LastValue from individual measurements. */
export class LastValueAggregator {
    constructor() {
        this.kind = AggregatorKind.LAST_VALUE;
    }
    createAccumulation() {
        return new LastValueAccumulation();
    }
    /**
     * Returns the result of the merge of the given accumulations.
     *
     * Return the newly captured (delta) accumulation for LastValueAggregator.
     */
    merge(previous, delta) {
        // nanoseconds may lose precisions.
        const latestAccumulation = hrTimeToMicroseconds(delta.sampleTime) >= hrTimeToMicroseconds(previous.sampleTime) ? delta : previous;
        return new LastValueAccumulation(latestAccumulation.toPointValue(), latestAccumulation.sampleTime);
    }
    /**
     * Returns a new DELTA aggregation by comparing two cumulative measurements.
     *
     * A delta aggregation is not meaningful to LastValueAggregator, just return
     * the newly captured (delta) accumulation for LastValueAggregator.
     */
    diff(previous, current) {
        // nanoseconds may lose precisions.
        const latestAccumulation = hrTimeToMicroseconds(current.sampleTime) >= hrTimeToMicroseconds(previous.sampleTime) ? current : previous;
        return new LastValueAccumulation(latestAccumulation.toPointValue(), latestAccumulation.sampleTime);
    }
    toMetricData(descriptor, accumulationByAttributes, startTime, endTime) {
        return {
            descriptor,
            dataPointType: DataPointType.SINGULAR,
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
//# sourceMappingURL=LastValue.js.map