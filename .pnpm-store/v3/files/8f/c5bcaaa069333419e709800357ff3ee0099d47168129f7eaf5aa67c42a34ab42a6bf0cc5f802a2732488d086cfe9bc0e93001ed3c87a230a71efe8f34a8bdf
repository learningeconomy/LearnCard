"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var wipe_1 = require("@stablelib/wipe");
var NodeRandomSource = /** @class */ (function () {
    function NodeRandomSource() {
        this.isAvailable = false;
        this.isInstantiated = false;
        if (typeof require !== "undefined") {
            var nodeCrypto = require("crypto");
            if (nodeCrypto && nodeCrypto.randomBytes) {
                this._crypto = nodeCrypto;
                this.isAvailable = true;
                this.isInstantiated = true;
            }
        }
    }
    NodeRandomSource.prototype.randomBytes = function (length) {
        if (!this.isAvailable || !this._crypto) {
            throw new Error("Node.js random byte generator is not available.");
        }
        // Get random bytes (result is Buffer).
        var buffer = this._crypto.randomBytes(length);
        // Make sure we got the length that we requested.
        if (buffer.length !== length) {
            throw new Error("NodeRandomSource: got fewer bytes than requested");
        }
        // Allocate output array.
        var out = new Uint8Array(length);
        // Copy bytes from buffer to output.
        for (var i = 0; i < out.length; i++) {
            out[i] = buffer[i];
        }
        // Cleanup.
        wipe_1.wipe(buffer);
        return out;
    };
    return NodeRandomSource;
}());
exports.NodeRandomSource = NodeRandomSource;
//# sourceMappingURL=node.js.map