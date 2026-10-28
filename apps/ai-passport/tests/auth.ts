import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import { initLearnCard } from '@learncard/init';

import type { Page } from '@playwright/test';

export const BACKEND_URL = process.env.AIP_TEST_BACKEND_URL ?? 'http://localhost:3001';

const require = createRequire(import.meta.url);
const signer = initLearnCard({
    // The SDK initializes both Ed25519 and secp256k1; zero is not a valid secp256k1 scalar.
    seed: '01'.repeat(32),
    didkit: readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')),
});

type ChallengeResponse = {
    audience: string;
    binding: string;
    challenge: string;
};

const issueTestPresentation = async (
    challenge: string,
    audience: string
): Promise<{ did: string; vp: string }> => {
    const wallet = await signer;
    const vp = await wallet.invoke.getDidAuthVp({
        challenge,
        domain: audience,
        proofFormat: 'jwt',
    });
    if (typeof vp !== 'string') {
        throw new Error('Test signer did not return a JWT presentation');
    }

    return { did: wallet.id.did(), vp };
};

export async function createTestPresentation(
    page: Page,
    origin: string
): Promise<{
    binding: string;
    challenge: string;
    did: string;
    vp: string;
}> {
    const challengeResponse = await page.request.post(`${BACKEND_URL}/auth/challenge`, {
        headers: { Origin: origin },
    });

    if (!challengeResponse.ok()) {
        throw new Error(
            `Challenge request failed (${challengeResponse.status()}): ${await challengeResponse.text()}`
        );
    }

    const { audience, binding, challenge } = (await challengeResponse.json()) as ChallengeResponse;
    const { did, vp } = await issueTestPresentation(challenge, audience);

    return { binding, challenge, did, vp };
}

export async function createTestLoginPresentation(
    page: Page,
    returnTo: string
): Promise<{ callbackUrl: string; did: string; vp: string }> {
    const loginUrl = new URL('/auth/login', BACKEND_URL);

    loginUrl.searchParams.set('returnTo', returnTo);

    const loginResponse = await page.request.get(loginUrl.toString(), {
        maxRedirects: 0,
    });

    if (loginResponse.status() !== 302) {
        throw new Error(
            `Login request failed (${loginResponse.status()}): ${await loginResponse.text()}`
        );
    }

    const learnCardUrl = new URL(loginResponse.headers().location);
    const callbackUrl = learnCardUrl.searchParams.get('returnTo');
    const audience = learnCardUrl.searchParams.get('domain');
    const challenge = learnCardUrl.searchParams.get('challenge');

    if (!audience || !callbackUrl || !challenge) {
        throw new Error('Login redirect is missing DID Auth parameters');
    }

    const { did, vp } = await issueTestPresentation(challenge, audience);

    return { callbackUrl, did, vp };
}

export async function createTestSession(
    page: Page,
    origin: string
): Promise<{ did: string; token: string }> {
    const { binding, challenge, did, vp } = await createTestPresentation(page, origin);
    const sessionResponse = await page.request.post(`${BACKEND_URL}/auth/session`, {
        data: { binding, challenge, vp },
        headers: { Origin: origin },
    });

    if (!sessionResponse.ok()) {
        throw new Error(
            `Session request failed (${sessionResponse.status()}): ${await sessionResponse.text()}`
        );
    }

    const { token } = (await sessionResponse.json()) as { token: string };

    return { did, token };
}

export async function authenticateTestPage(page: Page, origin: string): Promise<string> {
    return (await createTestSession(page, origin)).did;
}
