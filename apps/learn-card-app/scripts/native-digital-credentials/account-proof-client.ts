/** Development-only fixture setup. Never imported by the production app or provider. */
import { App } from '@capacitor/app';
import { environment } from '../../src/config/environment';
import { getResolvedTenantConfig } from '../../src/config/tenantConfigState';
import {
    walletStore,
    switchedProfileStore,
} from '../../../../packages/learn-card-base/src/stores/walletStore';
import { issueLabCredential } from '../../android/digital-credentials-lab/web/fixture';
import {
    accountOwner,
    compactCredential,
    type DigitalCredentialWallet,
} from '../../src/native-digital-credentials/inventory';
import { readNativeInventory } from '../../src/native-digital-credentials/runtime';

interface FixtureIndexEntry {
    id: string;
    uri: string;
    title?: string;
    category?: string;
}
interface FixtureWallet extends DigitalCredentialWallet {
    index: {
        LearnCloud: {
            get: () => Promise<FixtureIndexEntry[]>;
            add: (entry: FixtureIndexEntry) => Promise<unknown>;
            remove: (id: string) => Promise<unknown>;
        };
    };
    store: { LearnCloud: { uploadEncrypted: (credential: unknown) => Promise<string> } };
}

const FIXTURE_ID = '__android_native_account_proof__';
const TITLE = 'Native account course completion';

const context = async () => {
    if (!environment.DEV || (await App.getInfo()).id !== 'com.learncard.app.dctest')
        throw new Error('Only the dedicated native development app is supported');
    const config = getResolvedTenantConfig();
    for (const endpoint of [
        config.apis.brainService,
        config.apis.cloudService,
        config.apis.lcaApi,
    ]) {
        if (!['localhost', '127.0.0.1'].includes(new URL(endpoint).hostname))
            throw new Error('Only local test services are supported');
    }
    if (switchedProfileStore.get.switchedDid()) throw new Error('Use a personal test account');
    const wallet = walletStore.get.wallet();
    if (!wallet) throw new Error('Wait for account initialization');
    const profile = await wallet.invoke.getProfile();
    if (!profile?.profileId.startsWith('android-native-'))
        throw new Error('Use a disposable android-native-* test profile');
    return wallet as unknown as FixtureWallet;
};

/** Store a synthetic credential through this account's real encrypted storage and index. */
export const provision = async () => {
    const wallet = await context();
    const existing = (await wallet.index.LearnCloud.get()).find(
        record => record.id === FIXTURE_ID || record.title === TITLE
    );
    if (!existing) {
        const pair = wallet.id.keypair('ed25519');
        const issued = await issueLabCredential({ kty: pair.kty, crv: pair.crv, x: pair.x });
        const verified = await wallet.invoke.verifySdJwtVc(issued.compact);
        if (verified.errors.length) throw new Error('Synthetic issuer verification failed');
        const uri = await wallet.store.LearnCloud.uploadEncrypted(issued.envelope);
        await wallet.index.LearnCloud.add({
            id: FIXTURE_ID,
            uri,
            title: TITLE,
            category: 'Learning History',
        });
        if (compactCredential(await wallet.read.get(uri)) !== issued.compact)
            throw new Error('Encrypted readback mismatch');
    }
    return inspect();
};

/** Safe proof observations; never return credentials, private keys or account storage URIs. */
export const inspect = async () => {
    const wallet = await context();
    const records = await wallet.index.LearnCloud.get();
    const record = records.find(value => value.id === FIXTURE_ID || value.title === TITLE);
    const compact = record ? compactCredential(await wallet.read.get(record.uri)) : undefined;
    const verification = compact ? await wallet.invoke.verifySdJwtVc(compact) : undefined;
    const inventory = await readNativeInventory();
    return {
        signedIn: true,
        indexCount: records.length,
        fixturePresent: Boolean(record),
        issuerVerified: verification?.errors.length === 0,
        registered: inventory?.entries.length ?? 0,
        ownerMatches:
            inventory?.owner === accountOwner(wallet as unknown as DigitalCredentialWallet),
    };
};

/** Delete only this fixture's index entry, to exercise registry removal without touching other data. */
export const removeFixture = async () => {
    const wallet = await context();
    for (const record of await wallet.index.LearnCloud.get()) {
        if (record.id === FIXTURE_ID || record.title === TITLE)
            await wallet.index.LearnCloud.remove(record.id);
    }
    return { removed: true };
};
