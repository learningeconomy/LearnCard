import { beforeAll, afterAll, expect, test } from 'vitest';
import { execa } from 'execa';
import { taggedDescribe } from '../../helpers/tags';
import { getLearnCardForUser } from '../../helpers/learncard.helpers';
import type { VC } from '@learncard/types';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const COORDINATOR_URL = 'http://localhost:4005';
const COMPOSE_URL =
    'https://raw.githubusercontent.com/digitalcredentials/docs/main/deployment-guide/docker-compose-files/simple-issuer-compose.yaml';

interface DccUnsignedVC {
    '@context': (string | Record<string, unknown>)[];
    id?: string;
    type: string[];
    name?: string;
    issuer:
        | string
        | {
              id: string;
              type?: string[];
              name?: string;
              url?: string;
              image?: string;
          };
    validFrom?: string;
    issuanceDate?: string;
    credentialSubject: Record<string, unknown>;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2_000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timeout);
    }
}

async function waitForCoordinator(timeoutMs = 90_000): Promise<void> {
    const start = Date.now();

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (Date.now() - start > timeoutMs) throw new Error('DCC coordinator not ready in time');

        try {
            const res = await fetchWithTimeout(COORDINATOR_URL, { method: 'GET' }, 1_500);
            // Consider any non-5xx response as readiness (404 is fine)
            if (res && res.status < 500) return;
        } catch (e) {
            // ignore until next retry
        }

        await new Promise(r => setTimeout(r, 2_000));
    }
}

async function downloadComposeFile(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'dcc-issuer-'));
    const composePath = join(dir, 'docker-compose.yml');

    const resp = await fetch(COMPOSE_URL);
    if (!resp.ok) throw new Error(`Failed to download DCC compose: ${resp.status}`);
    const yaml = await resp.text();

    await writeFile(composePath, yaml, 'utf8');
    return composePath;
}

taggedDescribe('DCC Interoperability: credential issuing', ['@interop', '@dcc'], () => {
    let composePath: string;

    beforeAll(async () => {
        composePath = await downloadComposeFile();
        await execa`docker compose -f ${composePath} up -d`;
        await waitForCoordinator();
    }, 120_000);

    afterAll(async () => {
        if (composePath) {
            await execa`docker compose -f ${composePath} down`;
        }
    }, 60_000);

    test(
        'issues a credential and returns a proof',
        async () => {
            const unsignedVc: DccUnsignedVC = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                id: 'urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c',
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                name: 'DCC Test Credential',
                issuer: {
                    type: ['Profile'],
                    id: 'did:key:z6MkhVTX9BF3NGYX6cc7jWpbNnR7cAjH8LUffabZP8Qu4ysC',
                    name: 'Digital Credentials Consortium Test Issuer',
                    url: 'https://dcconsortium.org',
                    image:
                        'https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png',
                },
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    type: ['AchievementSubject'],
                    achievement: {
                        id: 'urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922',
                        type: ['Achievement'],
                        achievementType: 'Diploma',
                        name: 'Badge',
                        description:
                            'This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.',
                        criteria: {
                            type: 'Criteria',
                            narrative:
                                'This credential was issued to a student that demonstrated proficiency in the Python programming language.',
                        },
                        image: {
                            id: 'https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png',
                            type: 'Image',
                        },
                    },
                    name: 'Jane Doe',
                },
            };

            const res = await fetch(`${COORDINATOR_URL}/instance/test/credentials/issue`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(unsignedVc),
            });

            expect([200, 201]).toContain(res.status);
            const vc = (await res.json()) as Record<string, unknown>;

            expect(vc).toBeTruthy();
            expect(vc).toHaveProperty('proof');

            const proof = vc.proof as Record<string, unknown> | undefined;
            expect(proof && typeof proof).toBe('object');
            expect(proof).toHaveProperty('type');
            expect(typeof proof?.type).toBe('string');

            console.log('VC', vc);
            // Verify the issued credential with a LearnCard instance
            const verifier = await getLearnCardForUser('c');
            const verification = await verifier.invoke.verifyCredential(vc as unknown as VC);

            console.log('Verification', verification);
            expect(verification.warnings).toHaveLength(0);
            expect(verification.errors).toHaveLength(0);
            expect(verification.checks).toContain('proof');
        },
        60_000
    );
});
 