import { initLearnCard } from '@learncard/init';

const { HOLDER_SEED, CREDENTIAL_URI } = process.env;
if (!HOLDER_SEED || !CREDENTIAL_URI) throw new Error('Set HOLDER_SEED and CREDENTIAL_URI');

const holder = await initLearnCard({ seed: HOLDER_SEED, network: true });

// Claim it if it is still waiting. (The LearnCard app does this when the user taps Claim.)
const incoming = await holder.invoke.getIncomingCredentials();
if (incoming.some(offer => offer.uri === CREDENTIAL_URI)) {
    await holder.invoke.acceptCredential(CREDENTIAL_URI);
}

const held = await holder.read.get(CREDENTIAL_URI);

// Ask the credential's refreshService for a newer version. Works for LearnCard-managed
// services and standard 1EdTech refresh services alike.
const result = await holder.invoke.refreshCredential(held);

if (result.status === 'updated') {
    console.log(`Updated to version ${result.managedVersion}: ${result.credential.name}`);
} else if (result.status === 'unchanged') {
    console.log(`Up to date: ${held.name}`);
} else if (result.status === 'unsupported') {
    console.log('This credential has no refresh service.');
} else {
    console.log(`Refresh failed (${result.code}). Retry later: ${result.retryable}`);
}
