import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { initLearnCard } from '@learncard/init';
import type { ProofOptions } from '@learncard/didkit-plugin';
import type {
    IssueInboxCredentialResponseType,
    JWKWithPrivateKey,
    JWE,
    VC,
    VP,
} from '@learncard/types';

import type { LearnCard } from './learncard.helpers';

export const sendCredentialsViaInbox = async (
    learnCard: LearnCard,
    token: string,
    recipientEmail: string,
    credentialNames: string[]
): Promise<IssueInboxCredentialResponseType[]> => {
    const responses: IssueInboxCredentialResponseType[] = [];
    for (const name of credentialNames) {
        const cred = await learnCard.invoke.newCredential({
            type: 'achievement',
            name,
            did: learnCard.id.did(),
        });
        const credentialToSend = await learnCard.invoke.issueCredential(cred);

        const payload = {
            credential: credentialToSend,
            recipient: { type: 'email', value: recipientEmail },
        };

        // Send the boost using the HTTP route
        const response = await fetch(`http://localhost:4000/api/inbox/issue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const inboxIssuanceResponse = await response.json();

        responses.push(inboxIssuanceResponse);
    }
    return responses;
};

let p256FixtureId = 0;

type DidAuthHolder = { did: string; verificationMethod: string };

export type P256DidAuthFixture = {
    keyHolder: DidAuthHolder;
    webHolder: DidAuthHolder;
    unauthorizedWebHolder: DidAuthHolder;
    removeAuthentication: () => void;
    decryptDelivery: (delivery: JWE) => Promise<VC>;
    sign: (
        holder: DidAuthHolder,
        request: { challenge: string; domain: string },
        overrides?: Partial<ProofOptions>
    ) => Promise<VP>;
    close: () => Promise<void>;
};

/** Test-only public DID documents; the private key never leaves the signing process. */
export const startP256DidAuthFixture = async (): Promise<P256DidAuthFixture> => {
    const require = createRequire(import.meta.url);
    const signer = await initLearnCard({
        didkit: readFile(
            require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
        ),
    });
    // Public test key from lib/ssi/tests/secp256r1-2021-03-18.json; never use in production.
    const key: JWKWithPrivateKey = JSON.parse(
        await readFile(new URL('../fixtures/secp256r1-2021-03-18.json', import.meta.url), 'utf8')
    );
    const keyDid = signer.invoke.keyToDid('key', key);
    const keyHolder = {
        did: keyDid,
        verificationMethod: await signer.invoke.keyToVerificationMethod('key', key),
    };
    // Authentication and delivery encryption use separate keys.
    const deliveryKey = signer.invoke.generateEd25519KeyFromBytes(new Uint8Array(32).fill(42));
    const deliveryDid = signer.invoke.keyToDid('key', deliveryKey);
    const deliveryDocument = await signer.invoke.resolveDid(deliveryDid);
    const keyAgreement = deliveryDocument.keyAgreement?.[0];
    if (!keyAgreement || typeof keyAgreement === 'string') {
        throw new Error('Missing X25519 key-agreement method in delivery fixture');
    }
    const documents = new Map<
        string,
        {
            '@context': string[];
            id: string;
            verificationMethod: {
                id: string;
                controller: string;
                type: string;
                publicKeyMultibase: string;
            }[];
            authentication?: string[];
            assertionMethod: string[];
            keyAgreement: typeof deliveryDocument.keyAgreement;
        }
    >();
    const server = createServer((req, res) => {
        const document = documents.get(req.url ?? '');
        if (!document) {
            res.writeHead(404).end();
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/did+json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(document));
    });

    // Compose maps localhost to host-gateway. An alternative localhost-prefixed single-label
    // alias must resolve to this host in both the runner and Brain container (SSI uses HTTP).
    const host = process.env.E2E_DID_WEB_HOST ?? 'localhost';
    if (!/^localhost(?:-[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)?$/i.test(host)) {
        throw new Error(
            'E2E_DID_WEB_HOST must be localhost or a localhost-prefixed single-label alias (e.g. localhost-e2e)'
        );
    }
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(Number(process.env.E2E_DID_WEB_PORT ?? 0), '0.0.0.0', () => {
            server.off('error', reject);
            resolve();
        });
    });
    const { port } = server.address() as AddressInfo;
    const prefix = `lc-2167-${++p256FixtureId}`;
    const createWebHolder = (name: string) => {
        const path = `/${prefix}/${name}/did.json`;
        const did = `did:web:${host}%3A${port}:${prefix}:${name}`;
        const verificationMethod = `${did}#key-1`;
        documents.set(path, {
            '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'],
            keyAgreement: [{ ...keyAgreement, id: `${did}#delivery`, controller: did }],
            id: did,
            verificationMethod: [
                {
                    id: verificationMethod,
                    controller: did,
                    type: 'Multikey',
                    publicKeyMultibase: keyDid.slice('did:key:'.length),
                },
            ],
            authentication: [verificationMethod],
            assertionMethod: [verificationMethod],
        });
        return { did, verificationMethod, path };
    };
    const webHolder = createWebHolder('holder');
    const unauthorizedWebHolder = createWebHolder('unauthorized');

    return {
        keyHolder,
        webHolder,
        unauthorizedWebHolder,
        decryptDelivery: delivery => signer.invoke.decryptDagJwe<VC>(delivery, [deliveryKey]),
        // Sign first, then remove the relationship before this DID is ever seen by Brain.
        // Recovery uses a separate authorized DID, so resolver caches cannot mask the result.
        removeAuthentication: () => {
            const document = documents.get(unauthorizedWebHolder.path);
            if (!document) {
                throw new Error(
                    `Missing P-256 DID fixture document at ${unauthorizedWebHolder.path}; cannot remove authentication`
                );
            }
            delete document.authentication;
        },
        sign: (
            holder: DidAuthHolder,
            request: { challenge: string; domain: string },
            overrides: Partial<ProofOptions> = {}
        ) =>
            signer.invoke.issuePresentation(
                {
                    '@context': ['https://www.w3.org/ns/credentials/v2'],
                    type: ['VerifiablePresentation'],
                    holder: holder.did,
                },
                {
                    type: 'DataIntegrityProof',
                    cryptosuite: 'ecdsa-rdfc-2019',
                    proofPurpose: 'authentication',
                    verificationMethod: holder.verificationMethod,
                    ...request,
                    ...overrides,
                },
                key
            ),
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close(error => (error ? reject(error) : resolve()));
                server.closeAllConnections();
            }),
    };
};
