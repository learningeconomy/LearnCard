import { Context } from '@opentelemetry/api';
import { ObservableResult } from './ObservableResult';
/**
 * Options needed for metric creation
 */
export interface MetricOptions {
    /**
     * The description of the Metric.
     * @default ''
     */
    description?: string;
    /**
     * The unit of the Metric values.
     * @default ''
     */
    unit?: string;
    /**
     * Indicates the type of the recorded value.
     * @default {@link ValueType.DOUBLE}
     */
    valueType?: ValueType;
}
export declare type CounterOptions = MetricOptions;
export declare type UpDownCounterOptions = MetricOptions;
export declare type ObservableGaugeOptions = MetricOptions;
export declare type ObservableCounterOptions = MetricOptions;
export declare type ObservableUpDownCounterOptions = MetricOptions;
export declare type HistogramOptions = MetricOptions;
/** The Type of value. It describes how the data is reported. */
export declare enum ValueType {
    INT = 0,
    DOUBLE = 1
}
/**
 * Counter is the most common synchronous instrument. This instrument supports
 * an `Add(increment)` function for reporting a sum, and is restricted to
 * non-negative increments. The default aggregation is Sum, as for any additive
 * instrument.
 *
 * Example uses for Counter:
 * <ol>
 *   <li> count the number of bytes received. </li>
 *   <li> count the number of requests completed. </li>
 *   <li> count the number of accounts created. </li>
 *   <li> count the number of checkpoints run. </li>
 *   <li> count the number of 5xx errors. </li>
 * <ol>
 */
export interface Counter {
    /**
     * Increment value of counter by the input. Inputs may not be negative.
     */
    add(value: number, attributes?: MetricAttributes, context?: Context): void;
}
export interface UpDownCounter {
    /**
     * Increment value of counter by the input. Inputs may be negative.
     */
    add(value: number, attributes?: MetricAttributes, context?: Context): void;
}
export interface Histogram {
    /**
     * Records a measurement. Value of the measurement must not be negative.
     */
    record(value: number, attributes?: MetricAttributes, context?: Context): void;
}
/**
 * key-value pairs passed by the user.
 */
export declare type MetricAttributes = {
    [key: string]: string;
};
/**
 * The observable callback for Observable instruments.
 */
export declare type ObservableCallback = (observableResult: ObservableResult) => void | Promise<void>;
//# sourceMappingURL=Metric.d.ts.map