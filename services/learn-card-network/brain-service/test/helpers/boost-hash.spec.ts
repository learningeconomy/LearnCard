import { describe, expect, it } from 'vitest';

import { computeBoostTemplateHash, verifyBoostTemplateHash } from '../../src/helpers/boost-hash.helpers';

describe('boost template hashing', () => {
    const boostTemplate = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'BoostCredential'],
        credentialSubject: {
            achievement: {
                name: 'Foundations of Web Development',
            },
        },
    };

    it('computes a deterministic SHA-256 hash for a boost template', () => {
        const firstHash = computeBoostTemplateHash(boostTemplate);
        const secondHash = computeBoostTemplateHash({ ...boostTemplate });

        expect(firstHash).toBe(secondHash);
        expect(
            verifyBoostTemplateHash({ boostTemplateHash: firstHash }, boostTemplate)
        ).toBe(true);
    });

    it('returns a 64-character hex hash', () => {
        const hash = computeBoostTemplateHash(boostTemplate);

        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('returns different hashes for different templates', () => {
        const firstHash = computeBoostTemplateHash(boostTemplate);
        const secondHash = computeBoostTemplateHash({
            ...boostTemplate,
            credentialSubject: {
                achievement: {
                    name: 'Advanced Web Development',
                },
            },
        });

        expect(firstHash).not.toBe(secondHash);
        expect(
            verifyBoostTemplateHash({ boostTemplateHash: firstHash }, boostTemplate)
        ).toBe(true);
        expect(
            verifyBoostTemplateHash(
                { boostTemplateHash: firstHash },
                {
                    ...boostTemplate,
                    credentialSubject: {
                        achievement: {
                            name: 'Advanced Web Development',
                        },
                    },
                }
            )
        ).toBe(false);
    });
});
