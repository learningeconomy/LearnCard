import * as metrics from '@opentelemetry/api-metrics';
import { MeterSharedState } from './state/MeterSharedState';
/**
 * This class implements the {@link metrics.Meter} interface.
 */
export declare class Meter implements metrics.Meter {
    private _meterSharedState;
    constructor(_meterSharedState: MeterSharedState);
    /**
     * Create a {@link metrics.Histogram} instrument.
     */
    createHistogram(name: string, options?: metrics.HistogramOptions): metrics.Histogram;
    /**
     * Create a {@link metrics.Counter} instrument.
     */
    createCounter(name: string, options?: metrics.CounterOptions): metrics.Counter;
    /**
     * Create a {@link metrics.UpDownCounter} instrument.
     */
    createUpDownCounter(name: string, options?: metrics.UpDownCounterOptions): metrics.UpDownCounter;
    /**
     * Create a ObservableGauge instrument.
     */
    createObservableGauge(name: string, callback: metrics.ObservableCallback, options?: metrics.ObservableGaugeOptions): void;
    /**
     * Create a ObservableCounter instrument.
     */
    createObservableCounter(name: string, callback: metrics.ObservableCallback, options?: metrics.ObservableCounterOptions): void;
    /**
     * Create a ObservableUpDownCounter instrument.
     */
    createObservableUpDownCounter(name: string, callback: metrics.ObservableCallback, options?: metrics.ObservableUpDownCounterOptions): void;
}
//# sourceMappingURL=Meter.d.ts.map