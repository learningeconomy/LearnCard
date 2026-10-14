const DATABASE = 'learncard-resume-publication-v1';
const STORE = 'encrypted-attempts';
export class ResumeCheckpointExistsError extends Error {
    constructor() {
        super('Resume publication already in progress');
    }
}
/** Large PDF chunk checkpoints exceed localStorage; persist only owner ciphertext in IndexedDB. */
const openDatabase = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE);
        };
        request.onerror = () => reject(new Error('Resume checkpoint unavailable'));
        request.onblocked = () => reject(new Error('Resume checkpoint unavailable'));
        request.onsuccess = () => resolve(request.result);
    });
const transaction = async <T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
    const database = await openDatabase();
    try {
        return await new Promise<T>((resolve, reject) => {
            const tx = database.transaction(STORE, mode);
            const request = operation(tx.objectStore(STORE));
            let value: T;
            request.onsuccess = () => {
                value = request.result;
            };
            request.onerror = () =>
                reject(
                    request.error?.name === 'ConstraintError'
                        ? new ResumeCheckpointExistsError()
                        : new Error('Resume checkpoint unavailable')
                );
            tx.oncomplete = () => resolve(value);
            tx.onabort = tx.onerror = () =>
                reject(
                    tx.error?.name === 'ConstraintError'
                        ? new ResumeCheckpointExistsError()
                        : new Error('Resume checkpoint unavailable')
                );
        });
    } finally {
        database.close();
    }
};
export const readResumeCheckpoint = async (key: string): Promise<string | undefined> =>
    transaction('readonly', store => store.get(key));
export const writeResumeCheckpoint = async (key: string, encrypted: string): Promise<void> => {
    await transaction('readwrite', store => store.put(encrypted, key));
};
export const deleteResumeCheckpoint = async (key: string): Promise<void> => {
    await transaction('readwrite', store => store.delete(key));
};

/** Atomic initial insert prevents two browser tabs from replacing each other's fresh attempts. */
export const createResumeCheckpoint = async (key: string, encrypted: string): Promise<void> => {
    await transaction('readwrite', store => store.add(encrypted, key));
};
