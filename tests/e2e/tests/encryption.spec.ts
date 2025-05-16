import { describe, test, expect } from 'vitest';

import { toUint8Array } from 'hex-lite';

import { getLearnCardForUser, LearnCard } from './helpers/learncard.helpers';

let a: LearnCard;
let b: LearnCard;

// Helper function to check if a value is a plain object
const isPlainObject = (value: unknown): value is Record<string, any> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Helper function to recursively check for BigInt values
const containsBigInt = (value: unknown): boolean => {
    if (typeof value === 'bigint') return true;
    if (Array.isArray(value)) return value.some(containsBigInt);
    if (isPlainObject(value)) return Object.values(value).some(containsBigInt);
    return false;
};

describe('Encryption', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('Users can encrypt and decrypt VCs', async () => {
        const vc = await a.invoke.issueCredential(a.invoke.getTestVc(b.id.did()));
        const jwe = await a.invoke.createDagJwe(vc, [b.id.did()]);

        expect(await b.invoke.decryptDagJwe(jwe)).toEqual(vc);
        expect(await a.invoke.decryptDagJwe(jwe)).toEqual(vc);
    });

    test('Custom decryption JWK', async () => {
        const customJwk = a.invoke.generateEd25519KeyFromBytes(toUint8Array('0'.repeat(64)));
        const customDidKey = a.invoke.keyToDid('key', customJwk);
        const customDidDoc = await a.invoke.resolveDid(customDidKey);

        await a.invoke.addDidMetadata({
            verificationMethod: customDidDoc.verificationMethod,
            keyAgreement: customDidDoc.keyAgreement,
        });

        const vc = await a.invoke.issueCredential(a.invoke.getTestVc(b.id.did()));
        const jwe = await a.invoke.createDagJwe(vc);

        expect(await a.invoke.decryptDagJwe(jwe)).toEqual(vc);
        expect(await b.invoke.decryptDagJwe(jwe, [customJwk])).toEqual(vc);
    });

    describe('Number Preservation', () => {
        test('should preserve numbers in simple objects', async () => {
            const testData = {
                id: 'test-1',
                count: 42,
                isActive: true,
                score: 3.14
            };

            const jwe = await a.invoke.createDagJwe(testData, [b.id.did()]);
            const decrypted = await b.invoke.decryptDagJwe(jwe);

            // Verify the decrypted data matches the original
            expect(decrypted).toEqual(testData);
            
            // Verify no BigInts are present
            expect(containsBigInt(decrypted)).toBe(false);
        });

        test('should preserve numbers in nested objects and arrays', async () => {
            const testData = {
                id: 'test-2',
                metadata: {
                    version: 1,
                    timestamps: [
                        { id: 'ts1', value: 1625097600000 },
                        { id: 'ts2', value: 1625184000000 }
                    ]
                },
                scores: [1, 2, 3, 4, 5],
                stats: {
                    total: 1000,
                    average: 25.5,
                    distribution: {
                        '0-10': 10,
                        '11-20': 20,
                        '21-30': 30
                    }
                }
            };

            const jwe = await a.invoke.createDagJwe(testData, [b.id.did()]);
            const decrypted = await b.invoke.decryptDagJwe(jwe);

            // Verify the decrypted data matches the original
            expect(decrypted).toEqual(testData);
            
            // Verify no BigInts are present
            expect(containsBigInt(decrypted)).toBe(false);
        });

        test('should handle large numbers correctly', async () => {
            // Test with numbers that are close to Number.MAX_SAFE_INTEGER
            const testData = {
                id: 'test-3',
                largeNumber: Number.MAX_SAFE_INTEGER - 1000,
                negativeLargeNumber: Number.MIN_SAFE_INTEGER + 1000,
                scientificNotation: 1.23e20,
                smallDecimal: 0.0000001
            };

            const jwe = await a.invoke.createDagJwe(testData, [b.id.did()]);
            const decrypted = await b.invoke.decryptDagJwe(jwe);

            // Verify the decrypted data matches the original
            expect(decrypted).toEqual(testData);
            
            // Verify no BigInts are present
            expect(containsBigInt(decrypted)).toBe(false);
        });

        test('should handle arrays of numbers', async () => {
            const testData = {
                id: 'test-4',
                numbers: [
                    0,
                    1,
                    -1,
                    3.14159,
                    Number.MAX_SAFE_INTEGER,
                    Number.MIN_SAFE_INTEGER
                ]
            };


            const jwe = await a.invoke.createDagJwe(testData, [b.id.did()]);
            const decrypted = await b.invoke.decryptDagJwe(jwe);

            // Verify the decrypted data matches the original
            expect(decrypted).toEqual(testData);
            
            // Verify no BigInts are present
            expect(containsBigInt(decrypted)).toBe(false);
        });
    });
});
