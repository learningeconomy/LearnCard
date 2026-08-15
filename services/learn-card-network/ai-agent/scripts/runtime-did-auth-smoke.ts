import { readFile } from 'node:fs/promises';

import { initLearnCard } from '@learncard/init';

const didkit = await readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));
const issuer = await initLearnCard({
    didkit,
    seed: '11'.repeat(32),
    allowRemoteContexts: true,
});
const verifier = await initLearnCard({ didkit, allowRemoteContexts: true });
const challenge = 'learncard-ai-agent-runtime-smoke';
const domain = 'https://runtime-smoke.learncard.local';
const vpJwt = await issuer.invoke.getDidAuthVp({
    proofFormat: 'jwt',
    challenge,
    domain,
});

if (typeof vpJwt !== 'string') throw new Error('Runtime smoke could not issue a DID Auth VP.');

const verification = await verifier.invoke.verifyPresentation(vpJwt, {
    proofFormat: 'jwt',
    challenge,
    domain,
    proofPurpose: 'authentication',
});

if (
    verification.warnings.length > 0 ||
    verification.errors.length > 0 ||
    !verification.checks.includes('JWS')
) {
    throw new Error('Runtime smoke could not verify a DID Auth VP.');
}

console.log(JSON.stringify({ ok: true, check: 'did-auth-vp' }));
