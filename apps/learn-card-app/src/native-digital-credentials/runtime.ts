import localforage from 'localforage';
import { nativeDigitalCredentials } from './plugin';
import {
    accountOwner,
    buildAccountInventory,
    type AccountInventory,
    type DigitalCredentialWallet,
} from './inventory';

// Private app storage contains only the opaque-ID ↔ account URI mapping and hashes.
// Credential bodies are always obtained afresh through the account's encrypted read plane.
const KEY = 'learncard-native-credential-inventory-v1';
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.catch(() => undefined);
    return result;
};

export const readNativeInventory = (): Promise<AccountInventory | null> => localforage.getItem(KEY);

export const clearNativeInventory = (): Promise<void> => {
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
): Promise<void> =>
    serial(async () => {
        const previous = await readNativeInventory();
        if (!isCurrent()) return;
        if (previous && previous.owner !== accountOwner(wallet)) {
            await nativeDigitalCredentials.clear();
            await localforage.removeItem(KEY);
        }
        const inventory = await buildAccountInventory(wallet, previous ?? undefined, title);
        if (!isCurrent()) return;
        const state = await nativeDigitalCredentials.status();
        const registered = state.registeredEntryIds ?? [];
        if (
            JSON.stringify(previous) === JSON.stringify(inventory) &&
            registered.length === inventory.entries.length &&
            inventory.entries.every(entry => registered.includes(entry.id))
        )
            return;
        // Persist before advertising; a process death can never leave an OS entry without its mapping.
        await localforage.setItem(KEY, inventory);
        if (!isCurrent()) return;
        if (inventory.entries.length)
            await nativeDigitalCredentials.register({
                entries: inventory.entries.map(entry => entry.projection),
            });
        else await nativeDigitalCredentials.clear();
        // A switch during an asynchronous platform mutation must not republish the previous account.
        if (!isCurrent()) await nativeDigitalCredentials.clear();
    });
