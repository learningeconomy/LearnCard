import { Context } from '@opentelemetry/api';
import { MetricAttributes } from '@opentelemetry/api-metrics';
/**
 * Internal interface.
 *
 * Stores {@link MetricData} and allows synchronous writes of measurements.
 */
export interface WritableMetricStorage {
    /** Records a measurement. */
    record(value: number, attributes: MetricAttributes, context: Context): void;
}
export declare class NoopWritableMetricStorage implements WritableMetricStorage {
    record(_value: number, _attributes: MetricAttributes, _context: Context): void;
}
//# sourceMappingURL=WritableMetricStorage.d.ts.map