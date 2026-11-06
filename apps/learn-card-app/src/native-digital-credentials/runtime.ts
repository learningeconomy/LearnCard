import localforage from 'localforage';
import { getLogger } from 'learn-card-base';
import { nativeDigitalCredentials } from './plugin';
import {
    accountOwner,
    buildAccountInventory,
    type AccountInventory,
    type DigitalCredentialWallet,
    type InventoryCacheEntry,
    type InventoryScanProgress,
} from './inventory';

const log = getLogger('native-credential-inventory');

// Private app storage contains only the opaque-ID ↔ account URI mapping and hashes.
// Credential bodies are always obtained afresh through the account's encrypted read plane.
const KEY = 'learncard-native-credential-inventory-v1';
let refreshCache:
    | {
          owner: string;
          entries: Map<string, InventoryCacheEntry>;
          scanProgress: InventoryScanProgress;
      }
    | undefined;
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.catch(() => undefined);
    return result;
};

export const readNativeInventory = (): Promise<AccountInventory | null> => localforage.getItem(KEY);

export const clearNativeInventory = (): Promise<void> => {
    refreshCache = undefined;
    // Start native invalidation immediately, before any outstanding inventory read completes.
    const clearing = nativeDigitalCredentials.clear();
    return serial(async () => {
        await clearing;
        await localforage.removeItem(KEY);
    });
};

export const synchronizeNativeInventory = (
    wallet: DigitalCredentialWallet,
    isCurrent: () => boolean,
    title: string
): Promise<{ retryRequired: boolean }> =>
    serial(async () => {
        const previous = await readNativeInventory();
        if (!isCurrent()) return { retryRequired: false };
        if (previous && previous.owner !== accountOwner(wallet)) {
            await nativeDigitalCredentials.clear();
            await localforage.removeItem(KEY);
        }
        const owner = accountOwner(wallet);
        if (refreshCache?.owner !== owner)
            refreshCache = { owner, entries: new Map(), scanProgress: {} };
        let rejected = 0;
        const refreshed = await buildAccountInventory(wallet, previous ?? undefined, title, {
            cache: refreshCache.entries,
            scanProgress: refreshCache.scanProgress,
            onIssue: reason => {
                if (reason === 'projection') rejected++;
            },
        });
        if (rejected) log.warn('Native credential projections rejected', { count: rejected });
        const inventory: AccountInventory = { owner: refreshed.owner, entries: refreshed.entries };
        const result = { retryRequired: refreshed.retryRequired };
        if (!isCurrent()) return { retryRequired: false };
        const state = await nativeDigitalCredentials.status();
        const registered = state.registeredEntryIds ?? [];
        if (
            JSON.stringify(previous) === JSON.stringify(inventory) &&
            registered.length === inventory.entries.length &&
            inventory.entries.every(entry => registered.includes(entry.id))
        )
            return result;
        // Persist before advertising; a process death can never leave an OS entry without its mapping.
        await localforage.setItem(KEY, inventory);
        if (!isCurrent()) return { retryRequired: false };
        if (inventory.entries.length)
            await nativeDigitalCredentials.register({
                entries: inventory.entries.map(entry => entry.projection),
            });
        else await nativeDigitalCredentials.clear();
        // A switch during an asynchronous platform mutation must not republish the previous account.
        if (!isCurrent()) await nativeDigitalCredentials.clear();
        return result;
    });
