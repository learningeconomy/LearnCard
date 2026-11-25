/** Validate configuration only. Never print, derive or generate signing material. */
export const validateProductionSigningPolicy = (configuration: {
    nodeEnv: string;
    jwtSecret: string | undefined;
    seed: string | undefined;
}): void => {
    if (configuration.nodeEnv !== 'production') return;
    const secret = configuration.jwtSecret;
    if (!secret || secret === configuration.seed) {
        throw new Error('Production JWT_SECRET must be explicit and separate from SEED');
    }
    if (
        Buffer.byteLength(secret, 'utf8') < 32 ||
        new Set(secret).size < 8 ||
        /^\s*(test|example|change[-_ ]?me|ci[-_]|your[-_])/i.test(secret)
    ) {
        throw new Error(
            'Production JWT_SECRET must contain non-placeholder signing material of at least 32 bytes'
        );
    }
};
