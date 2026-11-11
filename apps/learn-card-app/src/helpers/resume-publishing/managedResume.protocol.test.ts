// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import {
    ShareManifestPresentationValidator,
    type UnsignedVC,
    type UnsignedVP,
    type VC,
    type VP,
} from '@learncard/types';
import { getDidKitPlugin } from '../../../../../packages/plugins/didkit/src/plugin';
import { getLerRsPlugin } from '../../../../../packages/plugins/ler-rs/src/ler-rs';
import {
    buildShareManifest,
    decryptSharePayload,
    encryptSharePayload,
    generateShareContentKey,
    generateShareLinkId,
    validateShareManifest,
} from 'learn-card-base/helpers/share-links';
import { prepareProtectedPdf, getProtectedResumePdf } from './protectedPdf';

describe('managed resume through the real credential and encryption primitives', () => {
    let kit: Awaited<ReturnType<typeof getDidKitPlugin>>;
    beforeAll(async () => {
        kit = await getDidKitPlugin(
            await readFile(
                new URL(
                    '../../../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
                    import.meta.url
                )
            )
        );
    });

    it.each(['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/ns/credentials/v2'])(
        'signs protected PDF metadata and preserves the original %s source credential',
        async sourceContext => {
            const keypair = kit.methods.generateEd25519KeyFromBytes(
                {} as never,
                new Uint8Array(32).fill(31)
            );
            const otherKeypair = kit.methods.generateEd25519KeyFromBytes(
                {} as never,
                new Uint8Array(32).fill(32)
            );
            const did = kit.methods.keyToDid({} as never, 'key', keypair);
            const verificationMethod = await kit.methods.keyToVerificationMethod(
                {} as never,
                'key',
                keypair
            );
            const host = {
                id: { did: () => did },
                context: { resolveDocument: async () => undefined },
                invoke: {
                    issueCredential: (credential: UnsignedVC) =>
                        kit.methods.issueCredential(
                            host as never,
                            credential,
                            {
                                type: 'DataIntegrityProof',
                                cryptosuite: 'eddsa-rdfc-2022',
                                proofPurpose: 'assertionMethod',
                                verificationMethod,
                            },
                            keypair
                        ),
                },
            };
            const pdfBytes = new TextEncoder().encode('%PDF-1.4\nPDF_CONTENT_CANARY\n%%EOF');
            const hash = Buffer.from(await crypto.subtle.digest('SHA-256', pdfBytes)).toString(
                'hex'
            );
            const prepared = await prepareProtectedPdf(
                new Blob([pdfBytes], { type: 'application/pdf' }),
                hash,
                { shareId: generateShareLinkId(), contentVersion: 1 }
            );
            const dataUri = prepared.descriptor.url as string;
            const original = await host.invoke
                .issueCredential({
                    '@context': [
                        sourceContext,
                        sourceContext.endsWith('/v1')
                            ? 'https://www.w3.org/2018/credentials/examples/v1'
                            : 'https://www.w3.org/ns/credentials/examples/v2',
                    ],
                    type: ['VerifiableCredential'],
                    issuer: did,
                    ...(sourceContext.endsWith('/v1')
                        ? { issuanceDate: new Date().toISOString() }
                        : {}),
                    credentialSubject: { id: did, name: 'SOURCE_CLAIM_CANARY' },
                })
                .catch(() => {
                    throw new Error('source issuance failed');
                });
            const originalCopy = structuredClone(original);
            const ler = getLerRsPlugin(host as never);
            const credential = await ler.methods
                .createLerRecord(host as never, {
                    learnCard: host as never,
                    person: {
                        id: did,
                        givenName: 'NAME_CANARY',
                        familyName: 'Example',
                        email: 'CONTACT_CANARY@example.test',
                    },
                    attachments: [prepared.descriptor],
                    workHistory: [{ position: 'Engineer', verifiableCredential: original }],
                })
                .catch(() => {
                    throw new Error('LER issuance failed');
                });
            expect(getProtectedResumePdf(credential)).toMatchObject({
                shareId: prepared.descriptor.shareId,
                hash,
                key: prepared.descriptor.key,
            });
            expect(await kit.methods.verifyCredential(host as never, credential)).toMatchObject({
                errors: [],
            });
            expect(original).toEqual(originalCopy);
            expect(await kit.methods.verifyCredential(host as never, original)).toMatchObject({
                errors: [],
            });
            const presentation = (await kit.methods.issuePresentation(
                host as never,
                {
                    '@context': ['https://www.w3.org/ns/credentials/v2'],
                    type: ['VerifiablePresentation'],
                    holder: did,
                    verifiableCredential: [credential],
                } satisfies UnsignedVP,
                {
                    type: 'Ed25519Signature2020',
                    proofPurpose: 'authentication',
                    verificationMethod,
                },
                keypair
            )) as VP;
            expect(
                await kit.methods.verifyPresentation(host as never, presentation, {
                    proofPurpose: 'authentication',
                })
            ).toMatchObject({ errors: [] });
            const shareId = prepared.descriptor.shareId as string;
            const key = generateShareContentKey();
            const manifest = buildShareManifest({
                shareId,
                contentVersion: 1,
                createdAt: new Date().toISOString(),
                sharer: { profileId: 'owner', displayName: 'Owner' },
                presentation: ShareManifestPresentationValidator.parse(presentation),
                selection: [{ credentialIndex: 0 }],
            });
            expect(validateShareManifest(manifest, { shareId, contentVersion: 1 }).ok).toBe(true);
            const envelope = await encryptSharePayload({
                shareId,
                contentVersion: 1,
                key,
                payload: manifest,
            });
            for (const canary of [
                dataUri,
                'NAME_CANARY',
                'CONTACT_CANARY',
                'PDF_CONTENT_CANARY',
                hash,
                key,
            ]) {
                expect(JSON.stringify(envelope)).not.toContain(canary);
            }
            const resolved = await decryptSharePayload({
                shareId,
                contentVersion: 1,
                key,
                envelope,
            });
            expect(resolved).toEqual(manifest);
            await expect(
                decryptSharePayload({
                    shareId,
                    contentVersion: 1,
                    key: generateShareContentKey(),
                    envelope,
                })
            ).rejects.toThrow();
            const ownerStored = await kit.methods.createDagJwe(host as never, credential, [did]);
            expect(JSON.stringify(ownerStored)).not.toContain(dataUri);
            await expect(
                kit.methods.decryptDagJwe(host as never, ownerStored, [otherKeypair])
            ).resolves.toBe('');
            expect(await kit.methods.decryptDagJwe(host as never, ownerStored, [keypair])).toEqual(
                credential
            );
            const alteredSource = structuredClone(credential) as VC;
            const alteredSubject = alteredSource.credentialSubject as Record<string, unknown>;
            const work = (alteredSubject.employmentHistories as Array<{ verifications: VC[] }>)[0];
            (work.verifications[0].credentialSubject as Record<string, unknown>).name =
                'changed source claim';
            expect(
                (await kit.methods.verifyCredential(host as never, alteredSource)).errors.length
            ).toBeGreaterThan(0);
            const checkpoint = {
                descriptor: prepared.descriptor,
                chunks: prepared.chunks,
                privateSnapshot: { name: 'CHECKPOINT_CANARY' },
            };
            const encryptedCheckpoint = await kit.methods.createDagJwe(host as never, checkpoint, [
                did,
            ]);
            expect(JSON.stringify(encryptedCheckpoint)).not.toContain('CHECKPOINT_CANARY');
            expect(
                await kit.methods.decryptDagJwe(host as never, encryptedCheckpoint, [keypair])
            ).toEqual(checkpoint);
            for (const field of [
                'key',
                'shareId',
                'contentVersion',
                'chunkCount',
                'byteLength',
                'url',
            ]) {
                const tampered = structuredClone(credential) as VC;
                const subject = tampered.credentialSubject as Record<string, unknown>;
                const attachment = (subject.attachments as Record<string, unknown>[])[0];
                attachment[field] =
                    typeof attachment[field] === 'number'
                        ? Number(attachment[field]) + 1
                        : `${attachment[field]}changed`;
                const verification = await kit.methods.verifyCredential(host as never, tampered);
                expect(verification.errors.length, `signed attachment ${field}`).toBeGreaterThan(0);
            }
        }
    );
});
