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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as api from '@opentelemetry/api';
import * as metrics from '@opentelemetry/api-metrics';
import { Resource } from '@opentelemetry/resources';
import { MeterProviderSharedState } from './state/MeterProviderSharedState';
import { InstrumentSelector } from './view/InstrumentSelector';
import { MeterSelector } from './view/MeterSelector';
import { View } from './view/View';
import { MetricCollector } from './state/MetricCollector';
import { FilteringAttributesProcessor } from './view/AttributesProcessor';
import { PatternPredicate } from './view/Predicate';
function isViewOptionsEmpty(options) {
    return (options.name == null &&
        options.aggregation == null &&
        options.attributeKeys == null &&
        options.description == null);
}
/**
 * This class implements the {@link metrics.MeterProvider} interface.
 */
var MeterProvider = /** @class */ (function () {
    function MeterProvider(options) {
        var _a;
        this._shutdown = false;
        this._sharedState = new MeterProviderSharedState((_a = options === null || options === void 0 ? void 0 : options.resource) !== null && _a !== void 0 ? _a : Resource.empty());
    }
    /**
     * Get a meter with the configuration of the MeterProvider.
     */
    MeterProvider.prototype.getMeter = function (name, version, options) {
        if (version === void 0) { version = ''; }
        if (options === void 0) { options = {}; }
        // https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/metrics/sdk.md#meter-creation
        if (this._shutdown) {
            api.diag.warn('A shutdown MeterProvider cannot provide a Meter');
            return metrics.NOOP_METER;
        }
        return this._sharedState
            .getMeterSharedState({ name: name, version: version, schemaUrl: options.schemaUrl })
            .meter;
    };
    /**
     * Register a {@link MetricReader} to the meter provider. After the
     * registration, the MetricReader can start metrics collection.
     *
     * @param metricReader the metric reader to be registered.
     */
    MeterProvider.prototype.addMetricReader = function (metricReader) {
        var collector = new MetricCollector(this._sharedState, metricReader);
        metricReader.setMetricProducer(collector);
        this._sharedState.metricCollectors.push(collector);
    };
    MeterProvider.prototype.addView = function (options, selectorOptions) {
        var _a;
        if (isViewOptionsEmpty(options)) {
            throw new Error('Cannot create view with no view arguments supplied');
        }
        // the SDK SHOULD NOT allow Views with a specified name to be declared with instrument selectors that
        // may select more than one instrument (e.g. wild card instrument name) in the same Meter.
        if (options.name != null &&
            (((_a = selectorOptions === null || selectorOptions === void 0 ? void 0 : selectorOptions.instrument) === null || _a === void 0 ? void 0 : _a.name) == null ||
                PatternPredicate.hasWildcard(selectorOptions.instrument.name))) {
            throw new Error('Views with a specified name must be declared with an instrument selector that selects at most one instrument per meter.');
        }
        // Create AttributesProcessor if attributeKeys are defined set.
        var attributesProcessor = undefined;
        if (options.attributeKeys != null) {
            attributesProcessor = new FilteringAttributesProcessor(options.attributeKeys);
        }
        var view = new View({
            name: options.name,
            description: options.description,
            aggregation: options.aggregation,
            attributesProcessor: attributesProcessor
        });
        var instrument = new InstrumentSelector(selectorOptions === null || selectorOptions === void 0 ? void 0 : selectorOptions.instrument);
        var meter = new MeterSelector(selectorOptions === null || selectorOptions === void 0 ? void 0 : selectorOptions.meter);
        this._sharedState.viewRegistry.addView(view, instrument, meter);
    };
    /**
     * Flush all buffered data and shut down the MeterProvider and all registered
     * MetricReaders.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    MeterProvider.prototype.shutdown = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._shutdown) {
                            api.diag.warn('shutdown may only be called once per MeterProvider');
                            return [2 /*return*/];
                        }
                        this._shutdown = true;
                        return [4 /*yield*/, Promise.all(this._sharedState.metricCollectors.map(function (collector) {
                                return collector.shutdown(options);
                            }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Notifies all registered MetricReaders to flush any buffered data.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    MeterProvider.prototype.forceFlush = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // do not flush after shutdown
                        if (this._shutdown) {
                            api.diag.warn('invalid attempt to force flush after MeterProvider shutdown');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Promise.all(this._sharedState.metricCollectors.map(function (collector) {
                                return collector.forceFlush(options);
                            }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return MeterProvider;
}());
export { MeterProvider };
//# sourceMappingURL=MeterProvider.js.map