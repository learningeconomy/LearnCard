import * as api from '@opentelemetry/api';
import * as metrics from '@opentelemetry/api-metrics';
import { InstrumentDescriptor } from './InstrumentDescriptor';
import { WritableMetricStorage } from './state/WritableMetricStorage';
export declare class SyncInstrument {
    private _writableMetricStorage;
    private _descriptor;
    constructor(_writableMetricStorage: WritableMetricStorage, _descriptor: InstrumentDescriptor);
    getName(): string;
    protected _record(value: number, attributes?: metrics.MetricAttributes, context?: api.Context): void;
}
/**
 * The class implements {@link metrics.UpDownCounter} interface.
 */
export declare class UpDownCounterInstrument extends SyncInstrument implements metrics.UpDownCounter {
    /**
     * Increment value of counter by the input. Inputs may be negative.
     */
    add(value: number, attributes?: metrics.MetricAttributes, ctx?: api.Context): void;
}
/**
 * The class implements {@link metrics.Counter} interface.
 */
export declare class CounterInstrument extends SyncInstrument implements metrics.Counter {
    /**
     * Increment value of counter by the input. Inputs may not be negative.
     */
    add(value: number, attributes?: metrics.MetricAttributes, ctx?: api.Context): void;
}
/**
 * The class implements {@link metrics.Histogram} interface.
 */
export declare class HistogramInstrument extends SyncInstrument implements metrics.Histogram {
    /**
     * Records a measurement. Value of the measurement must not be negative.
     */
    record(value: number, attributes?: metrics.MetricAttributes, ctx?: api.Context): void;
}
//# sourceMappingURL=Instruments.d.ts.map