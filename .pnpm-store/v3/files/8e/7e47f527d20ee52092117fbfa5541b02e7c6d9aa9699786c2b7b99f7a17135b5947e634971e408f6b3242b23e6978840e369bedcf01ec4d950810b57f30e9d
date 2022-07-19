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
exports.ViewRegistry = void 0;
const InstrumentSelector_1 = require("./InstrumentSelector");
const MeterSelector_1 = require("./MeterSelector");
const View_1 = require("./View");
class ViewRegistry {
    constructor() {
        this._registeredViews = [];
    }
    addView(view, instrumentSelector = new InstrumentSelector_1.InstrumentSelector(), meterSelector = new MeterSelector_1.MeterSelector()) {
        this._registeredViews.push({
            instrumentSelector,
            meterSelector,
            view,
        });
    }
    findViews(instrument, meter) {
        const views = this._registeredViews
            .filter(registeredView => {
            return this._matchInstrument(registeredView.instrumentSelector, instrument) &&
                this._matchMeter(registeredView.meterSelector, meter);
        })
            .map(it => it.view);
        if (views.length === 0) {
            return [ViewRegistry.DEFAULT_VIEW];
        }
        return views;
    }
    _matchInstrument(selector, instrument) {
        return (selector.getType() === undefined || instrument.type === selector.getType()) &&
            selector.getNameFilter().match(instrument.name);
    }
    _matchMeter(selector, meter) {
        return selector.getNameFilter().match(meter.name) &&
            (meter.version === undefined || selector.getVersionFilter().match(meter.version)) &&
            (meter.schemaUrl === undefined || selector.getSchemaUrlFilter().match(meter.schemaUrl));
    }
}
exports.ViewRegistry = ViewRegistry;
ViewRegistry.DEFAULT_VIEW = new View_1.View();
//# sourceMappingURL=ViewRegistry.js.map