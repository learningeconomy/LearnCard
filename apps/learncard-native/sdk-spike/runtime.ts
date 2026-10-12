import type { SpikeVectors, VerificationResult } from './contracts';
import { initLearnCard } from '@learncard/init';
import { reconstructPrivateKey } from '../../../packages/sss-key-manager/src/sss';
import { decryptWithPassword } from '../../../packages/sss-key-manager/src/crypto';
import { recoveryPhraseToShare } from '../../../packages/sss-key-manager/src/recovery-phrase';
import { generateEncryptedFieldsArray } from '../../../packages/plugins/learn-cloud/src/helpers';
import {
    generateEphemeralKeypair,
    encryptShareForTransfer,
    decryptShareFromTransfer,
} from '../../../packages/sss-key-manager/src/qr-crypto';

type Wallet = Awaited<ReturnType<typeof initLearnCard>>;
let issuer: Wallet;
let holder: Wallet;
let unrelated: Wallet;
let vectors: SpikeVectors;

const checkVerification = (value: VerificationResult): boolean =>
    Array.isArray(value?.errors) && value.errors.length === 0;

const methods = {
    initialize: async (input: { wasmBase64: string; vectors: SpikeVectors }) => {
        vectors = input.vectors;
        const bytes = Uint8Array.from(atob(input.wasmBase64), character => character.charCodeAt(0));
        issuer = (await initLearnCard({
            seed: vectors.issuerSeed,
            didkit: bytes,
            allowRemoteContexts: false,
        })) as Wallet;
        holder = (await initLearnCard({
            seed: vectors.holderSeed,
            didkit: bytes,
            allowRemoteContexts: false,
        })) as Wallet;
        unrelated = (await initLearnCard({
            seed: 'c'.repeat(64),
            didkit: bytes,
            allowRemoteContexts: false,
        })) as Wallet;
        return {
            issuerDid: issuer.id.did(),
            holderDid: holder.id.did(),
            issuerMatches: issuer.id.did() === vectors.issuerDid,
            holderMatches: holder.id.did() === vectors.holderDid,
        };
    },
    credentials: async () => {
        const results = [];
        const signedByNative = [];
        for (const fixture of vectors.fixtures) {
            const started = performance.now();
            try {
                const fullFromWeb = await holder.invoke.verifyCredential(fixture.signed);
                const fromWeb = await holder.invoke.verifyCredential(fixture.signed, {
                    checks: ['proof'],
                });
                const signed = await issuer.invoke.issueCredential(fixture.unsigned);
                const fullNative = await holder.invoke.verifyCredential(signed);
                const selfVerified = await holder.invoke.verifyCredential(signed, {
                    checks: ['proof'],
                });
                const tampered = structuredClone(signed);
                // Change an already signed field; schema remains valid.
                tampered.issuer = vectors.holderDid;
                const invalid = await holder.invoke.verifyCredential(tampered, {
                    checks: ['proof'],
                });
                results.push({
                    id: fixture.id,
                    webVerified: checkVerification(fromWeb),
                    nativeVerified: checkVerification(selfVerified),
                    tamperRejected: !checkVerification(invalid),
                    milliseconds: Math.round(performance.now() - started),
                    webBaselineVerified: checkVerification(fixture.webVerification),
                    fullWebVerified: checkVerification(fullFromWeb),
                    fullNativeVerified: checkVerification(fullNative),
                    fullWebErrorKinds: (fullFromWeb.errors ?? []).map(
                        (error: string) => error.split(':')[0]
                    ),
                    fullNativeErrorKinds: (fullNative.errors ?? []).map(
                        (error: string) => error.split(':')[0]
                    ),
                });
                signedByNative.push({ id: fixture.id, credential: signed });
            } catch (error) {
                results.push({ id: fixture.id, error: String(error) });
            }
        }
        return { results, signedByNative };
    },
    encryption: async () => {
        const decrypted = await holder.invoke.decryptDagJwe(vectors.encrypted, [
            holder.id.keypair(),
        ]);
        const nativeEncrypted = await issuer.invoke.createDagJwe(vectors.cleartext, [
            holder.id.did(),
        ]);
        let wrongRecipientRejected: boolean;
        try {
            const result = await unrelated.invoke.decryptDagJwe(vectors.encrypted);
            // Current SDK returns an empty string for this failure instead of throwing.
            wrongRecipientRejected = result === '' || result === null || result === undefined;
        } catch {
            wrongRecipientRejected = true;
        }
        const encryptedIndexFields = await generateEncryptedFieldsArray(
            holder as Parameters<typeof generateEncryptedFieldsArray>[0],
            vectors.indexRecord
        );
        return {
            decrypted,
            nativeEncrypted,
            wrongRecipientRejected,
            indexFieldsMatch:
                JSON.stringify([...encryptedIndexFields].sort()) ===
                JSON.stringify([...vectors.encryptedIndexFields].sort()),
        };
    },
    recovery: async () => {
        const data = vectors.recovery;
        const started = performance.now();
        const passwordShare = await decryptWithPassword(
            data.encryptedRecovery.ciphertext,
            data.encryptedRecovery.iv,
            data.encryptedRecovery.salt,
            data.publicPassword,
            data.encryptedRecovery.kdfParams
        );
        const phraseShare = await recoveryPhraseToShare(data.recoveryPhrase);
        const deviceSeed = await reconstructPrivateKey(data.deviceShare, data.authShare);
        const passwordSeed = await reconstructPrivateKey(passwordShare, data.authShare);
        const phraseSeed = await reconstructPrivateKey(phraseShare, data.authShare);
        let wrongPasswordRejected = false;
        try {
            await decryptWithPassword(
                data.encryptedRecovery.ciphertext,
                data.encryptedRecovery.iv,
                data.encryptedRecovery.salt,
                'wrong-public-test-password',
                data.encryptedRecovery.kdfParams
            );
        } catch {
            wrongPasswordRejected = true;
        }
        // Return equality results, never recovered secret material.
        return {
            deviceMatches: deviceSeed === vectors.holderSeed,
            passwordMatches: passwordSeed === vectors.holderSeed,
            phraseMatches: phraseSeed === vectors.holderSeed,
            wrongPasswordRejected,
            milliseconds: Math.round(performance.now() - started),
        };
    },
    presentation: async () => {
        const presentation = await holder.invoke.issuePresentation(
            {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                holder: holder.id.did(),
                verifiableCredential: [vectors.fixtures[0].signed],
            },
            { challenge: 'public-native-spike-challenge', domain: 'native-spike.learncard.test' }
        );
        const verified = await issuer.invoke.verifyPresentation(presentation, {
            challenge: 'public-native-spike-challenge',
            domain: 'native-spike.learncard.test',
        });
        const wrongChallenge = await issuer.invoke.verifyPresentation(presentation, {
            challenge: 'wrong-challenge',
            domain: 'native-spike.learncard.test',
        });
        const didAuth = await holder.invoke.getDidAuthVp({
            proofFormat: 'jwt',
            challenge: 'public-auth-challenge',
        });
        return {
            presentation,
            didAuth,
            verified: checkVerification(verified),
            wrongChallengeRejected: !checkVerification(wrongChallenge),
        };
    },
    transfer: async () => {
        const recipient = await crypto.subtle.importKey(
            'jwk',
            vectors.transfer.recipientJwk,
            { name: 'X25519' },
            false,
            ['deriveBits']
        );
        const decrypted = await decryptShareFromTransfer(
            vectors.transfer.encryptedShare,
            recipient
        );
        const nativeEnvelope = await encryptShareForTransfer(
            vectors.recovery.deviceShare,
            vectors.transfer.recipientPublicKey
        );
        const wrong = await generateEphemeralKeypair();
        let wrongRecipientRejected = false;
        try {
            await decryptShareFromTransfer(vectors.transfer.encryptedShare, wrong.privateKey);
        } catch {
            wrongRecipientRejected = true;
        }
        return {
            shareMatches: decrypted === vectors.recovery.deviceShare,
            nativeEnvelope,
            wrongRecipientRejected,
        };
    },
};

// Only fixed spike commands; never allow arbitrary invoke, eval, URLs, or a private-key return.
Object.defineProperty(globalThis, 'LearnCardSpike', {
    value: {
        call: async (method: string, input: unknown) => {
            if (!Object.hasOwn(methods, method)) throw new Error('Unsupported spike command');
            if (method !== 'initialize' && !holder) throw new Error('Initialize the spike first');
            return JSON.stringify(
                await methods[method as keyof typeof methods](
                    input as Parameters<typeof methods.initialize>[0]
                )
            );
        },
    },
    writable: false,
});

export type NativeSpikeOutput = {
    initialization: Awaited<ReturnType<typeof methods.initialize>> & {
        inputSha256: string;
        resourcePath: string;
    };
    initializationMilliseconds: number;
    credentials: Awaited<ReturnType<typeof methods.credentials>>;
    encryption: Awaited<ReturnType<typeof methods.encryption>>;
    presentation: Awaited<ReturnType<typeof methods.presentation>>;
    recovery: Awaited<ReturnType<typeof methods.recovery>>;
    transfer: Awaited<ReturnType<typeof methods.transfer>>;
};
