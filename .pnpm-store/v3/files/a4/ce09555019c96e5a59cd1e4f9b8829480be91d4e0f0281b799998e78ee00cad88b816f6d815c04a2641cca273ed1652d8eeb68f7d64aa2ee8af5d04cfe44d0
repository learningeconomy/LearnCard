import { ResourceMetrics, InstrumentType, InstrumentationLibraryMetrics, MetricData, DataPoint, Histogram } from '@opentelemetry/sdk-metrics-base';
export declare class PrometheusSerializer {
    private _prefix;
    private _appendTimestamp;
    constructor(prefix?: string, appendTimestamp?: boolean);
    serialize(resourceMetrics: ResourceMetrics): string;
    serializeInstrumentationLibraryMetrics(instrumentationLibraryMetrics: InstrumentationLibraryMetrics): string;
    serializeMetricData(metricData: MetricData): string;
    serializeSingularDataPoint(name: string, type: InstrumentType, dataPoint: DataPoint<number>): string;
    serializeHistogramDataPoint(name: string, type: InstrumentType, dataPoint: DataPoint<Histogram>): string;
}
//# sourceMappingURL=PrometheusSerializer.d.ts.map