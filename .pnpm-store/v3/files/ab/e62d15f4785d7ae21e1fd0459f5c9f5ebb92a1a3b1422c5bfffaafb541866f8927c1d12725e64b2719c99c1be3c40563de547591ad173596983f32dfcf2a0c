import { Meter } from './types/Meter';
import { MetricOptions, MetricAttributes, Counter, Histogram, UpDownCounter, ObservableCallback } from './types/Metric';
/**
 * NoopMeter is a noop implementation of the {@link Meter} interface. It reuses
 * constant NoopMetrics for all of its methods.
 */
export declare class NoopMeter implements Meter {
    constructor();
    /**
     * Returns a constant noop histogram.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createHistogram(_name: string, _options?: MetricOptions): Histogram;
    /**
     * Returns a constant noop counter.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createCounter(_name: string, _options?: MetricOptions): Counter;
    /**
     * Returns a constant noop UpDownCounter.
     * @param name the name of the metric.
     * @param [options] the metric options.
     */
    createUpDownCounter(_name: string, _options?: MetricOptions): UpDownCounter;
    /**
     * Returns a constant noop observable gauge.
     * @param name the name of the metric.
     * @param callback the observable gauge callback
     * @param [options] the metric options.
     */
    createObservableGauge(_name: string, _callback: ObservableCallback, _options?: MetricOptions): void;
    /**
     * Returns a constant noop observable counter.
     * @param name the name of the metric.
     * @param callback the observable counter callback
     * @param [options] the metric options.
     */
    createObservableCounter(_name: string, _callback: ObservableCallback, _options?: MetricOptions): void;
    /**
     * Returns a constant noop up down observable counter.
     * @param name the name of the metric.
     * @param callback the up down observable counter callback
     * @param [options] the metric options.
     */
    createObservableUpDownCounter(_name: string, _callback: ObservableCallback, _options?: MetricOptions): void;
}
export declare class NoopMetric {
}
export declare class NoopCounterMetric extends NoopMetric implements Counter {
    add(_value: number, _attributes: MetricAttributes): void;
}
export declare class NoopUpDownCounterMetric extends NoopMetric implements UpDownCounter {
    add(_value: number, _attributes: MetricAttributes): void;
}
export declare class NoopHistogramMetric extends NoopMetric implements Histogram {
    record(_value: number, _attributes: MetricAttributes): void;
}
export declare const NOOP_METER: NoopMeter;
export declare const NOOP_COUNTER_METRIC: NoopCounterMetric;
export declare const NOOP_HISTOGRAM_METRIC: NoopHistogramMetric;
export declare const NOOP_UP_DOWN_COUNTER_METRIC: NoopUpDownCounterMetric;
//# sourceMappingURL=NoopMeter.d.ts.map