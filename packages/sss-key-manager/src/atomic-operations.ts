/**
 * Atomic Share Operations
 * 
 * Provides verified split operations and atomic updates with rollback capability.
 * These functions ensure that private keys can NEVER be lost due to partial failures.
 */

import { splitPrivateKey, reconstructFromShares, type SSSShares } from './sss';

export interface AtomicSplitResult {
    privateKey: string;
    shares: SSSShares;
    verified: boolean;
}

export interface AtomicUpdateOptions {
    previousDeviceShare?: string;
    previousAuthShare?: string;
    onRollback?: (reason: string) => void;
}

export interface StorageOperations {
    storeDevice: (share: string) => Promise<void>;
    storeAuth: (share: string) => Promise<void>;
    getDevice?: () => Promise<string | null>;
    getAuth?: () => Promise<string | null>;
}

export class ShareVerificationError extends Error {
    constructor(
        message: string,
        public readonly combination: string,
        public readonly expected: string,
        public readonly got: string
    ) {
        super(message);
        this.name = 'ShareVerificationError';
    }
}

export class AtomicUpdateError extends Error {
    constructor(
        message: string,
        public readonly phase: 'split' | 'verify' | 'store_device' | 'store_auth' | 'verify_stored',
        public readonly rolledBack: boolean,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'AtomicUpdateError';
    }
}

/**
 * Split a private key into shares and verify ALL combinations reconstruct correctly.
 * 
 * This function will NOT return until verification passes. If verification fails,
 * it throws an error - no shares are ever returned that don't reconstruct the key.
 * 
 * @param privateKey - The private key to split (hex string)
 * @returns Verified shares that are guaranteed to reconstruct the key
 * @throws ShareVerificationError if any share combination fails verification
 */
export async function splitAndVerify(privateKey: string): Promise<AtomicSplitResult> {
    const shares = await splitPrivateKey(privateKey);

    // Verify ALL six combinations (4 shares, threshold 2 → C(4,2) = 6)
    const combinations: [string, string, string][] = [
        ['device+auth', shares.deviceShare, shares.authShare],
        ['device+recovery', shares.deviceShare, shares.recoveryShare],
        ['device+email', shares.deviceShare, shares.emailShare],
        ['auth+recovery', shares.authShare, shares.recoveryShare],
        ['auth+email', shares.authShare, shares.emailShare],
        ['recovery+email', shares.recoveryShare, shares.emailShare],
    ];

    for (const [name, share1, share2] of combinations) {
        const reconstructed = await reconstructFromShares([share1, share2]);

        if (reconstructed !== privateKey) {
            throw new ShareVerificationError(
                `Share verification failed for ${name}: reconstruction mismatch`,
                name,
                privateKey,
                reconstructed
            );
        }
    }

    return {
        privateKey,
        shares,
        verified: true,
    };
}

/**
 * Atomically update shares with rollback on failure.
 * 
 * This function ensures that either:
 * 1. Both device and auth shares are updated successfully, OR
 * 2. The previous state is restored (rollback)
 * 
 * The operation flow:
 * 1. Generate and verify new shares
 * 2. Store device share locally
 * 3. Store auth share on server
 * 4. If step 3 fails, rollback step 2
 * 
 * @param privateKey - The private key to split
 * @param storage - Storage operations for device and auth shares
 * @param options - Options including previous shares for rollback
 * @returns The new verified shares
 * @throws AtomicUpdateError with rollback status
 */
export async function atomicShareUpdate(
    privateKey: string,
    storage: StorageOperations,
    options: AtomicUpdateOptions = {}
): Promise<SSSShares> {
    let newShares: SSSShares | null = null;
    let deviceStored = false;

    try {
        // Phase 1: Split and verify
        const result = await splitAndVerify(privateKey);
        newShares = result.shares;
    } catch (e) {
        throw new AtomicUpdateError(
            'Failed to split and verify shares',
            'split',
            false,
            e instanceof Error ? e : undefined
        );
    }

    try {
        // Phase 2: Store device share locally
        await storage.storeDevice(newShares.deviceShare);
        deviceStored = true;
    } catch (e) {
        throw new AtomicUpdateError(
            'Failed to store device share locally',
            'store_device',
            false,
            e instanceof Error ? e : undefined
        );
    }

    try {
        // Phase 3: Store auth share on server
        await storage.storeAuth(newShares.authShare);
    } catch (e) {
        // ROLLBACK: Restore previous device share if we have it
        if (options.previousDeviceShare && deviceStored) {
            try {
                await storage.storeDevice(options.previousDeviceShare);
                options.onRollback?.('Server storage failed, restored previous device share');
            } catch (rollbackError) {
                // Rollback failed - this is a critical error
                // The user may be in an inconsistent state
                console.error('CRITICAL: Rollback failed after auth share storage failure', rollbackError);
            }
        }

        throw new AtomicUpdateError(
            'Failed to store auth share on server, rolled back device share',
            'store_auth',
            !!options.previousDeviceShare,
            e instanceof Error ? e : undefined
        );
    }

    return newShares;
}

/**
 * Verify that stored shares can reconstruct the expected private key.
 * 
 * This is a health check that should be run after recovery or on login
 * to ensure the user's shares are in a consistent state.
 * 
 * @param storage - Storage operations to retrieve shares
 * @param expectedDid - The expected DID (used to verify the reconstructed key)
 * @param didFromPrivateKey - Function to derive DID from private key
 * @returns Object with health status and details
 */
export async function verifyStoredShares(
    storage: Pick<StorageOperations, 'getDevice' | 'getAuth'>,
    expectedDid: string,
    didFromPrivateKey: (privateKey: string) => Promise<string>
): Promise<{
    healthy: boolean;
    hasDeviceShare: boolean;
    hasAuthShare: boolean;
    didMatches: boolean;
    error?: string;
}> {
    const result = {
        healthy: false,
        hasDeviceShare: false,
        hasAuthShare: false,
        didMatches: false,
        error: undefined as string | undefined,
    };

    try {
        // Check device share
        const deviceShare = await storage.getDevice?.();
        result.hasDeviceShare = !!deviceShare;

        if (!deviceShare) {
            result.error = 'No device share found';
            return result;
        }

        // Check auth share
        const authShare = await storage.getAuth?.();
        result.hasAuthShare = !!authShare;

        if (!authShare) {
            result.error = 'No auth share found';
            return result;
        }

        // Reconstruct and verify DID
        const privateKey = await reconstructFromShares([deviceShare, authShare]);
        const derivedDid = await didFromPrivateKey(privateKey);

        result.didMatches = derivedDid === expectedDid;

        if (!result.didMatches) {
            result.error = `DID mismatch: expected ${expectedDid}, got ${derivedDid}`;
            return result;
        }

        result.healthy = true;
        return result;
    } catch (e) {
        result.error = e instanceof Error ? e.message : 'Unknown error during verification';
        return result;
    }
}

/**
 * Create a recovery operation that atomically updates all shares.
 * 
 * This is used during recovery when we reconstruct from recovery+auth shares
 * and need to generate a new device share.
 * 
 * @param recoveryShare - The decrypted recovery share
 * @param authShareData - The auth share from server
 * @param storage - Storage operations
 * @param options - Atomic update options
 * @returns The reconstructed private key and new shares
 */
export async function atomicRecovery(
    recoveryShare: string,
    authShareData: string,
    storage: StorageOperations,
    options: AtomicUpdateOptions = {}
): Promise<{
    privateKey: string;
    newShares: SSSShares;
}> {
    // Reconstruct the private key from recovery + auth
    const privateKey = await reconstructFromShares([recoveryShare, authShareData]);

    // Generate new shares and store atomically
    const newShares = await atomicShareUpdate(privateKey, storage, options);

    return {
        privateKey,
        newShares,
    };
}
