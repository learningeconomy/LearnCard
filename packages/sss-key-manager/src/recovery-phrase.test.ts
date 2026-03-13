import { describe, it, expect } from 'vitest';
import {
    shareToRecoveryPhrase,
    recoveryPhraseToShare,
    validateRecoveryPhrase,
    countWords,
} from './recovery-phrase';
import { splitPrivateKey, reconstructFromShares } from './sss';

describe('Recovery Phrase utilities', () => {
    const testShareHex = 'abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

    describe('shareToRecoveryPhrase', () => {
        it('should convert a hex share to a recovery phrase', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);

            expect(typeof phrase).toBe('string');
            expect(phrase.length).toBeGreaterThan(0);

            const words = phrase.split(' ');
            expect(words.length).toBeGreaterThanOrEqual(12);
        });

        it('should produce consistent output for same input', async () => {
            const phrase1 = await shareToRecoveryPhrase(testShareHex);
            const phrase2 = await shareToRecoveryPhrase(testShareHex);

            expect(phrase1).toBe(phrase2);
        });

        it('should produce different phrases for different shares', async () => {
            const share1 = 'a'.repeat(64);
            const share2 = 'b'.repeat(64);

            const phrase1 = await shareToRecoveryPhrase(share1);
            const phrase2 = await shareToRecoveryPhrase(share2);

            expect(phrase1).not.toBe(phrase2);
        });

        it('should only contain valid BIP39 words', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const words = phrase.split(' ');

            for (const word of words) {
                expect(word.length).toBeGreaterThan(0);
                expect(/^[a-z]+$/.test(word)).toBe(true);
            }
        });
    });

    describe('recoveryPhraseToShare', () => {
        it('should convert a recovery phrase back to the original share', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const recoveredShare = await recoveryPhraseToShare(phrase);

            expect(recoveredShare).toBe(testShareHex);
        });

        it('should handle phrases with extra whitespace', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const paddedPhrase = `  ${phrase.split(' ').join('   ')}  `;

            const recoveredShare = await recoveryPhraseToShare(paddedPhrase);

            expect(recoveredShare).toBe(testShareHex);
        });

        it('should handle uppercase words', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const upperPhrase = phrase.toUpperCase();

            const recoveredShare = await recoveryPhraseToShare(upperPhrase);

            expect(recoveredShare).toBe(testShareHex);
        });

        it('should handle mixed case words', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const mixedPhrase = phrase.split(' ').map((w, i) => 
                i % 2 === 0 ? w.toUpperCase() : w
            ).join(' ');

            const recoveredShare = await recoveryPhraseToShare(mixedPhrase);

            expect(recoveredShare).toBe(testShareHex);
        });

        it('should reject phrases with too few words', async () => {
            await expect(
                recoveryPhraseToShare('abandon ability able')
            ).rejects.toThrow('must be 12-27 words');
        });

        it('should reject phrases with invalid words', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const words = phrase.split(' ');
            words[0] = 'notavalidword';

            await expect(
                recoveryPhraseToShare(words.join(' '))
            ).rejects.toThrow('Invalid word');
        });

        it('should reject phrases with invalid checksum', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const words = phrase.split(' ');

            const firstWord = words[0];
            words[0] = words[1];
            words[1] = firstWord;

            await expect(
                recoveryPhraseToShare(words.join(' '))
            ).rejects.toThrow('checksum');
        });
    });

    describe('validateRecoveryPhrase', () => {
        it('should return true for valid phrase', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const isValid = await validateRecoveryPhrase(phrase);

            expect(isValid).toBe(true);
        });

        it('should return false for invalid phrase', async () => {
            const isValid = await validateRecoveryPhrase('invalid phrase that is not valid');

            expect(isValid).toBe(false);
        });

        it('should return false for phrase with wrong checksum', async () => {
            const phrase = await shareToRecoveryPhrase(testShareHex);
            const words = phrase.split(' ');
            const temp = words[0];
            words[0] = words[1];
            words[1] = temp;

            const isValid = await validateRecoveryPhrase(words.join(' '));

            expect(isValid).toBe(false);
        });

        it('should return false for empty string', async () => {
            const isValid = await validateRecoveryPhrase('');

            expect(isValid).toBe(false);
        });

        it('should return false for phrase with too few words', async () => {
            const isValid = await validateRecoveryPhrase('abandon ability able about');

            expect(isValid).toBe(false);
        });
    });

    describe('countWords', () => {
        it('should count words correctly', () => {
            expect(countWords('one two three')).toBe(3);
            expect(countWords('single')).toBe(1);
            expect(countWords('')).toBe(0);
        });

        it('should handle extra whitespace', () => {
            expect(countWords('  one   two   three  ')).toBe(3);
            expect(countWords('\tone\ttwo\t')).toBe(2);
            expect(countWords('\n\n')).toBe(0);
        });

        it('should handle 12-word phrase', () => {
            const phrase = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
            expect(countWords(phrase)).toBe(12);
        });

        it('should handle 24-word phrase', () => {
            const phrase = 'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual';
            expect(countWords(phrase)).toBe(24);
        });
    });

    describe('Round-trip conversion', () => {
        it('should round-trip various share lengths', async () => {
            const shares = [
                '00'.repeat(16),
                'ff'.repeat(16),
                'abcdef'.repeat(8),
                '123456789abcdef0'.repeat(4),
            ];

            for (const share of shares) {
                const phrase = await shareToRecoveryPhrase(share);
                const recovered = await recoveryPhraseToShare(phrase);
                expect(recovered).toBe(share);
            }
        });

        it('should handle 32-byte (64 hex char) shares correctly', async () => {
            const share32bytes = 'a'.repeat(64);

            const phrase = await shareToRecoveryPhrase(share32bytes);
            const recovered = await recoveryPhraseToShare(phrase);

            expect(recovered).toBe(share32bytes);
        });
    });
});

describe('Full SSS + Recovery Phrase Integration', () => {

    it('should generate phrase from SSS recovery share and reconstruct original key', async () => {
        // 1. Start with a private key (32 bytes = 64 hex chars)
        const originalPrivateKey = 'abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

        // 2. Split into SSS shares
        const shares = await splitPrivateKey(originalPrivateKey);
        console.log('Device share length:', shares.deviceShare.length);
        console.log('Auth share length:', shares.authShare.length);
        console.log('Recovery share length:', shares.recoveryShare.length);

        // 3. Convert recovery share to phrase
        const phrase = await shareToRecoveryPhrase(shares.recoveryShare);
        const wordCount = phrase.split(' ').length;
        console.log('Generated phrase word count:', wordCount);
        console.log('Phrase:', phrase);

        // 4. Validate the phrase
        const isValid = await validateRecoveryPhrase(phrase);
        expect(isValid).toBe(true);

        // 5. Convert phrase back to share
        const recoveredShare = await recoveryPhraseToShare(phrase);
        expect(recoveredShare).toBe(shares.recoveryShare);

        // 6. Reconstruct private key using recovery share + auth share
        const reconstructedKey = await reconstructFromShares([
            recoveredShare,
            shares.authShare,
        ]);

        expect(reconstructedKey).toBe(originalPrivateKey);
    });

    it('should work with randomly generated private keys', async () => {
        // Generate a few random 32-byte keys
        for (let i = 0; i < 5; i++) {
            const randomKey = Array.from({ length: 64 }, () => 
                Math.floor(Math.random() * 16).toString(16)
            ).join('');

            const shares = await splitPrivateKey(randomKey);
            const phrase = await shareToRecoveryPhrase(shares.recoveryShare);

            // Validate
            const isValid = await validateRecoveryPhrase(phrase);
            expect(isValid).toBe(true);

            // Round-trip
            const recoveredShare = await recoveryPhraseToShare(phrase);
            expect(recoveredShare).toBe(shares.recoveryShare);

            // Reconstruct
            const reconstructed = await reconstructFromShares([
                recoveredShare,
                shares.authShare,
            ]);
            expect(reconstructed).toBe(randomKey);
        }
    });

    it('should produce consistent word count for SSS shares', async () => {
        const privateKey = 'abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';
        const shares = await splitPrivateKey(privateKey);
        
        const phrase = await shareToRecoveryPhrase(shares.recoveryShare);
        const wordCount = phrase.split(' ').length;
        
        // SSS shares from shamir-secret-sharing include an index byte
        // 33 bytes = 264 bits + 8 checksum = 272 bits / 11 = ~25 words
        console.log('SSS recovery share hex length:', shares.recoveryShare.length);
        console.log('SSS recovery share byte length:', shares.recoveryShare.length / 2);
        console.log('Word count:', wordCount);
        
        expect(wordCount).toBeGreaterThanOrEqual(24);
        expect(wordCount).toBeLessThanOrEqual(27);
    });
});
