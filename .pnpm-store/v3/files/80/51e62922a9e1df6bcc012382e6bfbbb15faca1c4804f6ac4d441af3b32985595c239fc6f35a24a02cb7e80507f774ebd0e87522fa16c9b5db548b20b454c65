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
exports.PrometheusSerializer = void 0;
const api_1 = require("@opentelemetry/api");
const sdk_metrics_base_1 = require("@opentelemetry/sdk-metrics-base");
const core_1 = require("@opentelemetry/core");
function escapeString(str) {
    return str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
}
function escapeAttributeValue(str) {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return escapeString(str).replace(/"/g, '\\"');
}
const invalidCharacterRegex = /[^a-z0-9_]/gi;
/**
 * Ensures metric names are valid Prometheus metric names by removing
 * characters allowed by OpenTelemetry but disallowed by Prometheus.
 *
 * https://prometheus.io/docs/concepts/data_model/#metric-names-and-attributes
 *
 * 1. Names must match `[a-zA-Z_:][a-zA-Z0-9_:]*`
 *
 * 2. Colons are reserved for user defined recording rules.
 * They should not be used by exporters or direct instrumentation.
 *
 * OpenTelemetry metric names are already validated in the Meter when they are created,
 * and they match the format `[a-zA-Z][a-zA-Z0-9_.\-]*` which is very close to a valid
 * prometheus metric name, so we only need to strip characters valid in OpenTelemetry
 * but not valid in prometheus and replace them with '_'.
 *
 * @param name name to be sanitized
 */
function sanitizePrometheusMetricName(name) {
    return name.replace(invalidCharacterRegex, '_'); // replace all invalid characters with '_'
}
/**
 * @private
 *
 * Helper method which assists in enforcing the naming conventions for metric
 * names in Prometheus
 * @param name the name of the metric
 * @param type the kind of metric
 * @returns string
 */
function enforcePrometheusNamingConvention(name, type) {
    // Prometheus requires that metrics of the Counter kind have "_total" suffix
    if (!name.endsWith('_total') && type === sdk_metrics_base_1.InstrumentType.COUNTER) {
        name = name + '_total';
    }
    return name;
}
function valueString(value) {
    if (Number.isNaN(value)) {
        return 'Nan';
    }
    else if (!Number.isFinite(value)) {
        if (value < 0) {
            return '-Inf';
        }
        else {
            return '+Inf';
        }
    }
    else {
        return `${value}`;
    }
}
function toPrometheusType(instrumentType, dataPointType) {
    switch (dataPointType) {
        case sdk_metrics_base_1.DataPointType.SINGULAR:
            if (instrumentType === sdk_metrics_base_1.InstrumentType.COUNTER ||
                instrumentType === sdk_metrics_base_1.InstrumentType.OBSERVABLE_COUNTER) {
                return 'counter';
            }
            /**
             * - HISTOGRAM
             * - UP_DOWN_COUNTER
             * - OBSERVABLE_GAUGE
             * - OBSERVABLE_UP_DOWN_COUNTER
             */
            return 'gauge';
        case sdk_metrics_base_1.DataPointType.HISTOGRAM:
            return 'histogram';
        default:
            return 'untyped';
    }
}
function stringify(metricName, attributes, value, timestamp, additionalAttributes) {
    let hasAttribute = false;
    let attributesStr = '';
    for (const [key, val] of Object.entries(attributes)) {
        const sanitizedAttributeName = sanitizePrometheusMetricName(key);
        hasAttribute = true;
        attributesStr += `${attributesStr.length > 0 ? ',' : ''}${sanitizedAttributeName}="${escapeAttributeValue(val)}"`;
    }
    if (additionalAttributes) {
        for (const [key, val] of Object.entries(additionalAttributes)) {
            const sanitizedAttributeName = sanitizePrometheusMetricName(key);
            hasAttribute = true;
            attributesStr += `${attributesStr.length > 0 ? ',' : ''}${sanitizedAttributeName}="${escapeAttributeValue(val)}"`;
        }
    }
    if (hasAttribute) {
        metricName += `{${attributesStr}}`;
    }
    return `${metricName} ${valueString(value)}${timestamp !== undefined ? ' ' + String(timestamp) : ''}\n`;
}
class PrometheusSerializer {
    constructor(prefix, appendTimestamp = true) {
        if (prefix) {
            this._prefix = prefix + '_';
        }
        this._appendTimestamp = appendTimestamp;
    }
    serialize(resourceMetrics) {
        let str = '';
        for (const instrumentationLibraryMetrics of resourceMetrics.instrumentationLibraryMetrics) {
            str += this.serializeInstrumentationLibraryMetrics(instrumentationLibraryMetrics);
        }
        return str;
    }
    serializeInstrumentationLibraryMetrics(instrumentationLibraryMetrics) {
        let str = '';
        for (const metric of instrumentationLibraryMetrics.metrics) {
            str += this.serializeMetricData(metric) + '\n';
        }
        return str;
    }
    serializeMetricData(metricData) {
        let name = sanitizePrometheusMetricName(escapeString(metricData.descriptor.name));
        if (this._prefix) {
            name = `${this._prefix}${name}`;
        }
        const dataPointType = metricData.dataPointType;
        name = enforcePrometheusNamingConvention(name, metricData.descriptor.type);
        const help = `# HELP ${name} ${escapeString(metricData.descriptor.description || 'description missing')}`;
        const type = `# TYPE ${name} ${toPrometheusType(metricData.descriptor.type, dataPointType)}`;
        let results = '';
        switch (dataPointType) {
            case sdk_metrics_base_1.DataPointType.SINGULAR: {
                results = metricData.dataPoints
                    .map(it => this.serializeSingularDataPoint(name, metricData.descriptor.type, it))
                    .join('');
                break;
            }
            case sdk_metrics_base_1.DataPointType.HISTOGRAM: {
                results = metricData.dataPoints
                    .map(it => this.serializeHistogramDataPoint(name, metricData.descriptor.type, it))
                    .join('');
                break;
            }
            default: {
                api_1.diag.error(`Unrecognizable DataPointType: ${dataPointType} for metric "${name}"`);
            }
        }
        return `${help}\n${type}\n${results}`.trim();
    }
    serializeSingularDataPoint(name, type, dataPoint) {
        let results = '';
        name = enforcePrometheusNamingConvention(name, type);
        const { value, attributes } = dataPoint;
        const timestamp = (0, core_1.hrTimeToMilliseconds)(dataPoint.endTime);
        results += stringify(name, attributes, value, this._appendTimestamp ? timestamp : undefined, undefined);
        return results;
    }
    serializeHistogramDataPoint(name, type, dataPoint) {
        let results = '';
        name = enforcePrometheusNamingConvention(name, type);
        const { value, attributes } = dataPoint;
        const timestamp = (0, core_1.hrTimeToMilliseconds)(dataPoint.endTime);
        /** Histogram["bucket"] is not typed with `number` */
        for (const key of ['count', 'sum']) {
            results += stringify(name + '_' + key, attributes, value[key], this._appendTimestamp ? timestamp : undefined, undefined);
        }
        let cumulativeSum = 0;
        const countEntries = value.buckets.counts.entries();
        let infiniteBoundaryDefined = false;
        for (const [idx, val] of countEntries) {
            cumulativeSum += val;
            const upperBound = value.buckets.boundaries[idx];
            /** HistogramAggregator is producing different boundary output -
             * in one case not including infinity values, in other -
             * full, e.g. [0, 100] and [0, 100, Infinity]
             * we should consider that in export, if Infinity is defined, use it
             * as boundary
             */
            if (upperBound === undefined && infiniteBoundaryDefined) {
                break;
            }
            if (upperBound === Infinity) {
                infiniteBoundaryDefined = true;
            }
            results += stringify(name + '_bucket', attributes, cumulativeSum, this._appendTimestamp ? timestamp : undefined, {
                le: upperBound === undefined || upperBound === Infinity
                    ? '+Inf'
                    : String(upperBound),
            });
        }
        return results;
    }
}
exports.PrometheusSerializer = PrometheusSerializer;
//# sourceMappingURL=PrometheusSerializer.js.map