import { HrTime } from '@opentelemetry/api';
import { InstrumentationLibrary } from '@opentelemetry/core';
import { Resource } from '@opentelemetry/resources';
import { ViewRegistry } from '../view/ViewRegistry';
import { MeterSharedState } from './MeterSharedState';
import { MetricCollector } from './MetricCollector';
/**
 * An internal record for shared meter provider states.
 */
export declare class MeterProviderSharedState {
    resource: Resource;
    viewRegistry: ViewRegistry;
    readonly sdkStartTime: HrTime;
    metricCollectors: MetricCollector[];
    meterSharedStates: Map<string, MeterSharedState>;
    constructor(resource: Resource);
    getMeterSharedState(instrumentationLibrary: InstrumentationLibrary): MeterSharedState;
}
//# sourceMappingURL=MeterProviderSharedState.d.ts.map