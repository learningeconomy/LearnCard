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
import { hrTime } from '@opentelemetry/core';
import { instrumentationLibraryId } from '../utils';
import { ViewRegistry } from '../view/ViewRegistry';
import { MeterSharedState } from './MeterSharedState';
/**
 * An internal record for shared meter provider states.
 */
export class MeterProviderSharedState {
    constructor(resource) {
        this.resource = resource;
        this.viewRegistry = new ViewRegistry();
        this.sdkStartTime = hrTime();
        this.metricCollectors = [];
        this.meterSharedStates = new Map();
    }
    getMeterSharedState(instrumentationLibrary) {
        const id = instrumentationLibraryId(instrumentationLibrary);
        let meterSharedState = this.meterSharedStates.get(id);
        if (meterSharedState == null) {
            meterSharedState = new MeterSharedState(this, instrumentationLibrary);
            this.meterSharedStates.set(id, meterSharedState);
        }
        return meterSharedState;
    }
}
//# sourceMappingURL=MeterProviderSharedState.js.map