import { HrTime } from '@opentelemetry/api';
import { MetricAttributes } from '@opentelemetry/api-metrics';
import { InstrumentationLibrary } from '@opentelemetry/core';
import { Resource } from '@opentelemetry/resources';
import { InstrumentDescriptor } from '../InstrumentDescriptor';
import { Histogram } from '../aggregator/types';
/**
 * Basic metric data fields.
 */
export interface BaseMetricData {
    readonly descriptor: InstrumentDescriptor;
    /**
     * DataPointType of the metric instrument.
     */
    readonly dataPointType: DataPointType;
}
/**
 * Represents a metric data aggregated by either a LastValueAggregation or
 * SumAggregation.
 */
export interface SingularMetricData extends BaseMetricData {
    readonly dataPointType: DataPointType.SINGULAR;
    readonly dataPoints: DataPoint<number>[];
}
/**
 * Represents a metric data aggregated by a HistogramAggregation.
 */
export interface HistogramMetricData extends BaseMetricData {
    readonly dataPointType: DataPointType.HISTOGRAM;
    readonly dataPoints: DataPoint<Histogram>[];
}
/**
 * Represents an aggregated metric data.
 */
export declare type MetricData = SingularMetricData | HistogramMetricData;
export interface InstrumentationLibraryMetrics {
    instrumentationLibrary: InstrumentationLibrary;
    metrics: MetricData[];
}
export interface ResourceMetrics {
    resource: Resource;
    instrumentationLibraryMetrics: InstrumentationLibraryMetrics[];
}
/**
 * The aggregated point data type.
 */
export declare enum DataPointType {
    SINGULAR = 0,
    HISTOGRAM = 1,
    EXPONENTIAL_HISTOGRAM = 2
}
/**
 * Represents an aggregated point data with start time, end time and their
 * associated attributes and points.
 */
export interface DataPoint<T> {
    /**
     * The start epoch timestamp of the DataPoint, usually the time when
     * the metric was created when the preferred AggregationTemporality is
     * CUMULATIVE, or last collection time otherwise.
     */
    readonly startTime: HrTime;
    /**
     * The end epoch timestamp when data were collected, usually it represents
     * the moment when `MetricReader.collect` was called.
     */
    readonly endTime: HrTime;
    /**
     * The attributes associated with this DataPoint.
     */
    readonly attributes: MetricAttributes;
    /**
     * The value for this DataPoint.
     */
    readonly value: T;
}
//# sourceMappingURL=MetricData.d.ts.map