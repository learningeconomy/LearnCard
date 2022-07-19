"use strict";
// Copyright (C) 2020 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var random_1 = require("@stablelib/random");
var wipe_1 = require("@stablelib/wipe");
var x25519_1 = require("./x25519");
/** Constants for key agreement */
exports.OFFER_MESSAGE_LENGTH = x25519_1.PUBLIC_KEY_LENGTH;
exports.ACCEPT_MESSAGE_LENGTH = x25519_1.PUBLIC_KEY_LENGTH;
exports.SAVED_STATE_LENGTH = x25519_1.SECRET_KEY_LENGTH;
exports.SECRET_SEED_LENGTH = x25519_1.SECRET_KEY_LENGTH;
/**
 * X25519 key agreement using ephemeral key pairs.
 *
 * Note that unless this key agreement is combined with an authentication
 * method, such as public key signatures, it's vulnerable to man-in-the-middle
 * attacks.
 */
var X25519KeyAgreement = /** @class */ (function () {
    function X25519KeyAgreement(secretSeed, prng) {
        this.offerMessageLength = exports.OFFER_MESSAGE_LENGTH;
        this.acceptMessageLength = exports.ACCEPT_MESSAGE_LENGTH;
        this.sharedKeyLength = x25519_1.SHARED_KEY_LENGTH;
        this.savedStateLength = exports.SAVED_STATE_LENGTH;
        this._offered = false;
        this._secretKey = secretSeed || random_1.randomBytes(x25519_1.SECRET_KEY_LENGTH, prng);
    }
    X25519KeyAgreement.prototype.saveState = function () {
        return new Uint8Array(this._secretKey);
    };
    X25519KeyAgreement.prototype.restoreState = function (savedState) {
        this._secretKey = new Uint8Array(savedState);
        return this;
    };
    X25519KeyAgreement.prototype.clean = function () {
        if (this._secretKey) {
            wipe_1.wipe(this._secretKey);
        }
        if (this._sharedKey) {
            wipe_1.wipe(this._sharedKey);
        }
    };
    X25519KeyAgreement.prototype.offer = function () {
        this._offered = true;
        var keyPair = x25519_1.generateKeyPairFromSeed(this._secretKey);
        return keyPair.publicKey;
    };
    X25519KeyAgreement.prototype.accept = function (offerMsg) {
        if (this._offered) {
            throw new Error("X25519KeyAgreement: accept shouldn't be called by offering party");
        }
        if (offerMsg.length !== this.offerMessageLength) {
            throw new Error("X25519KeyAgreement: incorrect offer message length");
        }
        var keyPair = x25519_1.generateKeyPairFromSeed(this._secretKey);
        this._sharedKey = x25519_1.sharedKey(keyPair.secretKey, offerMsg);
        wipe_1.wipe(keyPair.secretKey);
        return keyPair.publicKey;
    };
    X25519KeyAgreement.prototype.finish = function (acceptMsg) {
        if (acceptMsg.length !== this.acceptMessageLength) {
            throw new Error("X25519KeyAgreement: incorrect accept message length");
        }
        if (!this._secretKey) {
            throw new Error("X25519KeyAgreement: no offer state");
        }
        if (this._sharedKey) {
            throw new Error("X25519KeyAgreement: finish was already called");
        }
        this._sharedKey = x25519_1.sharedKey(this._secretKey, acceptMsg);
        return this;
    };
    X25519KeyAgreement.prototype.getSharedKey = function () {
        if (!this._sharedKey) {
            throw new Error("X25519KeyAgreement: no shared key established");
        }
        return new Uint8Array(this._sharedKey);
    };
    return X25519KeyAgreement;
}());
exports.X25519KeyAgreement = X25519KeyAgreement;
//# sourceMappingURL=keyagreement.js.map