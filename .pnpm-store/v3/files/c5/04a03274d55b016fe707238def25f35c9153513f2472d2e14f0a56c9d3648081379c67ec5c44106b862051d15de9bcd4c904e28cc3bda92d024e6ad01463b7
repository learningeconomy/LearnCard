"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var system_1 = require("./system");
describe("SystemRandomSource.randomBytes", function () {
    var source = new system_1.SystemRandomSource();
    it("should generate random bytes", function () {
        var len = 64;
        var zeros = new Uint8Array(len);
        var a = source.randomBytes(len);
        var b = source.randomBytes(len);
        expect(a.length).toBe(len);
        expect(b.length).toBe(len);
        expect(a).not.toEqual(b);
        expect(a).not.toEqual(zeros);
        expect(b).not.toEqual(zeros);
    });
});
//# sourceMappingURL=system.test.js.map