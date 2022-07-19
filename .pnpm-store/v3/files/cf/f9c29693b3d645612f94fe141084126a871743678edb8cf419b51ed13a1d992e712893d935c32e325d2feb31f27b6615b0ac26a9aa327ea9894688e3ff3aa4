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
import { AttributeHashMap } from './state/HashMap';
/**
 * The class implements {@link metrics.observableResult} interface.
 */
export class ObservableResult {
    constructor() {
        /**
         * @internal
         */
        this.buffer = new AttributeHashMap();
    }
    /**
     * Observe a measurement of the value associated with the given attributes.
     */
    observe(value, attributes = {}) {
        this.buffer.set(attributes, value);
    }
}
//# sourceMappingURL=ObservableResult.js.map