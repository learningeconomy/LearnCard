"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var hex_1 = require("@stablelib/hex");
var x25519_1 = require("./x25519");
var keyagreement_1 = require("./keyagreement");
describe("x25519.scalarMultBase", function () {
    it("should return correct result", function () {
        // This takes takes a bit of time.
        // Similar to https://code.google.com/p/go/source/browse/curve25519/curve25519_test.go?repo=crypto
        var golden = hex_1.decode("89161fde887b2b53de549af483940106ecc114d6982daa98256de23bdf77661a");
        var input = new Uint8Array(32);
        input[0] = 1;
        for (var i = 0; i < 200; i++) {
            input = x25519_1.scalarMultBase(input);
        }
        expect(input).toEqual(golden);
    });
    it("should calculate shared key", function () {
        var k0 = x25519_1.generateKeyPair();
        var k1 = x25519_1.generateKeyPair();
        var s0 = x25519_1.sharedKey(k0.secretKey, k1.publicKey);
        var s1 = x25519_1.sharedKey(k1.secretKey, k0.publicKey);
        expect(s0).toEqual(s1);
    });
    it("should throw if shared key is all-zero and rejectZero = true", function () {
        var k = x25519_1.generateKeyPair();
        var z = new Uint8Array(32);
        expect(function () { return x25519_1.sharedKey(k.secretKey, z, true); }).toThrowError(/invalid/);
    });
    it("should not throw if shared key is all-zero and rejectZero = false", function () {
        var k = x25519_1.generateKeyPair();
        var z = new Uint8Array(32);
        expect(x25519_1.sharedKey(k.secretKey, z)).toBeTruthy();
    });
});
// For testing with generated test vectors, instead of proper PRNG
// use the same deterministic generator that generates byte sequences
// of 0, 1, 2, 3, ... that was used to create vectors.
//
// Note: in the original implementation to generate test vectors
// poly.c, crypto_stream_chacha20 needs to be replaced with randombytes,
// and randombytes must generate the same sequence as this. It also
// needs to be reset to 0 for server part of handshake and 64 for
// client part, like in the test below.
var BadSource = /** @class */ (function () {
    function BadSource(v) {
        if (v === void 0) { v = 0; }
        this.v = v;
        this.isAvailable = true;
    }
    BadSource.prototype.randomBytes = function (length) {
        var out = new Uint8Array(length);
        for (var i = 0; i < out.length; i++) {
            out[i] = this.v;
            this.v = (this.v + 1) & 0xff;
        }
        return out;
    };
    return BadSource;
}());
var testVector = {
    offerMsg: "8F40C5ADB68F25624AE5B214EA767A6EC94D829D3D7B5E1AD1BA6F3E2138285F",
    acceptMsg: "79A631EEDE1BF9C98F12032CDEADD0E7A079398FC786B88CC846EC89AF85A51A",
    sharedKey: "6D54CC9C397E31691401110F58DA1E182A635D7E44C21DC2D7BE93624652AB15"
};
describe("X25518KeyAgreement", function () {
    it("should establish shared key", function () {
        for (var i = 0; i < 5; i++) {
            var server = new keyagreement_1.X25519KeyAgreement();
            var offerMsg = server.offer();
            // console.log("offerMsg:", encode(offerMsg));
            var client = new keyagreement_1.X25519KeyAgreement();
            var acceptMsg = client.accept(offerMsg);
            // console.log("acceptMsg:", encode(acceptMsg));
            server.finish(acceptMsg);
            var serverKey = server.getSharedKey();
            var clientKey = client.getSharedKey();
            // console.log("serverKey:", encode(serverKey));
            // console.log("clientKey:", encode(clientKey));
            expect(hex_1.encode(serverKey)).toEqual(hex_1.encode(clientKey));
        }
    });
    it("should match test vector", function () {
        var serverPrng = new BadSource(0);
        var server = new keyagreement_1.X25519KeyAgreement(undefined, serverPrng);
        var offerMsg = server.offer();
        expect("offerMsg: " + hex_1.encode(offerMsg))
            .toEqual("offerMsg: " + testVector.offerMsg);
        var clientPrng = new BadSource(64);
        var client = new keyagreement_1.X25519KeyAgreement(undefined, clientPrng);
        var acceptMsg = client.accept(offerMsg);
        expect("acceptMsg: " + hex_1.encode(acceptMsg))
            .toEqual("acceptMsg: " + testVector.acceptMsg);
        server.finish(acceptMsg);
        expect(hex_1.encode(server.getSharedKey())).toEqual(testVector.sharedKey);
        expect(hex_1.encode(client.getSharedKey())).toEqual(testVector.sharedKey);
    });
});
//# sourceMappingURL=x25519.test.js.map