import * as metrics from '@opentelemetry/api-metrics';
import { Resource } from '@opentelemetry/resources';
import { MetricReader } from './export/MetricReader';
import { Aggregation } from './view/Aggregation';
import { InstrumentType } from './InstrumentDescriptor';
import { ForceFlushOptions, ShutdownOptions } from './types';
/**
 * MeterProviderOptions provides an interface for configuring a MeterProvider.
 */
export interface MeterProviderOptions {
    /** Resource associated with metric telemetry  */
    resource?: Resource;
}
export declare type ViewOptions = {
    /**
     *  If not provided, the Instrument name will be used by default. This will be used as the name of the metrics stream.
     */
    name?: string;
    /**
     * If not provided, the Instrument description will be used by default.
     */
    description?: string;
    /**
     * If provided, the attributes that are not in the list will be ignored.
     * If not provided, all the attribute keys will be used by default.
     */
    attributeKeys?: string[];
    /**
     * The {@link Aggregation} aggregation to be used.
     */
    aggregation?: Aggregation;
};
export declare type SelectorOptions = {
    instrument?: {
        /**
         * The type of the Instrument(s).
         */
        type?: InstrumentType;
        /**
         * Name of the Instrument(s) with wildcard support.
         */
        name?: string;
    };
    meter?: {
        /**
         * The name of the Meter.
         */
        name?: string;
        /**
         * The version of the Meter.
         */
        version?: string;
        /**
         * The schema URL of the Meter.
         */
        schemaUrl?: string;
    };
};
/**
 * This class implements the {@link metrics.MeterProvider} interface.
 */
export declare class MeterProvider implements metrics.MeterProvider {
    private _sharedState;
    private _shutdown;
    constructor(options?: MeterProviderOptions);
    /**
     * Get a meter with the configuration of the MeterProvider.
     */
    getMeter(name: string, version?: string, options?: metrics.MeterOptions): metrics.Meter;
    /**
     * Register a {@link MetricReader} to the meter provider. After the
     * registration, the MetricReader can start metrics collection.
     *
     * @param metricReader the metric reader to be registered.
     */
    addMetricReader(metricReader: MetricReader): void;
    addView(options: ViewOptions, selectorOptions?: SelectorOptions): void;
    /**
     * Flush all buffered data and shut down the MeterProvider and all registered
     * MetricReaders.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    shutdown(options?: ShutdownOptions): Promise<void>;
    /**
     * Notifies all registered MetricReaders to flush any buffered data.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    forceFlush(options?: ForceFlushOptions): Promise<void>;
}
//# sourceMappingURL=MeterProvider.d.ts.map