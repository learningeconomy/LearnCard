import { promises as fs } from 'fs';
import { createServer, type Server } from 'http';
import { gzipSync } from 'zlib';
import type { VC } from '@learncard/types';
import { initLearnCard, type LearnCardFromSeed } from '@learncard/init';
import { setBitstringStatusListBit } from '@learncard/helpers';
import {
    materializeClrVerificationScaleFixture,
    materializeMultiIssuerClrVerificationFixture,
} from '@learncard/credential-library';

const didkit = fs.readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

interface LocalClrFixtureServer {
    baseDid: string;
    statusListUrl: string;
    didDocuments: Record<string, ClrFixtureDidDocument>;
    counters: { didGets: number; statusGets: number };
    setStatusList: (credential: VC) => void;
    resetCounters: () => void;
    close: () => Promise<void>;
}

const startLocalClrFixtureServer = async (): Promise<LocalClrFixtureServer> => {
    const didDocuments: Record<string, ClrFixtureDidDocument> = {};
    const counters = { didGets: 0, statusGets: 0 };
    let statusList: VC | undefined;
    const server: Server = createServer((request, response) => {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', '*');
        if (request.method === 'OPTIONS') {
            response.writeHead(204).end();
            return;
        }
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (pathname.endsWith('/did.json')) {
            const doc = Object.values(didDocuments).find(candidate => {
                const segments = candidate.id.slice('did:web:'.length).split(':');
                const path = `${segments.slice(1).join('/')}/did.json`;
                return `/${path}` === pathname;
            });
            counters.didGets += 1;
            response.writeHead(doc ? 200 : 404, { 'content-type': 'application/did+json' });
            response.end(doc ? JSON.stringify(doc) : '{}');
            return;
        }
        if (pathname === '/status-list' && statusList) {
            counters.statusGets += 1;
            response.writeHead(200, { 'content-type': 'application/vc+ld+json' });
            response.end(JSON.stringify(statusList));
            return;
        }
        response.writeHead(404).end();
    });
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, 'localhost', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string')
        throw new Error('CLR fixture server has no TCP address');
    const port = address.port;
    return {
        baseDid: `did:web:localhost%3A${port}`,
        statusListUrl: `http://localhost:${port}/status-list`,
        didDocuments,
        counters,
        setStatusList: credential => {
            statusList = credential;
        },
        resetCounters: () => {
            counters.didGets = 0;
            counters.statusGets = 0;
        },
        close: async () => {
            await new Promise<void>((resolve, reject) =>
                server.close(error => (error ? reject(error) : resolve()))
            );
        },
    };
};

type Wallet = LearnCardFromSeed['returnValue'];

export interface ClrFixtureDidDocument {
    '@context': string;
    id: string;
    verificationMethod: {
        id: string;
        type: string;
        controller: string;
        publicKeyJwk: Record<string, unknown>;
    }[];
    assertionMethod: string[];
}

const didDocument = (did: string, wallet: Wallet): ClrFixtureDidDocument => {
    const { d: _private, ...publicJwk } = wallet.id.keypair()!;
    const verificationMethod = `${did}#assertion-key`;
    return {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: did,
        verificationMethod: [
            {
                id: verificationMethod,
                type: 'JsonWebKey2020',
                controller: did,
                publicKeyJwk: publicJwk,
            },
        ],
        assertionMethod: [verificationMethod],
    };
};

export interface MaterializedClrVerificationFixture {
    credential: VC;
    didDocuments: Readonly<Record<string, ClrFixtureDidDocument>>;
    statusList: VC;
    issuerDids: readonly [string, string];
    publisherDid: string;
    learnerDid: string;
    statusListUrl: string;
    counters: { didGets: number; statusGets: number };
    close: () => Promise<void>;
}

/** Uses actual LearnCard/DIDKit proofs and a live ephemeral DID-web/status server. */
export const createClrVerificationFixture = async ({
    invalidDates = false,
    tamperCertification = false,
}: {
    invalidDates?: boolean;
    tamperCertification?: boolean;
} = {}): Promise<MaterializedClrVerificationFixture> => {
    const server = await startLocalClrFixtureServer();
    try {
        const publisherDid = `${server.baseDid}:state`;
        const issuerDids = [
            `${server.baseDid}:district-a`,
            `${server.baseDid}:district-b`,
        ] as const;
        const learnerDid = `${server.baseDid}:learner`;
        const [state, districtA, districtB] = await Promise.all([
            initLearnCard({ seed: 'c'.repeat(64), didkit, allowRemoteContexts: true }),
            initLearnCard({ seed: 'a'.repeat(64), didkit, allowRemoteContexts: true }),
            initLearnCard({ seed: 'b'.repeat(64), didkit, allowRemoteContexts: true }),
        ]);
        const didDocuments = {
            [publisherDid]: didDocument(publisherDid, state),
            [issuerDids[0]]: didDocument(issuerDids[0], districtA),
            [issuerDids[1]]: didDocument(issuerDids[1], districtB),
        };
        Object.assign(server.didDocuments, didDocuments);
        const allIssuerDids = [publisherDid, ...issuerDids];
        const signers = Object.fromEntries(
            [state, districtA, districtB].map((wallet, index) => {
                const issuer = allIssuerDids[index]!;
                const dates = !invalidDates
                    ? undefined
                    : index === 0
                      ? { validFrom: '2099-01-01T00:00:00Z' }
                      : index === 1
                        ? {
                              validFrom: '2000-01-01T00:00:00Z',
                              validUntil: '2001-01-01T00:00:00Z',
                          }
                        : undefined;
                return [
                    issuer,
                    (credential: Record<string, unknown>) =>
                        wallet.invoke.issueCredential(
                            (dates ? { ...credential, ...dates } : credential) as never,
                            { verificationMethod: `${issuer}#assertion-key` }
                        ),
                ];
            })
        );
        const revokedBits = new Uint8Array(16_384);
        setBitstringStatusListBit(revokedBits, 1, true);
        const statusListDraft = {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            id: server.statusListUrl,
            type: ['VerifiableCredential', 'BitstringStatusListCredential'],
            issuer: issuerDids[1],
            validFrom: '2026-01-01T00:00:00Z',
            credentialSubject: {
                id: `${server.statusListUrl}#list`,
                type: 'BitstringStatusList',
                statusPurpose: 'revocation',
                encodedList: `u${gzipSync(revokedBits).toString('base64url')}`,
            },
        };
        const statusList = await signers[issuerDids[1]]!(statusListDraft);
        server.setStatusList(statusList);
        const credential = await materializeMultiIssuerClrVerificationFixture({
            issuerDids,
            publisherDid,
            learnerDid,
            signers,
            revokedStatusList: statusList,
            duplicateValidChild: !invalidDates,
        });
        const wrapper = tamperCertification
            ? await signers[publisherDid]!({
                  '@context': [
                      'https://www.w3.org/ns/credentials/v2',
                      {
                          CertifiedBoostCredential:
                              'https://docs.learncard.com/definitions#certifiedBoostCredential',
                          boostCredential: {
                              '@id': 'https://docs.learncard.com/definitions#boostCredential',
                              '@type': '@json',
                          },
                      },
                  ],
                  type: ['VerifiableCredential', 'CertifiedBoostCredential'],
                  issuer: publisherDid,
                  credentialSubject: { id: learnerDid },
                  boostCredential: credential,
              })
            : undefined;
        server.resetCounters();
        return {
            credential: wrapper
                ? { ...wrapper, credentialSubject: { id: `${learnerDid}-tampered` } }
                : credential,
            statusList,
            didDocuments,
            issuerDids,
            publisherDid,
            learnerDid,
            statusListUrl: server.statusListUrl,
            counters: server.counters,
            close: server.close,
        };
    } catch (error) {
        await server.close();
        throw error;
    }
};

export interface MaterializedClrScaleFixture {
    credential: VC;
    didDocuments: Readonly<Record<string, ClrFixtureDidDocument>>;
    issuerDids: readonly string[];
    learnerDid: string;
    counters: { didGets: number; statusGets: number };
    close: () => Promise<void>;
}

export const createClrVerificationScaleFixture = async (): Promise<MaterializedClrScaleFixture> => {
    const server = await startLocalClrFixtureServer();
    try {
        const issuerDids = Array.from(
            { length: 5 },
            (_, index) => `${server.baseDid}:district-${index + 1}`
        );
        const learnerDid = `${server.baseDid}:learner`;
        const wallets = await Promise.all(
            issuerDids.map((_, index) =>
                initLearnCard({
                    seed: `${'c'.repeat(62)}${index.toString(16).padStart(2, '0')}`,
                    didkit,
                    allowRemoteContexts: true,
                })
            )
        );
        const didDocuments = Object.fromEntries(
            wallets.map((wallet, index) => [
                issuerDids[index]!,
                didDocument(issuerDids[index]!, wallet),
            ])
        );
        Object.assign(server.didDocuments, didDocuments);
        const signers = Object.fromEntries(
            wallets.map((wallet, index) => {
                const issuer = issuerDids[index]!;
                return [
                    issuer,
                    (credential: Record<string, unknown>) =>
                        wallet.invoke.issueCredential(credential as never, {
                            verificationMethod: `${issuer}#assertion-key`,
                        }),
                ];
            })
        );
        const credential = await materializeClrVerificationScaleFixture({
            issuerDids,
            learnerDid,
            signers,
            recordCount: 50,
        });
        server.resetCounters();
        return {
            credential,
            issuerDids,
            learnerDid,
            didDocuments,
            counters: server.counters,
            close: server.close,
        };
    } catch (error) {
        await server.close();
        throw error;
    }
};
