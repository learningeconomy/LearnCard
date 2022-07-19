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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { createInstrumentDescriptorWithView } from '../InstrumentDescriptor';
import { MetricStorage } from './MetricStorage';
import { DeltaMetricProcessor } from './DeltaMetricProcessor';
import { TemporalMetricProcessor } from './TemporalMetricProcessor';
import { ObservableResult } from '../ObservableResult';
import { AttributeHashMap } from './HashMap';
/**
 * Internal interface.
 *
 * Stores and aggregates {@link MetricData} for asynchronous instruments.
 */
var AsyncMetricStorage = /** @class */ (function (_super) {
    __extends(AsyncMetricStorage, _super);
    function AsyncMetricStorage(_instrumentDescriptor, aggregator, _attributesProcessor, _callback) {
        var _this = _super.call(this, _instrumentDescriptor) || this;
        _this._attributesProcessor = _attributesProcessor;
        _this._callback = _callback;
        _this._deltaMetricStorage = new DeltaMetricProcessor(aggregator);
        _this._temporalMetricStorage = new TemporalMetricProcessor(aggregator);
        return _this;
    }
    AsyncMetricStorage.prototype._record = function (measurements) {
        var _this = this;
        var processed = new AttributeHashMap();
        Array.from(measurements.entries()).forEach(function (_a) {
            var _b = __read(_a, 2), attributes = _b[0], value = _b[1];
            processed.set(_this._attributesProcessor.process(attributes), value);
        });
        this._deltaMetricStorage.batchCumulate(processed);
    };
    /**
     * Collects the metrics from this storage. The ObservableCallback is invoked
     * during the collection.
     *
     * Note: This is a stateful operation and may reset any interval-related
     * state for the MetricCollector.
     */
    AsyncMetricStorage.prototype.collect = function (collector, collectors, sdkStartTime, collectionTime) {
        return __awaiter(this, void 0, void 0, function () {
            var observableResult, accumulations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        observableResult = new ObservableResult();
                        // TODO: timeout with callback
                        return [4 /*yield*/, this._callback(observableResult)];
                    case 1:
                        // TODO: timeout with callback
                        _a.sent();
                        this._record(observableResult.buffer);
                        accumulations = this._deltaMetricStorage.collect();
                        return [2 /*return*/, this._temporalMetricStorage.buildMetrics(collector, collectors, this._instrumentDescriptor, accumulations, sdkStartTime, collectionTime)];
                }
            });
        });
    };
    AsyncMetricStorage.create = function (view, instrument, callback) {
        instrument = createInstrumentDescriptorWithView(view, instrument);
        var aggregator = view.aggregation.createAggregator(instrument);
        return new AsyncMetricStorage(instrument, aggregator, view.attributesProcessor, callback);
    };
    return AsyncMetricStorage;
}(MetricStorage));
export { AsyncMetricStorage };
//# sourceMappingURL=AsyncMetricStorage.js.map