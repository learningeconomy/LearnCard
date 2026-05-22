type VerifyBoostDerivationResult = { verified: boolean; reason?: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const normalizeTypeList = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];

    if (!Array.isArray(value)) return [];

    return value.filter((item): item is string => typeof item === 'string');
};

const rightRotate = (value: number, amount: number): number => {
    return (value >>> amount) | (value << (32 - amount));
};

const sha256 = (input: string): string => {
    const maxWord = 2 ** 32;
    const ascii = new TextEncoder().encode(input);
    const words: number[] = [];
    const bitLength = ascii.length * 8;
    const hash = [
        0x6a09e667,
        0xbb67ae85,
        0x3c6ef372,
        0xa54ff53a,
        0x510e527f,
        0x9b05688c,
        0x1f83d9ab,
        0x5be0cd19,
    ];
    const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
        0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
        0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
        0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
        0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    for (let index = 0; index < ascii.length; index++) {
        words[index >> 2] ??= 0;
        words[index >> 2] |= ascii[index]! << (24 - (index % 4) * 8);
    }

    words[ascii.length >> 2] ??= 0;
    words[ascii.length >> 2] |= 0x80 << (24 - (ascii.length % 4) * 8);
    words[(((ascii.length + 8) >> 6) + 1) * 16 - 1] = bitLength;

    for (let blockStart = 0; blockStart < words.length; blockStart += 16) {
        const schedule = words.slice(blockStart, blockStart + 16);

        for (let index = 16; index < 64; index++) {
            const s0 =
                rightRotate(schedule[index - 15]!, 7) ^
                rightRotate(schedule[index - 15]!, 18) ^
                (schedule[index - 15]! >>> 3);
            const s1 =
                rightRotate(schedule[index - 2]!, 17) ^
                rightRotate(schedule[index - 2]!, 19) ^
                (schedule[index - 2]! >>> 10);

            schedule[index] =
                (((schedule[index - 16]! + s0) % maxWord) + schedule[index - 7]! + s1) % maxWord;
        }

        let [a, b, c, d, e, f, g, h] = hash;

        for (let index = 0; index < 64; index++) {
            const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (((((h + s1) % maxWord) + ch) % maxWord) + k[index]! + schedule[index]!) % maxWord;
            const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (s0 + maj) % maxWord;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) % maxWord;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) % maxWord;
        }

        hash[0] = (hash[0]! + a) % maxWord;
        hash[1] = (hash[1]! + b) % maxWord;
        hash[2] = (hash[2]! + c) % maxWord;
        hash[3] = (hash[3]! + d) % maxWord;
        hash[4] = (hash[4]! + e) % maxWord;
        hash[5] = (hash[5]! + f) % maxWord;
        hash[6] = (hash[6]! + g) % maxWord;
        hash[7] = (hash[7]! + h) % maxWord;
    }

    return hash.map(value => value.toString(16).padStart(8, '0')).join('');
};

const computeBoostTemplateHash = (boostTemplate: Record<string, unknown>): string => {
    return sha256(JSON.stringify(boostTemplate));
};

export const verifyBoostDerivation = (
    credential: Record<string, unknown>,
    boostTemplate: Record<string, unknown>,
    boostUri: string
): VerifyBoostDerivationResult => {
    if (!isRecord(credential)) return { verified: false, reason: 'Credential must be an object' };
    if (!isRecord(boostTemplate)) return { verified: false, reason: 'Boost template must be an object' };
    if (!boostUri) return { verified: false, reason: 'Boost URI is required' };

    if (credential.boostId !== boostUri) {
        return { verified: false, reason: 'Credential boostId does not match the boost URI' };
    }

    const credentialTypes = normalizeTypeList(credential.type);
    const boostTemplateTypes = normalizeTypeList(boostTemplate.type);

    if (credentialTypes.length === 0 || boostTemplateTypes.length === 0) {
        return { verified: false, reason: 'Credential and boost template must both include type values' };
    }

    const missingTypes = boostTemplateTypes.filter(type => !credentialTypes.includes(type));

    if (missingTypes.length > 0) {
        return {
            verified: false,
            reason: `Credential is missing boost template types: ${missingTypes.join(', ')}`,
        };
    }

    if (credential.boostTemplateHash !== undefined) {
        if (typeof credential.boostTemplateHash !== 'string') {
            return { verified: false, reason: 'Credential boostTemplateHash must be a string' };
        }

        const expectedHash = computeBoostTemplateHash(boostTemplate);

        if (credential.boostTemplateHash !== expectedHash) {
            return { verified: false, reason: 'Credential boostTemplateHash does not match the boost template' };
        }
    }

    return { verified: true };
};
