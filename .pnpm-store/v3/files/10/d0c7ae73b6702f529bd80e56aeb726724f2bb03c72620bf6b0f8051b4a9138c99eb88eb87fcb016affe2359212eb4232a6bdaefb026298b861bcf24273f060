import { AggregationTemporality } from './AggregationTemporality';
import { ResourceMetrics } from './MetricData';
import { ExportResult } from '@opentelemetry/core';
export interface PushMetricExporter {
    export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): void;
    forceFlush(): Promise<void>;
    getPreferredAggregationTemporality(): AggregationTemporality;
    shutdown(): Promise<void>;
}
export declare class ConsoleMetricExporter implements PushMetricExporter {
    protected _shutdown: boolean;
    export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): void;
    getPreferredAggregationTemporality(): AggregationTemporality;
    forceFlush(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=MetricExporter.d.ts.map