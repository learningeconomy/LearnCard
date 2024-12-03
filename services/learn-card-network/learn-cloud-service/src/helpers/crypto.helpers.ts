import crypto from 'crypto';

export const generateDeterministicRsaKeyPair = (
    seed: Uint8Array
): { publicKey: string; privateKey: string } => {
    // Create a deterministic PRNG using the seed
    const prng = crypto.createHash('sha512');

    // We'll use the seed to initialize our PRNG state
    prng.update(seed);
    let prngState = prng.digest();

    // Function to get next bytes from our PRNG
    function getRandomBytes(n: number): Buffer {
        let result = Buffer.alloc(0);
        while (result.length < n) {
            prngState = crypto.createHash('sha512').update(prngState).digest();
            result = Buffer.concat([result, prngState]);
        }
        return result.slice(0, n);
    }

    // Create a custom random number generator for Node's RSA key generation
    const customRandom = {
        randomBytes: (size: number) => getRandomBytes(size),
    };

    // Generate the key pair using our deterministic random number generator
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa' as any, {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
        // @ts-ignore - TypeScript doesn't know about the random property
        random: customRandom.randomBytes,
    }) as any;

    return { publicKey, privateKey };
};
