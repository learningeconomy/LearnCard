"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var random_1 = require("./random");
describe("randomBytes", function () {
    it("should generate random bytes", function () {
        var len = 64;
        var zeros = new Uint8Array(len);
        var a = random_1.randomBytes(len);
        var b = random_1.randomBytes(len);
        expect(a).not.toEqual(b);
        expect(a.length).toBe(len);
        expect(b.length).toBe(len);
        expect(a).not.toEqual(zeros);
        expect(b).not.toEqual(zeros);
    });
});
describe("randomUint32", function () {
    it("should generate random uint32", function () {
        // This test has some probabily of failure.
        expect(random_1.randomUint32()).not.toBe(random_1.randomUint32());
    });
});
describe("randomString", function () {
    it("should not produce biased strings", function () {
        var charset = "abcdefghijklmnopqrstuvwxyz";
        var s = '';
        var counts = {};
        for (var i = 0; i < 1000; i++) {
            s += random_1.randomString(1000, charset);
        }
        for (var i = 0; i < s.length; i++) {
            var c = s.charAt(i);
            counts[c] = (counts[c] || 0) + 1;
        }
        var avg = s.length / charset.length;
        var biases = [];
        Object.keys(counts).forEach(function (k) {
            var diff = counts[k] / avg;
            if (diff < 0.95 || diff > 1.05) {
                biases.push('Biased "' + k + '": average is ' + avg +
                    ", got " + counts[k]);
            }
        });
        expect(biases).toEqual([]);
    });
    it("should throw if given charset length < 2 ", function () {
        expect(function () { return random_1.randomString(10, "A"); }).toThrowError(/^randomString/);
    });
});
describe("randomStringForEntropy", function () {
    it("should return strings of correct length", function () {
        expect(random_1.randomStringForEntropy(128).length).toBe(22);
        expect(random_1.randomStringForEntropy(128, "0123456789").length).toBe(39);
    });
    it("should return unique strings", function () {
        expect(random_1.randomStringForEntropy(80)).not.toEqual(random_1.randomStringForEntropy(80));
    });
});
//# sourceMappingURL=random.test.js.map