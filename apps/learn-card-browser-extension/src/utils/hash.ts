import stringify from 'json-stringify-deterministic';
import pbkdf2Hmac from 'pbkdf2-hmac';

// Minimal LearnCard-like shape used for hashing
export type LearnCardForHash = {
  invoke: {
    hash?: (message: string, algorithm?: string) => Promise<string | undefined>;
    crypto: () => Crypto;
  };
  id: {
    keypair: (type: string) => { d: string };
  };
};

export const canonicalStringify = (obj: unknown): string => stringify(obj as any);

export const saltedHash = async (learnCard: LearnCardForHash, message: string): Promise<string> => {
  const lcHash = await learnCard?.invoke?.hash?.(message, 'PBKDF2-HMAC-SHA256');
  if (lcHash) return lcHash;

  const crypto = learnCard.invoke.crypto();

  const pk = learnCard.id.keypair('secp256k1').d;
  const hmacKey = await pbkdf2Hmac(pk, 'salt', 1000, 32);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    hmacKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const uint8Message = new TextEncoder().encode(message);
  const digestBuffer = await crypto.subtle.sign('HMAC', cryptoKey, uint8Message);
  const digestArray = Array.from(new Uint8Array(digestBuffer));
  return digestArray.map((byte) => (byte as any).toString(16).padStart(2, '0')).join('');
};

export const computeCredentialHash = async (
  learnCard: LearnCardForHash,
  vc: unknown
): Promise<string> => {
  return saltedHash(learnCard, canonicalStringify(vc));
};
