"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var QUOTA = 65536;
var BrowserRandomSource = /** @class */ (function () {
    function BrowserRandomSource() {
        this.isAvailable = false;
        this.isInstantiated = false;
        var browserCrypto = typeof self !== 'undefined'
            ? (self.crypto || self.msCrypto) // IE11 has msCrypto
            : null;
        if (browserCrypto && browserCrypto.getRandomValues) {
            this._crypto = browserCrypto;
            this.isAvailable = true;
            this.isInstantiated = true;
        }
    }
    BrowserRandomSource.prototype.randomBytes = function (length) {
        if (!this.isAvailable || !this._crypto) {
            throw new Error("Browser random byte generator is not available.");
        }
        var out = new Uint8Array(length);
        for (var i = 0; i < out.length; i += QUOTA) {
            this._crypto.getRandomValues(out.subarray(i, i + Math.min(out.length - i, QUOTA)));
        }
        return out;
    };
    return BrowserRandomSource;
}());
exports.BrowserRandomSource = BrowserRandomSource;
//# sourceMappingURL=browser.js.map