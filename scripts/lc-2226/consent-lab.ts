/** Local SDK lab for the existing consent read/withdraw boundary. */
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mode = process.argv[2] ?? 'preflight';
if (!['preflight', 'check', 'baseline'].includes(mode)) {
    throw new Error(
        'Usage: bun --conditions=development scripts/lc-2226/consent-lab.ts [preflight|check]'
    );
}

const network = new URL(process.env.LC2226_NETWORK_URL ?? 'http://localhost:4000/trpc');
const cloud = new URL(process.env.LC2226_CLOUD_URL ?? 'http://localhost:4100/trpc');
for (const url of [network, cloud]) {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.protocol !== 'http:') {
        throw new Error('This lab only permits HTTP loopback endpoints.');
    }
}

const health = new URL('/api/health-check', network);
try {
    const response = await fetch(health, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(`Brain service ready at ${network.href}`);
} catch {
    console.error(
        `Brain service unavailable at ${health.href}. Start the local stack before running this lab.`
    );
    process.exit(1);
}
if (mode === 'preflight') process.exit(0);

const { initLearnCard } = await import('@learncard/init');
const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);
const suffix = randomBytes(5).toString('hex');
const actors = await Promise.all(
    ['partner', 'learner', 'outsider'].map(async role => {
        const wallet = await initLearnCard({
            seed: randomBytes(32).toString('hex'),
            didkit,
            network: network.href,
            cloud: { url: cloud.href },
        });
        await wallet.invoke.createProfile({
            profileId: `lc2226-${role}-${suffix}`,
            displayName: `LC-2226 ${role}`,
        });
        return wallet;
    })
);
const [partner, learner, outsider] = actors;
if (!partner || !learner || !outsider) throw new Error('Could not initialize lab actors');

const contractUri = await partner.invoke.createContract({
    name: `LC-2226 consent boundary ${suffix}`,
    contract: {
        read: {
            personal: { name: { required: false } },
            credentials: { categories: { Achievement: { required: false } } },
        },
        write: { personal: {}, credentials: { categories: {} } },
    },
});
const { termsUri } = await learner.invoke.consentToContract(contractUri, {
    terms: {
        read: {
            personal: { name: 'LC-2226 synthetic learner' },
            credentials: {
                categories: { Achievement: { sharing: false, shareAll: false, shared: [] } },
                sharing: false,
                shareAll: false,
            },
        },
        write: { personal: {}, credentials: { categories: {} } },
    },
});
const learnerProfile = await learner.invoke.getProfile();
if (!learnerProfile) throw new Error('Learner profile not found');

const inspect = async () => ({
    forContract: (await partner.invoke.getConsentFlowData(contractUri)).records,
    forDid: (await partner.invoke.getConsentFlowDataForDid(learnerProfile.did)).records,
    all: (await partner.invoke.getAllConsentFlowData()).records,
});
const before = await inspect();
if (
    Object.values(before).some(
        records => records.length !== 1 || records[0]?.personal.name !== 'LC-2226 synthetic learner'
    )
) {
    throw new Error('Expected one readable live consent on each route before withdrawal.');
}
const unrelated = await outsider.invoke.getAllConsentFlowData();
await learner.invoke.withdrawConsent(termsUri);
const after = await inspect();
const retained = Object.values(after).some(records => records.length > 0);
console.log(
    JSON.stringify(
        {
            contractUri,
            termsUri,
            beforeWithdrawal: before,
            afterWithdrawal: after,
            outsiderRecordCount: unrelated.records.length,
            result: retained
                ? 'GAP: data still returned after withdrawal'
                : 'PASS: withdrawn data excluded',
        },
        null,
        2
    )
);
// Leave synthetic profiles and consent history for inspection; no destructive cleanup.
process.exitCode = retained || unrelated.records.length > 0 ? 2 : 0;
