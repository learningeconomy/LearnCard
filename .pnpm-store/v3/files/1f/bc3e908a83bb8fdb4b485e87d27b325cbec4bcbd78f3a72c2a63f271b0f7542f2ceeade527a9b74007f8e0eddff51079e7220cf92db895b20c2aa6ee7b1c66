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
import { Aggregation } from './Aggregation';
import { AttributesProcessor } from './AttributesProcessor';
/**
 * A View provides the flexibility to customize the metrics that are output by
 * the SDK. For example, the view can
 * - customize which Instruments are to be processed/ignored.
 * - customize the aggregation.
 * - customize which attribute(s) are to be reported as metrics dimension(s).
 * - add additional dimension(s) from the {@link Context}.
 */
export class View {
    /**
     * Construct a metric view
     *
     * @param config how the result metric streams were configured
     */
    constructor(config) {
        var _a, _b;
        this.name = config === null || config === void 0 ? void 0 : config.name;
        this.description = config === null || config === void 0 ? void 0 : config.description;
        this.aggregation = (_a = config === null || config === void 0 ? void 0 : config.aggregation) !== null && _a !== void 0 ? _a : Aggregation.Default();
        this.attributesProcessor = (_b = config === null || config === void 0 ? void 0 : config.attributesProcessor) !== null && _b !== void 0 ? _b : AttributesProcessor.Noop();
    }
}
//# sourceMappingURL=View.js.map