import { TRPCError } from '@trpc/server';
import {
    JWEValidator,
    type DidDocument,
    type JWE,
    type VC,
    type VerificationMethod,
} from '@learncard/types';
import { base58btc } from 'multiformats/bases/base58';
import { createJWE, x25519Encrypter, type Encrypter } from 'did-jwt';
import { prepareCleartext } from 'dag-jose-utils';

type KeyMethod = Exclude<VerificationMethod, string>;

const absoluteKeyId = (id: string, did: string): string => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(id)) return id;
    if (id.startsWith('#') || id.startsWith('?')) return `${did}${id}`;
    const path = new URL(id, 'https://did.invalid/');
    return `${did}${path.pathname}${path.search}${path.hash}`;
};

const getX25519Bytes = (method: KeyMethod): Uint8Array | undefined => {
    try {
        if (method.publicKeyJwk) {
            const jwk = method.publicKeyJwk;
            if (jwk.kty !== 'OKP' || jwk.crv !== 'X25519' || typeof jwk.x !== 'string') return;
            if (!/^[A-Za-z0-9_-]+$/.test(jwk.x)) return;
            const bytes = Buffer.from(jwk.x, 'base64url');
            if (bytes.length === 32) return Uint8Array.from(bytes);
        } else if (method.publicKeyMultibase) {
            const bytes = base58btc.decode(method.publicKeyMultibase);
            if (bytes.length === 34 && bytes[0] === 0xec && bytes[1] === 0x01)
                return bytes.slice(2);
        } else if (method.publicKeyBase58 && method.type === 'X25519KeyAgreementKey2019') {
            const bytes = base58btc.baseDecode(method.publicKeyBase58);
            if (bytes.length === 32) return bytes.slice();
        }
    } catch {
        // A malformed/unsupported method must not prevent trying another agreement key.
    }
    return undefined;
};

/** Resolve once, then bind encryption to copies of these exact public keys. */
export const resolveRecipientEncrypters = async (
    recipients: string[],
    resolveDid: (did: string) => Promise<DidDocument>
): Promise<Encrypter[]> => {
    const groups = await Promise.all(
        [...new Set(recipients)].map(async did => {
            const doc = await resolveDid(did).catch(() => undefined);
            const encrypters: Encrypter[] = [];
            for (const agreement of doc?.keyAgreement ?? []) {
                const method =
                    typeof agreement === 'string'
                        ? [...(doc?.verificationMethod ?? []), ...(doc?.publicKey ?? [])].find(
                              (candidate): candidate is KeyMethod =>
                                  typeof candidate !== 'string' &&
                                  absoluteKeyId(candidate.id, doc!.id) ===
                                      absoluteKeyId(agreement, doc!.id)
                          )
                        : agreement;
                if (!method) continue;
                const key = getX25519Bytes(method);
                if (key) encrypters.push(x25519Encrypter(key, absoluteKeyId(method.id, doc!.id)));
            }
            if (!encrypters.length) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Recipient has no usable X25519 key-agreement key: ${did}`,
                });
            }
            return encrypters;
        })
    );
    return groups.flat();
};

/** DIDKit-compatible DAG-JWE encryption with no further DID resolution or kid matching. */
export const encryptCredentialForRecipients = async (
    credential: VC,
    encrypters: Encrypter[]
): Promise<JWE> => {
    if (!encrypters.length) throw new Error('Encryption requires at least one recipient key');
    const jwe = await createJWE(await prepareCleartext(credential), encrypters);
    // Every encrypter is bound to one validated key. No recipient may be silently omitted.
    if (jwe.recipients?.length !== encrypters.length) {
        throw new Error('Encryption did not cover every recipient key');
    }
    return JWEValidator.parse(jwe);
};
