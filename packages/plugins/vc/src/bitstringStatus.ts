import { VC, VerificationCheck } from '@learncard/types';
import { getBitstringStatusListEntries, getBitstringStatusListBit } from '@learncard/helpers';

const base64UrlToBytes = (input: string): Uint8Array => {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    return bytes;
};

/**
 * Decodes a Bitstring Status List `encodedList` value: multibase base64url
 * (`u` prefix) wrapping a GZIP-compressed bitstring. Uncompressed lists are
 * returned as-is, per the spec's allowance.
 */
export const decodeBitstringStatusList = async (encodedList: string): Promise<Uint8Array> => {
    const raw = base64UrlToBytes(encodedList.startsWith('u') ? encodedList.slice(1) : encodedList);

    try {
        const stream = new Blob([raw as BlobPart])
            .stream()
            .pipeThrough(new DecompressionStream('gzip'));

        return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
        return raw;
    }
};

/**
 * TypeScript fallback for the status check that DIDKit performs natively.
 * Used when `statusListIndex` is a JSON number, which DIDKit's Rust serde
 * rejects outright ("invalid type: integer, expected a string") even though
 * the credential is otherwise verifiable. Appends structured `status`
 * entries in the same shape DIDKit produces, so consumers like
 * `deriveLifecycleStatus` work unchanged. Fetch failures append a warning —
 * never a silent pass that could render a revoked credential as active.
 */
export const appendBitstringStatusChecks = async (
    result: VerificationCheck,
    credential: VC
): Promise<void> => {
    const entries = getBitstringStatusListEntries(credential);

    for (const entry of entries) {
        try {
            const response = await fetch(entry.statusListCredential);

            if (!response.ok) {
                throw new Error(`Failed to fetch status list (HTTP ${response.status})`);
            }

            const listVc = await response.json();
            const subject = Array.isArray(listVc?.credentialSubject)
                ? listVc.credentialSubject[0]
                : listVc?.credentialSubject;

            if (typeof subject?.encodedList !== 'string') {
                throw new Error('Status list credential has no encodedList');
            }

            const bitstring = await decodeBitstringStatusList(subject.encodedList);
            const isSet = getBitstringStatusListBit(bitstring, Number(entry.statusListIndex));

            result.status = [
                ...(result.status ?? []),
                {
                    entryType: 'BitstringStatusListEntry',
                    statusPurpose: entry.statusPurpose,
                    isSet,
                    statusListCredential: entry.statusListCredential,
                    statusListIndex: String(entry.statusListIndex),
                },
            ];

            if (!result.checks.includes('credentialStatus')) {
                result.checks.push('credentialStatus');
            }

            if (isSet) {
                const state = entry.statusPurpose === 'revocation' ? 'revoked' : 'suspended';
                result.errors.push(`credentialStatus: credential has been ${state}`);
            }
        } catch (error) {
            result.warnings.push(
                `credentialStatus: could not be determined (${(error as Error).message})`
            );
        }
    }
};
