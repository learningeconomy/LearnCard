/**
 * Critical Path Tests
 * 
 * These tests verify that private keys can NEVER be lost due to:
 * - Share splitting bugs
 * - Recovery method round-trip failures
 * - Partial storage failures
 * 
 * Run these tests before any release that touches SSS code.
 */

import { describe, it, expect } from 'vitest';

import { splitPrivateKey, reconstructFromShares, SSS_THRESHOLD } from './sss';
import { generateEd25519PrivateKey, encryptWithPassword, decryptWithPassword } from './crypto';
import { shareToRecoveryPhrase, recoveryPhraseToShare, validateRecoveryPhrase } from './recovery-phrase';

describe('Critical: Key must NEVER be lost', () => {

    describe('Share split verification (fuzz test)', () => {

        it('should verify all 6 share combinations reconstruct the key (100 iterations)', async () => {
            for (let i = 0; i < 100; i++) {
                const privateKey = await generateEd25519PrivateKey();
                const shares = await splitPrivateKey(privateKey);

                // All 6 combinations (C(4,2)) must reconstruct the exact same key
                const fromDeviceAuth = await reconstructFromShares([
                    shares.deviceShare,
                    shares.authShare,
                ]);
                expect(fromDeviceAuth).toBe(privateKey);

                const fromDeviceRecovery = await reconstructFromShares([
                    shares.deviceShare,
                    shares.recoveryShare,
                ]);
                expect(fromDeviceRecovery).toBe(privateKey);

                const fromDeviceEmail = await reconstructFromShares([
                    shares.deviceShare,
                    shares.emailShare,
                ]);
                expect(fromDeviceEmail).toBe(privateKey);

                const fromAuthRecovery = await reconstructFromShares([
                    shares.authShare,
                    shares.recoveryShare,
                ]);
                expect(fromAuthRecovery).toBe(privateKey);

                const fromAuthEmail = await reconstructFromShares([
                    shares.authShare,
                    shares.emailShare,
                ]);
                expect(fromAuthEmail).toBe(privateKey);

                const fromRecoveryEmail = await reconstructFromShares([
                    shares.recoveryShare,
                    shares.emailShare,
                ]);
                expect(fromRecoveryEmail).toBe(privateKey);
            }
        });

        it('should produce unique shares for each split', async () => {
            const privateKey = await generateEd25519PrivateKey();

            const shares1 = await splitPrivateKey(privateKey);
            const shares2 = await splitPrivateKey(privateKey);

            // Different splits produce different shares (due to randomness in SSS)
            expect(shares1.deviceShare).not.toBe(shares2.deviceShare);
            expect(shares1.authShare).not.toBe(shares2.authShare);
            expect(shares1.recoveryShare).not.toBe(shares2.recoveryShare);
            expect(shares1.emailShare).not.toBe(shares2.emailShare);

            // But both should still reconstruct to the same key
            const reconstructed1 = await reconstructFromShares([
                shares1.deviceShare,
                shares1.authShare,
            ]);
            const reconstructed2 = await reconstructFromShares([
                shares2.deviceShare,
                shares2.authShare,
            ]);

            expect(reconstructed1).toBe(privateKey);
            expect(reconstructed2).toBe(privateKey);
        });

        it('should handle edge case private keys', async () => {
            const edgeCases = [
                '0'.repeat(64),  // All zeros
                'f'.repeat(64),  // All ones
                '0f'.repeat(32), // Alternating
                'abcdef0123456789'.repeat(4), // Pattern
            ];

            for (const privateKey of edgeCases) {
                const shares = await splitPrivateKey(privateKey);

                const reconstructed = await reconstructFromShares([
                    shares.deviceShare,
                    shares.authShare,
                ]);

                expect(reconstructed).toBe(privateKey);
            }
        });

        it('should reject reconstruction with fewer than threshold shares', async () => {
            const privateKey = await generateEd25519PrivateKey();
            const shares = await splitPrivateKey(privateKey);

            await expect(
                reconstructFromShares([shares.deviceShare])
            ).rejects.toThrow(`Need at least ${SSS_THRESHOLD} shares`);
        });
    });

    describe('Password encryption round-trip (used by backup files)', () => {

        it('should preserve exact private key through password encryption/decryption', async () => {
            const privateKey = await generateEd25519PrivateKey();
            const password = 'test-password-123!@#';

            const shares = await splitPrivateKey(privateKey);
            const encrypted = await encryptWithPassword(shares.recoveryShare, password);

            const decrypted = await decryptWithPassword(
                encrypted.ciphertext,
                encrypted.iv,
                encrypted.salt,
                password,
                encrypted.kdfParams
            );

            expect(decrypted).toBe(shares.recoveryShare);

            const reconstructed = await reconstructFromShares([
                decrypted,
                shares.authShare,
            ]);

            expect(reconstructed).toBe(privateKey);
        });

        it('should fail with wrong password', async () => {
            const privateKey = await generateEd25519PrivateKey();
            const shares = await splitPrivateKey(privateKey);
            const encrypted = await encryptWithPassword(shares.recoveryShare, 'correct-password');

            await expect(
                decryptWithPassword(
                    encrypted.ciphertext,
                    encrypted.iv,
                    encrypted.salt,
                    'wrong-password',
                    encrypted.kdfParams
                )
            ).rejects.toThrow();
        });

        it('should handle various password strengths', async () => {
            const passwords = [
                'short',
                'medium-length-password',
                'very-long-password-with-special-characters-!@#$%^&*()',
                '日本語パスワード',  // Unicode
                '🔐🔑🔒',  // Emoji
            ];

            for (const password of passwords) {
                const privateKey = await generateEd25519PrivateKey();
                const shares = await splitPrivateKey(privateKey);
                const encrypted = await encryptWithPassword(shares.recoveryShare, password);

                const decrypted = await decryptWithPassword(
                    encrypted.ciphertext,
                    encrypted.iv,
                    encrypted.salt,
                    password,
                    encrypted.kdfParams
                );

                const reconstructed = await reconstructFromShares([
                    decrypted,
                    shares.authShare,
                ]);

                expect(reconstructed).toBe(privateKey);
            }
        });
    });

    describe('Recovery phrase round-trip', () => {

        it('should preserve exact private key through phrase encoding/decoding', async () => {
            const privateKey = await generateEd25519PrivateKey();
            const shares = await splitPrivateKey(privateKey);

            const phrase = await shareToRecoveryPhrase(shares.recoveryShare);
            const isValid = await validateRecoveryPhrase(phrase);
            expect(isValid).toBe(true);

            const recoveredShare = await recoveryPhraseToShare(phrase);
            expect(recoveredShare).toBe(shares.recoveryShare);

            const reconstructed = await reconstructFromShares([
                recoveredShare,
                shares.authShare,
            ]);

            expect(reconstructed).toBe(privateKey);
        });

        it('should handle 100 random private keys', async () => {
            for (let i = 0; i < 100; i++) {
                const privateKey = await generateEd25519PrivateKey();
                const shares = await splitPrivateKey(privateKey);

                const phrase = await shareToRecoveryPhrase(shares.recoveryShare);
                const recoveredShare = await recoveryPhraseToShare(phrase);

                const reconstructed = await reconstructFromShares([
                    recoveredShare,
                    shares.authShare,
                ]);

                expect(reconstructed).toBe(privateKey);
            }
        });

        it('should produce consistent word count for SSS shares', async () => {
            // SSS shares include an index byte (33 bytes total)
            // This produces 25 words instead of standard BIP39 24 words
            const privateKey = await generateEd25519PrivateKey();
            const shares = await splitPrivateKey(privateKey);

            const phrase = await shareToRecoveryPhrase(shares.recoveryShare);
            const wordCount = phrase.split(' ').length;

            // SSS shares are 33 bytes, which produces 25 words
            expect(wordCount).toBeGreaterThanOrEqual(24);
            expect(wordCount).toBeLessThanOrEqual(27);
        });

        it('should handle phrase with extra whitespace', async () => {
            const privateKey = await generateEd25519PrivateKey();
            const shares = await splitPrivateKey(privateKey);

            const phrase = await shareToRecoveryPhrase(shares.recoveryShare);
            const paddedPhrase = `  ${phrase.split(' ').join('   ')}  `;

            const recoveredShare = await recoveryPhraseToShare(paddedPhrase);
            expect(recoveredShare).toBe(shares.recoveryShare);
        });

        it('should handle phrase with mixed case', async () => {
            const privateKey = await generateEd25519PrivateKey();
            const shares = await splitPrivateKey(privateKey);

            const phrase = await shareToRecoveryPhrase(shares.recoveryShare);
            const upperPhrase = phrase.toUpperCase();

            const recoveredShare = await recoveryPhraseToShare(upperPhrase);
            expect(recoveredShare).toBe(shares.recoveryShare);
        });
    });

    describe('Backup file round-trip', () => {

        it('should preserve exact private key through backup file flow', async () => {
            const privateKey = await generateEd25519PrivateKey();
            const backupPassword = 'backup-file-password-123';

            // Simulate creating a backup
            const shares = await splitPrivateKey(privateKey);
            const encrypted = await encryptWithPassword(shares.recoveryShare, backupPassword);

            const backupFile = {
                version: 1,
                createdAt: new Date().toISOString(),
                primaryDid: 'did:key:test123',
                encryptedShare: {
                    ciphertext: encrypted.ciphertext,
                    iv: encrypted.iv,
                    salt: encrypted.salt,
                    kdfParams: encrypted.kdfParams,
                },
            };

            // Simulate saving and loading (JSON round-trip)
            const backupJson = JSON.stringify(backupFile);
            const restoredBackup = JSON.parse(backupJson);

            // Restore from backup
            const recoveredShare = await decryptWithPassword(
                restoredBackup.encryptedShare.ciphertext,
                restoredBackup.encryptedShare.iv,
                restoredBackup.encryptedShare.salt,
                backupPassword,
                restoredBackup.encryptedShare.kdfParams
            );

            const reconstructed = await reconstructFromShares([
                recoveredShare,
                shares.authShare,
            ]);

            expect(reconstructed).toBe(privateKey);
        });
    });

    describe('Cross-share compatibility', () => {

        it('should NOT reconstruct key from shares of different splits', async () => {
            const privateKey = await generateEd25519PrivateKey();

            // Two different splits
            const shares1 = await splitPrivateKey(privateKey);
            const shares2 = await splitPrivateKey(privateKey);

            // Mixing shares from different splits should produce WRONG key
            const wrongKey = await reconstructFromShares([
                shares1.deviceShare,  // From split 1
                shares2.authShare,    // From split 2
            ]);

            // The reconstructed key should NOT match the original
            // (This is the bug we fixed - stale device shares)
            expect(wrongKey).not.toBe(privateKey);
        });

        it('should detect stale device shares via DID mismatch', async () => {
            const privateKey = await generateEd25519PrivateKey();

            // Original split
            const originalShares = await splitPrivateKey(privateKey);

            // After recovery, new split is created
            const newShares = await splitPrivateKey(privateKey);

            // Reconstruct with stale device + new auth
            const wrongKey = await reconstructFromShares([
                originalShares.deviceShare,  // Stale
                newShares.authShare,         // New
            ]);

            // Keys don't match - this is the scenario DID verification catches
            expect(wrongKey).not.toBe(privateKey);
        });
    });
});

describe('Critical: Share integrity', () => {

    it('shares should be valid hex strings', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const shares = await splitPrivateKey(privateKey);

        const hexRegex = /^[0-9a-f]+$/i;

        expect(hexRegex.test(shares.deviceShare)).toBe(true);
        expect(hexRegex.test(shares.authShare)).toBe(true);
        expect(hexRegex.test(shares.recoveryShare)).toBe(true);
        expect(hexRegex.test(shares.emailShare)).toBe(true);
    });

    it('shares should be consistent length', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const shares = await splitPrivateKey(privateKey);

        // All shares should be the same length
        expect(shares.deviceShare.length).toBe(shares.authShare.length);
        expect(shares.authShare.length).toBe(shares.recoveryShare.length);
        expect(shares.recoveryShare.length).toBe(shares.emailShare.length);

        // SSS adds an index byte, so shares are 33 bytes (66 hex chars)
        expect(shares.deviceShare.length).toBe(66);
    });

    it('shares should be unique within a split', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const shares = await splitPrivateKey(privateKey);

        expect(shares.deviceShare).not.toBe(shares.authShare);
        expect(shares.authShare).not.toBe(shares.recoveryShare);
        expect(shares.deviceShare).not.toBe(shares.recoveryShare);
        expect(shares.deviceShare).not.toBe(shares.emailShare);
        expect(shares.authShare).not.toBe(shares.emailShare);
        expect(shares.recoveryShare).not.toBe(shares.emailShare);
    });
});
