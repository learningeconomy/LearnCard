"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var ed25519_1 = require("./ed25519");
var benchmark_1 = require("@stablelib/benchmark");
var k = ed25519_1.generateKeyPair();
var buf = new Uint8Array(256);
var seed = k.secretKey.subarray(0, 32);
var sig = ed25519_1.sign(k.secretKey, buf);
var badsig = new Uint8Array(sig);
badsig[0] = 1;
benchmark_1.report("ed25519.generateKeyPairFromSeed", benchmark_1.benchmark(function () { return ed25519_1.generateKeyPairFromSeed(seed); }));
benchmark_1.report("ed25519.sign", benchmark_1.benchmark(function () { return ed25519_1.sign(k.secretKey, buf); }));
benchmark_1.report("ed25519.verify", benchmark_1.benchmark(function () { return ed25519_1.verify(k.publicKey, buf, sig); }));
benchmark_1.report("ed25519.verify (bad)", benchmark_1.benchmark(function () { return ed25519_1.verify(k.publicKey, buf, badsig); }));
//# sourceMappingURL=ed25519.bench.js.map