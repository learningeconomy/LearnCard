import crypto from 'crypto';
import { Buffer } from 'buffer';

export interface KeyPair {
    publicKey: string;
    privateKey: string;
}

/**
 * Creates a deterministic RSA key pair from a seed value
 */
export function generateDeterministicRSAKeyPair(seed: Uint8Array): KeyPair {
    // Create deterministic PRNG
    class DeterministicPRNG {
        private state: Buffer;

        constructor(seed: Uint8Array) {
            this.state = crypto.createHash('sha512').update(seed).digest();
        }

        getBytes(n: number): Buffer {
            let result = Buffer.alloc(0);
            while (result.length < n) {
                this.state = crypto.createHash('sha512').update(this.state).digest();
                result = Buffer.concat([result, this.state]);
            }
            return result.slice(0, n);
        }

        getRange(min: bigint, max: bigint): bigint {
            const range = max - min + 1n;
            const bitsNeeded = range.toString(2).length;
            const bytesNeeded = Math.ceil(bitsNeeded / 8);

            while (true) {
                const buf = this.getBytes(bytesNeeded);
                let num = BigInt('0x' + buf.toString('hex'));
                num = num % range;
                if (num <= range) {
                    return num + min;
                }
            }
        }
    }

    const prng = new DeterministicPRNG(seed);

    // Miller-Rabin primality test
    function isProbablePrime(n: bigint, k: number = 64): boolean {
        if (n <= 1n || n === 4n) return false;
        if (n <= 3n) return true;

        let d = n - 1n;
        let r = 0;
        while (d % 2n === 0n) {
            d /= 2n;
            r++;
        }

        for (let i = 0; i < k; i++) {
            const a = prng.getRange(2n, n - 2n);
            let x = modPow(a, d, n);

            if (x === 1n || x === n - 1n) continue;

            let continueLoop = false;
            for (let j = 0; j < r - 1; j++) {
                x = (x * x) % n;
                if (x === 1n) return false;
                if (x === n - 1n) {
                    continueLoop = true;
                    break;
                }
            }

            if (continueLoop) continue;
            return false;
        }
        return true;
    }

    function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
        if (modulus === 1n) return 0n;

        let result = 1n;
        base = base % modulus;

        while (exponent > 0n) {
            if (exponent % 2n === 1n) {
                result = (result * base) % modulus;
            }
            base = (base * base) % modulus;
            exponent = exponent / 2n;
        }
        return result;
    }

    function generatePrime(): bigint {
        while (true) {
            const num = BigInt('0x' + prng.getBytes(128).toString('hex')); // 1024 bits
            const candidate = num | 1n; // Ensure it's odd
            if (isProbablePrime(candidate)) {
                return candidate;
            }
        }
    }

    function modInverse(a: bigint, m: bigint): bigint {
        let [old_r, r] = [a, m];
        let [old_s, s] = [1n, 0n];
        let [old_t, t] = [0n, 1n];

        while (r !== 0n) {
            const quotient = old_r / r;
            [old_r, r] = [r, old_r - quotient * r];
            [old_s, s] = [s, old_s - quotient * s];
            [old_t, t] = [t, old_t - quotient * t];
        }

        return old_s < 0n ? old_s + m : old_s;
    }

    // Convert BigInt to Buffer with proper padding
    function bigIntToBuffer(num: bigint): Buffer {
        const hex = num.toString(16);
        const length = Math.ceil(hex.length / 2);
        return Buffer.from(hex.padStart(length * 2, '0'), 'hex');
    }

    // Generate key components
    const p = generatePrime();
    const q = generatePrime();
    const n = p * q;
    const e = 65537n;
    const phi = (p - 1n) * (q - 1n);
    const d = modInverse(e, phi);
    const dp = d % (p - 1n);
    const dq = d % (q - 1n);
    const qi = modInverse(q, p);

    // ASN.1 DER encoding functions
    function encodeLength(length: number): Buffer {
        if (length < 128) {
            return Buffer.from([length]);
        }
        const lengthBytes = [];
        while (length > 0) {
            lengthBytes.unshift(length & 0xff);
            length >>>= 8;
        }
        lengthBytes.unshift(0x80 | lengthBytes.length);
        return Buffer.from(lengthBytes);
    }

    function encodeInteger(buffer: Buffer): Buffer {
        const signByte = buffer[0]! & 0x80 ? Buffer.from([0x00]) : Buffer.alloc(0);
        return Buffer.concat([
            Buffer.from([0x02]),
            encodeLength(buffer.length + signByte.length),
            signByte,
            buffer,
        ]);
    }

    function encodeSequence(contents: Buffer): Buffer {
        return Buffer.concat([Buffer.from([0x30]), encodeLength(contents.length), contents]);
    }

    // Encode RSA private key
    const version = Buffer.from([0x02, 0x01, 0x00]);
    const algorithm = Buffer.from([
        0x30,
        0x0d, // SEQUENCE
        0x06,
        0x09, // OID
        0x2a,
        0x86,
        0x48,
        0x86,
        0xf7,
        0x0d,
        0x01,
        0x01,
        0x01, // rsaEncryption
        0x05,
        0x00, // NULL
    ]);

    const privateKeyIntegers = encodeSequence(
        Buffer.concat([
            version,
            encodeInteger(bigIntToBuffer(n)),
            encodeInteger(bigIntToBuffer(e)),
            encodeInteger(bigIntToBuffer(d)),
            encodeInteger(bigIntToBuffer(p)),
            encodeInteger(bigIntToBuffer(q)),
            encodeInteger(bigIntToBuffer(dp)),
            encodeInteger(bigIntToBuffer(dq)),
            encodeInteger(bigIntToBuffer(qi)),
        ])
    );

    const privateKeyWrapped = encodeSequence(
        Buffer.concat([
            version,
            algorithm,
            Buffer.from([0x04]), // OCTET STRING tag
            encodeLength(privateKeyIntegers.length),
            privateKeyIntegers,
        ])
    );

    const publicKeyIntegers = encodeSequence(
        Buffer.concat([encodeInteger(bigIntToBuffer(n)), encodeInteger(bigIntToBuffer(e))])
    );

    const publicKeyWrapped = encodeSequence(
        Buffer.concat([
            algorithm,
            Buffer.from([0x03]), // BIT STRING tag
            encodeLength(publicKeyIntegers.length + 1),
            Buffer.from([0x00]), // Leading zero for BIT STRING
            publicKeyIntegers,
        ])
    );

    // Convert to PEM format
    function derToPem(der: Buffer, type: string): string {
        const b64 = der.toString('base64');
        const lines = b64.match(/.{1,64}/g) || [];
        return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----\n`;
    }

    return {
        privateKey: derToPem(privateKeyWrapped, 'PRIVATE KEY'),
        publicKey: derToPem(publicKeyWrapped, 'PUBLIC KEY'),
    };
}
