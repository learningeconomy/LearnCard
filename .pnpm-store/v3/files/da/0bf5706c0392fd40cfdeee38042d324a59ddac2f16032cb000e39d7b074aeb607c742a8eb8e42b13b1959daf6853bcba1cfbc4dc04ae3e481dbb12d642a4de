"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var system_1 = require("./source/system");
var binary_1 = require("@stablelib/binary");
var wipe_1 = require("@stablelib/wipe");
exports.defaultRandomSource = new system_1.SystemRandomSource();
function randomBytes(length, prng) {
    if (prng === void 0) { prng = exports.defaultRandomSource; }
    return prng.randomBytes(length);
}
exports.randomBytes = randomBytes;
/**
 * Returns a uniformly random unsigned 32-bit integer.
 */
function randomUint32(prng) {
    if (prng === void 0) { prng = exports.defaultRandomSource; }
    // Generate 4-byte random buffer.
    var buf = randomBytes(4, prng);
    // Convert bytes from buffer into a 32-bit integer.
    // It's not important which byte order to use, since
    // the result is random.
    var result = binary_1.readUint32LE(buf);
    // Clean the buffer.
    wipe_1.wipe(buf);
    return result;
}
exports.randomUint32 = randomUint32;
/** 62 alphanumeric characters for default charset of randomString() */
var ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
/**
 * Returns a uniform random string of the given length
 * with characters from the given charset.
 *
 * Charset must not have more than 256 characters.
 *
 * Default charset generates case-sensitive alphanumeric
 * strings (0-9, A-Z, a-z).
 */
function randomString(length, charset, prng) {
    if (charset === void 0) { charset = ALPHANUMERIC; }
    if (prng === void 0) { prng = exports.defaultRandomSource; }
    if (charset.length < 2) {
        throw new Error("randomString charset is too short");
    }
    if (charset.length > 256) {
        throw new Error("randomString charset is too long");
    }
    var out = '';
    var charsLen = charset.length;
    var maxByte = 256 - (256 % charsLen);
    while (length > 0) {
        var buf = randomBytes(Math.ceil(length * 256 / maxByte), prng);
        for (var i = 0; i < buf.length && length > 0; i++) {
            var randomByte = buf[i];
            if (randomByte < maxByte) {
                out += charset.charAt(randomByte % charsLen);
                length--;
            }
        }
        wipe_1.wipe(buf);
    }
    return out;
}
exports.randomString = randomString;
/**
 * Returns uniform random string containing at least the given
 * number of bits of entropy.
 *
 * For example, randomStringForEntropy(128) will return a 22-character
 * alphanumeric string, while randomStringForEntropy(128, "0123456789")
 * will return a 39-character numeric string, both will contain at
 * least 128 bits of entropy.
 *
 * Default charset generates case-sensitive alphanumeric
 * strings (0-9, A-Z, a-z).
 */
function randomStringForEntropy(bits, charset, prng) {
    if (charset === void 0) { charset = ALPHANUMERIC; }
    if (prng === void 0) { prng = exports.defaultRandomSource; }
    var length = Math.ceil(bits / (Math.log(charset.length) / Math.LN2));
    return randomString(length, charset, prng);
}
exports.randomStringForEntropy = randomStringForEntropy;
//# sourceMappingURL=random.js.map