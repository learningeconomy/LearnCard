import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { base58btc } from 'multiformats/bases/base58';
import type * as Didkit from '../src/didkit/pkg/didkit_wasm';

declare global {
    interface Window {
        didkit: typeof Didkit;
        testKeys: string[];
    }
}

const ORIGIN = 'http://localhost:4173';
const RECIPIENT = 'did:web:recipient.example';
const DID_URL = 'https://recipient.example/.well-known/did.json';
const pkg = new URL('../src/didkit/pkg/', import.meta.url);

for (const format of ['JWE', 'DAG-JWE'] as const) {
    test(`${format} encrypts to every managed-profile keyAgreement key`, async ({ page }) => {
        const unexpectedRequests: string[] = [];
        const js = await readFile(new URL('didkit_wasm.js', pkg));
        const wasm = await readFile(new URL('didkit_wasm_bg.wasm', pkg));
        let keyAgreement: Record<string, string>[] = [];
        let didReads = 0;

        // Only DID resolution is stubbed. The checked-in browser glue and WASM
        // perform all key generation, encryption and decryption in a real browser.
        await page.route('**/*', async route => {
            const url = route.request().url();
            if (url === `${ORIGIN}/`) {
                await route.fulfill({
                    contentType: 'text/html',
                    body: '<!doctype html><title>DIDKit test</title>',
                });
            } else if (url === `${ORIGIN}/didkit_wasm.js`) {
                await route.fulfill({ contentType: 'text/javascript', body: js });
            } else if (url === `${ORIGIN}/didkit_wasm_bg.wasm`) {
                await route.fulfill({ contentType: 'application/wasm', body: wasm });
            } else if (url === DID_URL) {
                didReads += 1;
                await route.fulfill({
                    contentType: 'application/did+ld+json',
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        '@context': ['https://www.w3.org/ns/did/v1'],
                        id: RECIPIENT,
                        keyAgreement,
                    }),
                });
            } else {
                unexpectedRequests.push(url);
                await route.abort();
            }
        });
        await page.goto(ORIGIN);
        const agreements = await page.evaluate(async origin => {
            const moduleUrl = `${origin}/didkit_wasm.js`;
            window.didkit = await import(moduleUrl);
            await window.didkit.default({ module_or_path: `${origin}/didkit_wasm_bg.wasm` });
            window.testKeys = Array.from({ length: 4 }, () => window.didkit.generateEd25519Key());
            return Promise.all(
                window.testKeys.slice(0, 3).map(async key => {
                    const did = window.didkit.keyToDID('key', key);
                    const doc = JSON.parse(await window.didkit.resolveDID(did, '{}'));
                    return doc.keyAgreement[0] as { publicKeyMultibase: string };
                })
            );
        }, ORIGIN);

        // Match brain-service/src/dids.ts: inline 2019 keys, including the
        // primary recipient and two managers, all controlled by the profile DID.
        const allAgreements = agreements.map(agreement => {
            const multicodecKey = base58btc.decode(agreement.publicKeyMultibase);
            expect(Array.from(multicodecKey.slice(0, 2))).toEqual([0xec, 0x01]);
            return {
                id: `${RECIPIENT}#${agreement.publicKeyMultibase}`,
                type: 'X25519KeyAgreementKey2019',
                controller: RECIPIENT,
                publicKeyBase58: base58btc.encode(multicodecKey.slice(2)).slice(1),
            };
        });

        const exercise = async () =>
            page.evaluate(
                async ({ recipient, format }) => {
                    const { didkit, testKeys } = window;
                    await didkit.clearCache();
                    const plaintext = { name: 'Synthetic outcome', type: ['VerifiableCredential'] };
                    const jwe =
                        format === 'JWE'
                            ? await didkit.createJwe(JSON.stringify(plaintext), [recipient])
                            : await didkit.createDagJwe(plaintext, [recipient]);
                    const canRead = await Promise.all(
                        testKeys.map(async key => {
                            try {
                                const decrypted =
                                    format === 'JWE'
                                        ? JSON.parse(await didkit.decryptJwe(jwe, [key]))
                                        : await didkit.decryptDagJwe(jwe, [key]);
                                return JSON.stringify(decrypted) === JSON.stringify(plaintext);
                            } catch {
                                return false;
                            }
                        })
                    );
                    return {
                        jwe,
                        canRead,
                        kids: JSON.parse(jwe).recipients.map(
                            (entry: { header: { kid: string } }) => entry.header.kid
                        ),
                    };
                },
                { recipient: RECIPIENT, format }
            );

        keyAgreement = allAgreements.slice(0, 1);
        const before = await exercise();
        expect(before.canRead).toEqual([true, false, false, false]);

        keyAgreement = allAgreements;
        const enabled = await exercise();
        expect(enabled.kids.sort()).toEqual(allAgreements.map(key => key.id).sort());
        expect(enabled.canRead).toEqual([true, true, true, false]);

        // Adding a manager cannot retroactively decrypt an old ciphertext.
        const managerCanRead = async (jwe: string): Promise<boolean> =>
            page.evaluate(
                async ({ jwe, format }) => {
                    try {
                        const decrypted =
                            format === 'JWE'
                                ? JSON.parse(
                                      await window.didkit.decryptJwe(jwe, [window.testKeys[1]])
                                  )
                                : await window.didkit.decryptDagJwe(jwe, [window.testKeys[1]]);
                        return decrypted?.name === 'Synthetic outcome';
                    } catch {
                        return false;
                    }
                },
                { jwe, format }
            );
        expect(await managerCanRead(before.jwe)).toBe(false);

        // Removing one manager affects new encryption after DID cache refresh.
        keyAgreement = [allAgreements[0], allAgreements[2]];
        const removed = await exercise();
        expect(removed.canRead).toEqual([true, false, true, false]);
        // Removal cannot revoke access to ciphertext already encrypted to that key.
        expect(await managerCanRead(enabled.jwe)).toBe(true);
        expect(didReads).toBe(3);
        expect(unexpectedRequests).toEqual([]);
    });
}
