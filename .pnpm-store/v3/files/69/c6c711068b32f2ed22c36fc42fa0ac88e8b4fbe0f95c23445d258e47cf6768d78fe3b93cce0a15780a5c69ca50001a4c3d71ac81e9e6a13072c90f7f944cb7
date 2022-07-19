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
exports.NOOP_UP_DOWN_COUNTER_METRIC = exports.NOOP_HISTOGRAM_METRIC = exports.NOOP_COUNTER_METRIC = exports.NOOP_METER = exports.NoopHistogramMetric = exports.NoopUpDownCounterMetric = exports.NoopCounterMetric = exports.NoopMetric = exports.NoopMeter = void 0;
/**
 * NoopMeter is a noop implementation of the {@link Meter} interface. It reuses
 * constant NoopMetrics for all of its methods.
 */
class NoopMeter {
    constructor() { }
    /**
     * Returns a constant noop histogram.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createHistogram(_name, _options) {
        return exports.NOOP_HISTOGRAM_METRIC;
    }
    /**
     * Returns a constant noop counter.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createCounter(_name, _options) {
        return exports.NOOP_COUNTER_METRIC;
    }
    /**
     * Returns a constant noop UpDownCounter.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createUpDownCounter(_name, _options) {
        return exports.NOOP_UP_DOWN_COUNTER_METRIC;
    }
    /**
     * Returns a constant noop observable gauge.
     * @param name the name of the metric.
     * @param callback the observable gauge callback
     * @param [options] the metric options.
     */
    createObservableGauge(_name, _callback, _options) { }
    /**
     * Returns a constant noop observable counter.
     * @param name the name of the metric.
     * @param callback the observable counter callback
     * @param [options] the metric options.
     */
    createObservableCounter(_name, _callback, _options) { }
    /**
     * Returns a constant noop up down observable counter.
     * @param name the name of the metric.
     * @param callback the up down observable counter callback
     * @param [options] the metric options.
     */
    createObservableUpDownCounter(_name, _callback, _options) { }
}
exports.NoopMeter = NoopMeter;
class NoopMetric {
}
exports.NoopMetric = NoopMetric;
class NoopCounterMetric extends NoopMetric {
    add(_value, _attributes) { }
}
exports.NoopCounterMetric = NoopCounterMetric;
class NoopUpDownCounterMetric extends NoopMetric {
    add(_value, _attributes) { }
}
exports.NoopUpDownCounterMetric = NoopUpDownCounterMetric;
class NoopHistogramMetric extends NoopMetric {
    record(_value, _attributes) { }
}
exports.NoopHistogramMetric = NoopHistogramMetric;
exports.NOOP_METER = new NoopMeter();
// Synchronous instruments
exports.NOOP_COUNTER_METRIC = new NoopCounterMetric();
exports.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
exports.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
//# sourceMappingURL=NoopMeter.js.map