import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';

import { describe, expect, test } from 'vitest';
import { initLearnCard } from '@learncard/init';
import type { UnsignedVC, VC } from '@learncard/types';

const MIN_BITSTRING_LENGTH = 131_072;
const REVOKED_INDEX = 7;
const UNREVOKED_INDEX = 10;

const require = createRequire(import.meta.url);
const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

const getLocalLearnCard = (seed: string) =>
    initLearnCard({
        seed,
        didkit,
        network: 'http://localhost:4000/trpc',
        cloud: { url: 'http://localhost:4100/trpc' },
    });
type LocalLearnCard = Awaited<ReturnType<typeof getLocalLearnCard>>;

const base64Url = (bytes: Buffer): string =>
    bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');

const encodeBitstringStatusList = (setIndexes: number[]): string => {
    const bytes = Buffer.alloc(MIN_BITSTRING_LENGTH / 8);

    for (const index of setIndexes) {
        const byteIndex = Math.floor(index / 8);
        bytes[byteIndex] = (bytes[byteIndex] ?? 0) | (1 << index % 8);
    }

    return `u${base64Url(gzipSync(bytes))}`;
};

const startStatusCredentialServer = async (getCredential: () => VC | undefined) => {
    let requestCount = 0;

    const server = createServer((req, res) => {
        if (req.url !== '/status-list.json') {
            res.writeHead(404).end();
            return;
        }

        const credential = getCredential();

        if (!credential) {
            res.writeHead(503).end();
            return;
        }

        requestCount += 1;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(credential));
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject);
            resolve();
        });
    });

    const address = server.address() as AddressInfo;

    return {
        url: `http://127.0.0.1:${address.port}/status-list.json`,
        get requestCount() {
            return requestCount;
        },
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close(error => (error ? reject(error) : resolve()));
            }),
    };
};

const issueStatusListCredential = async (
    issuer: LocalLearnCard,
    statusListUrl: string,
    revokedIndexes: number[]
): Promise<VC> => {
    const unsignedStatusListCredential = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: statusListUrl,
        type: ['VerifiableCredential', 'BitstringStatusListCredential'],
        issuer: issuer.id.did(),
        validFrom: new Date().toISOString(),
        credentialSubject: {
            type: 'BitstringStatusList',
            statusPurpose: 'revocation',
            encodedList: encodeBitstringStatusList(revokedIndexes),
        },
    } as unknown as UnsignedVC;

    return issuer.invoke.issueCredential(unsignedStatusListCredential);
};

const issueCredentialWithStatus = async (
    issuer: LocalLearnCard,
    subjectDid: string,
    statusListUrl: string,
    statusListIndex: number
): Promise<VC> => {
    const unsignedCredential = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: `urn:uuid:bitstring-status-list-e2e-${statusListIndex}`,
        type: ['VerifiableCredential', 'BitstringStatusListE2ECredential'],
        issuer: issuer.id.did(),
        validFrom: new Date().toISOString(),
        credentialStatus: {
            type: 'BitstringStatusListEntry',
            statusPurpose: 'revocation',
            statusListIndex: statusListIndex.toString(),
            statusListCredential: statusListUrl,
        },
        credentialSubject: {
            id: subjectDid,
            name: `Bitstring Status List E2E ${statusListIndex}`,
        },
    } as unknown as UnsignedVC;

    return issuer.invoke.issueCredential(unsignedCredential);
};

describe('Bitstring Status List', () => {
    test('verifies VC 2.0 credentials against a W3C BitstringStatusListCredential', async () => {
        const issuer = await getLocalLearnCard('9'.repeat(64));
        const verifier = await getLocalLearnCard('8'.repeat(64));
        let statusListCredential: VC | undefined;

        const statusServer = await startStatusCredentialServer(() => statusListCredential);

        try {
            statusListCredential = await issueStatusListCredential(issuer, statusServer.url, [
                REVOKED_INDEX,
            ]);

            const unrevokedCredential = await issueCredentialWithStatus(
                issuer,
                verifier.id.did(),
                statusServer.url,
                UNREVOKED_INDEX
            );
            const unrevokedVerification = await verifier.invoke.verifyCredential(
                unrevokedCredential
            );

            expect(unrevokedVerification.warnings).toHaveLength(0);
            expect(unrevokedVerification.errors).toHaveLength(0);
            expect(unrevokedVerification.checks).toContain('proof');
            expect(unrevokedVerification.checks).toContain('status');

            const revokedCredential = await issueCredentialWithStatus(
                issuer,
                verifier.id.did(),
                statusServer.url,
                REVOKED_INDEX
            );
            const revokedVerification = await verifier.invoke.verifyCredential(revokedCredential);

            expect(revokedVerification.errors.join('\n')).toMatch(/revoked/i);
            expect(statusServer.requestCount).toBeGreaterThanOrEqual(2);
        } finally {
            await statusServer.close();
        }
    }, 60_000);
});
