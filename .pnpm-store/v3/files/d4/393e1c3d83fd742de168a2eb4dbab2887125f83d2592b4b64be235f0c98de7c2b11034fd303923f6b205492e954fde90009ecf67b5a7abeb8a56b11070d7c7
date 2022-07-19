"use strict";
// Copyright (C) 2019 Kyle Den Hartog
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var xchacha20_1 = require("@stablelib/xchacha20");
var chacha20poly1305_1 = require("@stablelib/chacha20poly1305");
var wipe_1 = require("@stablelib/wipe");
exports.KEY_LENGTH = 32;
exports.NONCE_LENGTH = 24;
exports.TAG_LENGTH = 16;
/**
 * XChaCha20-Poly1305 Authenticated Encryption with Associated Data.
 *
 * Defined in draft-irtf-cfrg-xchacha-01.
 * See https://tools.ietf.org/html/draft-irtf-cfrg-xchacha-01
 */
var XChaCha20Poly1305 = /** @class */ (function () {
    /**
     * Creates a new instance with the given 32-byte key.
     */
    function XChaCha20Poly1305(key) {
        this.nonceLength = exports.NONCE_LENGTH;
        this.tagLength = exports.TAG_LENGTH;
        if (key.length !== exports.KEY_LENGTH) {
            throw new Error("ChaCha20Poly1305 needs 32-byte key");
        }
        // Copy key.
        this._key = new Uint8Array(key);
    }
    /**
     * Encrypts and authenticates plaintext, authenticates associated data,
     * and returns sealed ciphertext, which includes authentication tag.
     *
     * draft-irtf-cfrg-xchacha-01 defines a 24 byte nonce (192 bits) which
     * uses the first 16 bytes of the nonce and the secret key with
     * HChaCha to generate an initial subkey. The last 8 bytes of the nonce
     * are then prefixed with 4 zero bytes and then provided with the subkey
     * to the ChaCha20Poly1305 implementation.
     *
     * If dst is given (it must be the size of plaintext + the size of tag
     * length) the result will be put into it. Dst and plaintext must not
     * overlap.
     */
    XChaCha20Poly1305.prototype.seal = function (nonce, plaintext, associatedData, dst) {
        if (nonce.length !== 24) {
            throw new Error("XChaCha20Poly1305: incorrect nonce length");
        }
        // Use HSalsa one-way function to transform first 16 bytes of
        // 24-byte extended nonce and key into a new key for Salsa
        // stream -- "subkey".
        var subKey = xchacha20_1.hchacha(this._key, nonce.subarray(0, 16), new Uint8Array(32));
        // Use last 8 bytes of 24-byte extended nonce as an actual nonce prefixed by 4 zero bytes,
        // and a subkey derived in the previous step as key to encrypt.
        var modifiedNonce = new Uint8Array(12);
        modifiedNonce.set(nonce.subarray(16), 4);
        var chaChaPoly = new chacha20poly1305_1.ChaCha20Poly1305(subKey);
        var result = chaChaPoly.seal(modifiedNonce, plaintext, associatedData, dst);
        wipe_1.wipe(subKey);
        wipe_1.wipe(modifiedNonce);
        chaChaPoly.clean();
        return result;
    };
    /**
     * Authenticates sealed ciphertext (which includes authentication tag) and
     * associated data, decrypts ciphertext and returns decrypted plaintext.
     *
     * draft-irtf-cfrg-xchacha-01 defines a 24 byte nonce (192 bits) which
     * then uses the first 16 bytes of the nonce and the secret key with
     * Hchacha to generate an initial subkey. The last 8 bytes of the nonce
     * are then prefixed with 4 zero bytes and then provided with the subkey
     * to the chacha20poly1305 implementation.
     *
     * If authentication fails, it returns null.
     *
     * If dst is given (it must be the size of plaintext + the size of tag
     * length) the result will be put into it. Dst and plaintext must not
     * overlap.
     */
    XChaCha20Poly1305.prototype.open = function (nonce, sealed, associatedData, dst) {
        if (nonce.length !== 24) {
            throw new Error("XChaCha20Poly1305: incorrect nonce length");
        }
        // Sealed ciphertext should at least contain tag.
        if (sealed.length < this.tagLength) {
            // TODO(dchest): should we throw here instead?
            return null;
        }
        /**
        * Generate subKey by using HChaCha20 function as defined
        * in section 2 step 1 of draft-irtf-cfrg-xchacha-01
        */
        var subKey = xchacha20_1.hchacha(this._key, nonce.subarray(0, 16), new Uint8Array(32));
        /**
        * Generate Nonce as defined - remaining 8 bytes of the nonce prefixed with
        * 4 zero bytes
        */
        var modifiedNonce = new Uint8Array(12);
        modifiedNonce.set(nonce.subarray(16), 4);
        /**
         * Authenticate and decrypt by calling into chacha20poly1305.
         */
        var chaChaPoly = new chacha20poly1305_1.ChaCha20Poly1305(subKey);
        var result = chaChaPoly.open(modifiedNonce, sealed, associatedData, dst);
        wipe_1.wipe(subKey);
        wipe_1.wipe(modifiedNonce);
        chaChaPoly.clean();
        return result;
    };
    XChaCha20Poly1305.prototype.clean = function () {
        wipe_1.wipe(this._key);
        return this;
    };
    return XChaCha20Poly1305;
}());
exports.XChaCha20Poly1305 = XChaCha20Poly1305;
//# sourceMappingURL=xchacha20poly1305.js.map