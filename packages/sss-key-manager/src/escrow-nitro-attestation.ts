import 'reflect-metadata';
import { decode, encode } from 'cborg';
import {
    BasicConstraintsExtension,
    KeyUsagesExtension,
    KeyUsageFlags,
    X509Certificate,
} from '@peculiar/x509';
import { base64ToBuffer, bufferToBase64 } from './crypto';
import type { EscrowAttestationPolicy } from './types';

export type NitroAttestationReason =
    | 'cbor'
    | 'cose'
    | 'alg'
    | 'chain'
    | 'root'
    | 'signature'
    | 'pcr'
    | 'debug'
    | 'nonce'
    | 'freshness'
    | 'user-data';

/** A fail-closed attestation failure with a stable, non-sensitive reason. */
export class NitroAttestationError extends Error {
    constructor(public readonly reason: NitroAttestationReason) {
        super(`Nitro attestation rejected: ${reason}`);
        this.name = 'NitroAttestationError';
    }
}

const AWS_ROOT_SHA256 = '641a0321a3e244efe456463195d606317ed7cdcc3c1756e09893f3c68f79bb5b';
type NitroPolicy = Extract<EscrowAttestationPolicy, { mode: 'nitro' }>;
const fail: (reason: NitroAttestationReason) => never = reason => {
    throw new NitroAttestationError(reason);
};
const hex = (bytes: Uint8Array): string =>
    Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const bytes = (value: unknown, reason: NitroAttestationReason): Uint8Array =>
    value instanceof Uint8Array && value.length > 0 ? value : fail(reason);
const map = (value: unknown, reason: NitroAttestationReason): Map<unknown, unknown> =>
    value instanceof Map ? value : fail(reason);
const decodeCbor = (value: Uint8Array): unknown => {
    try {
        return decode(value, {
            useMaps: true,
            rejectDuplicateMapKeys: true,
            allowIndefinite: false,
            allowUndefined: false,
            allowNaN: false,
            allowInfinity: false,
            allowBigInt: false,
        });
    } catch {
        return fail('cbor');
    }
};

/** Verify signed NSM evidence before trusting its P-256 escrow key (not public_key/KMS key). */
export const verifyNitroAttestationDocument = async (
    documentB64: string,
    {
        expectedNonce,
        policy,
        now = Date.now(),
    }: {
        expectedNonce: Uint8Array;
        policy: NitroPolicy;
        now?: number;
    }
): Promise<{
    escrowPublicKeySpkiB64: string;
    pcrs: Record<number, string>;
    timestamp: number;
    moduleId: string;
}> => {
    let document: Uint8Array;
    try {
        if (
            !documentB64 ||
            documentB64.length > 65536 ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(documentB64)
        )
            fail('cbor');
        document = base64ToBuffer(documentB64);
    } catch {
        return fail('cbor');
    }
    // Only an outer COSE_Sign1 tag is permitted; tags within headers/payload are rejected.
    const cose = decodeCbor(document[0] === 0xd2 ? document.subarray(1) : document);
    if (!Array.isArray(cose) || cose.length !== 4) fail('cose');
    const [protectedValue, unprotectedValue, payloadValue, signatureValue] = cose;
    const protectedBytes = bytes(protectedValue, 'cose');
    const protectedHeader = map(decodeCbor(protectedBytes), 'alg');
    if (protectedHeader.size !== 1 || protectedHeader.get(1) !== -35) fail('alg');
    if (map(unprotectedValue, 'cose').size !== 0) fail('cose');
    const payloadBytes = bytes(payloadValue, 'cose');
    const signature = bytes(signatureValue, 'signature');
    if (signature.length !== 96) fail('signature');
    const payload = map(decodeCbor(payloadBytes), 'cbor');
    const moduleId = payload.get('module_id');
    const timestamp = payload.get('timestamp');
    if (typeof moduleId !== 'string' || !moduleId || payload.get('digest') !== 'SHA384')
        fail('cbor');
    if (typeof timestamp !== 'number' || !Number.isSafeInteger(timestamp) || timestamp < 0)
        fail('freshness');
    const leafDer = bytes(payload.get('certificate'), 'chain');
    const bundle = payload.get('cabundle');
    if (!Array.isArray(bundle) || !bundle.length || bundle.length > 16) fail('chain');
    const ders = bundle.map(value => bytes(value, 'chain'));
    const rootHash = hex(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(ders[0])))
    );
    if (rootHash !== (policy.rootCertificateSha256 ?? AWS_ROOT_SHA256).toLowerCase()) fail('root');
    let leaf: X509Certificate;
    try {
        const chain = [...ders, leafDer].map(der => new X509Certificate(new Uint8Array(der)));
        for (let i = 0; i < chain.length; i++) {
            const cert = chain[i];
            const issuer = chain[Math.max(0, i - 1)];
            if (
                !Number.isFinite(now) ||
                now < cert.notBefore.getTime() ||
                now > cert.notAfter.getTime() ||
                cert.issuer !== issuer.subject ||
                !(await cert.verify({ publicKey: issuer.publicKey, date: new Date(now) }, crypto))
            )
                fail('chain');
            if (i < chain.length - 1) {
                const constraints = cert.getExtension(BasicConstraintsExtension);
                const usage = cert.getExtension(KeyUsagesExtension);
                if (
                    !constraints?.ca ||
                    (constraints.pathLength !== undefined &&
                        chain.length - i - 2 > constraints.pathLength) ||
                    (usage && !(usage.usages & KeyUsageFlags.keyCertSign))
                )
                    fail('chain');
            }
        }
        leaf = chain[chain.length - 1];
    } catch {
        return fail('chain');
    }
    try {
        const key = await crypto.subtle.importKey(
            'spki',
            leaf.publicKey.rawData,
            { name: 'ECDSA', namedCurve: 'P-384' },
            false,
            ['verify']
        );
        const structure = encode(['Signature1', protectedBytes, new Uint8Array(), payloadBytes]);
        if (
            !(await crypto.subtle.verify(
                { name: 'ECDSA', hash: 'SHA-384' },
                key,
                new Uint8Array(signature),
                new Uint8Array(structure)
            ))
        )
            fail('signature');
    } catch {
        return fail('signature');
    }
    const rawPcrs = map(payload.get('pcrs'), 'pcr');
    const pcrs: Record<number, string> = {};
    for (const [index, value] of rawPcrs) {
        if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index > 31)
            fail('pcr');
        const pcr = bytes(value, 'pcr');
        if (pcr.length !== 48) fail('pcr');
        pcrs[index] = hex(pcr);
    }
    if (pcrs[0] === '00'.repeat(48)) fail('debug');
    if (
        !policy.pinnedMeasurements.some(
            pin =>
                typeof pin.pcr0 === 'string' &&
                typeof pin.pcr1 === 'string' &&
                typeof pin.pcr2 === 'string' &&
                pin.pcr0.toLowerCase() === pcrs[0] &&
                pin.pcr1.toLowerCase() === pcrs[1] &&
                pin.pcr2.toLowerCase() === pcrs[2]
        )
    )
        fail('pcr');
    const nonce = bytes(payload.get('nonce'), 'nonce');
    if (
        !(expectedNonce instanceof Uint8Array) ||
        expectedNonce.length !== 32 ||
        nonce.length !== expectedNonce.length
    )
        fail('nonce');
    let difference = 0;
    for (let i = 0; i < nonce.length; i++) difference |= nonce[i] ^ expectedNonce[i];
    if (difference !== 0) fail('nonce');
    const maxAge = policy.maxAgeMs ?? 300000;
    if (
        !Number.isFinite(maxAge) ||
        maxAge < 0 ||
        now - timestamp > maxAge ||
        timestamp > now + 60000
    )
        fail('freshness');
    const userData = bytes(payload.get('user_data'), 'user-data');
    try {
        await crypto.subtle.importKey(
            'spki',
            new Uint8Array(userData),
            { name: 'ECDH', namedCurve: 'P-256' },
            false,
            []
        );
    } catch {
        return fail('user-data');
    }
    return {
        escrowPublicKeySpkiB64: bufferToBase64(new Uint8Array(userData).buffer),
        pcrs,
        timestamp,
        moduleId,
    };
};
