import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initLearnCard } from '@learncard/init';
import {
    exportLearnCardBundle,
    importLearnCardBundle,
    restoreLearnCardFromBundle,
} from '@learncard/holder-continuity';

if (!process.env.SECURE_SEED) throw new Error('Set SECURE_SEED');
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
await learnCard.invoke.getProfile(); // Load the network identity before comparing DIDs.
const original = learnCard.id.did();
// Example only: choose a unique, strong password for a real export.
const password = 'correct horse battery staple';
const directory = await mkdtemp(join(tmpdir(), 'learncard-bundle-'));
try {
    const path = join(directory, 'learncard-export.zip');
    await exportLearnCardBundle(learnCard, { out: path, password });
    const freshWallet = await initLearnCard({
        seed: randomBytes(32).toString('hex'),
        network: true,
    });
    const report = await importLearnCardBundle(path, {
        password,
        wallet: freshWallet,
        verifyBeforeImport: true,
    });
    if (report.errors.length) throw new Error('Some bundle entries could not be imported');
    console.log('imported:', report.importedCredentials);
    const restored = await restoreLearnCardFromBundle(path, { password, init: { network: true } });
    await restored.invoke.getProfile();
    console.log('restored:', restored.id.did() === original);
} finally {
    await rm(directory, { recursive: true, force: true });
}
