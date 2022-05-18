import crypto from '../crypto';

export const passwordToKey = async (
  password: string,
  salt: string = 'salt',
  iterations: number = 100000,
  digest: string = 'SHA-256'
): Promise<Uint8Array> => {
  var saltBuffer = Buffer.from(salt);
  var passphraseKey = Buffer.from(password);

  return crypto.subtle
    .importKey('raw', passphraseKey, { name: 'PBKDF2' }, false, [
      'deriveBits',
      'deriveKey',
    ])
    .then(function(key: any) {
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: iterations,
          hash: digest,
        },
        key,
        // Note: we don't actually need a cipher suite,
        // but the api requires that it must be specified.
        // For AES the length required to be 128 or 256 bits (not bytes)
        { name: 'AES-CBC', length: 256 },
        // Whether or not the key is extractable (less secure) or not (more secure)
        // when false, the key can only be passed as a web crypto object, not inspected
        true,
        // this web crypto object will only be allowed for these functions
        ['encrypt', 'decrypt']
      );
    })
    .then((webKey: any) => {
      return crypto.subtle.exportKey('raw', webKey);
    })
    .then((buffer: any) => {
      return new Uint8Array(buffer);
    });
};
