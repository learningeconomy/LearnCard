/**
 * Shamir Secret Sharing operations
 */

import { split, combine } from 'shamir-secret-sharing';
import { hexToBytes, bytesToHex } from './crypto';

export const SSS_TOTAL_SHARES = 4;
export const SSS_THRESHOLD = 2;

export interface SSSShares {
    deviceShare: string;
    authShare: string;
    recoveryShare: string;
    emailShare: string;
}

export async function splitPrivateKey(privateKeyHex: string): Promise<SSSShares> {
    const privateKeyBytes = hexToBytes(privateKeyHex);

    const shares = await split(privateKeyBytes, SSS_TOTAL_SHARES, SSS_THRESHOLD);

    return {
        deviceShare: bytesToHex(shares[0]),
        authShare: bytesToHex(shares[1]),
        recoveryShare: bytesToHex(shares[2]),
        emailShare: bytesToHex(shares[3]),
    };
}

export async function reconstructPrivateKey(share1Hex: string, share2Hex: string): Promise<string> {
    const share1 = hexToBytes(share1Hex);
    const share2 = hexToBytes(share2Hex);

    const reconstructed = await combine([share1, share2]);

    return bytesToHex(reconstructed);
}

export async function reconstructFromShares(shares: string[]): Promise<string> {
    if (shares.length < SSS_THRESHOLD) {
        throw new Error(`Need at least ${SSS_THRESHOLD} shares to reconstruct key`);
    }

    const shareBytes = shares.slice(0, SSS_THRESHOLD).map(hexToBytes);
    const reconstructed = await combine(shareBytes);

    return bytesToHex(reconstructed);
}
