"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var x25519_1 = require("./x25519");
var keyagreement_1 = require("./keyagreement");
var benchmark_1 = require("@stablelib/benchmark");
var r = new Uint8Array(32);
r[0] = 1;
benchmark_1.report("x25519.scalarMultBase", benchmark_1.benchmark(function () { return x25519_1.scalarMultBase(r); }));
var seed = benchmark_1.byteSeq(32);
var offerMsg = new keyagreement_1.X25519KeyAgreement(seed).offer();
var acceptMsg = new keyagreement_1.X25519KeyAgreement(seed).accept(offerMsg);
benchmark_1.report("X25519KeyAgreement offer/finish", benchmark_1.benchmark(function () {
    var state = new keyagreement_1.X25519KeyAgreement(seed);
    state.offer();
    state.finish(acceptMsg);
}));
benchmark_1.report("X25519KeyAgreement accept", benchmark_1.benchmark(function () {
    return new keyagreement_1.X25519KeyAgreement(seed).accept(offerMsg);
}));
//# sourceMappingURL=x25519.bench.js.map