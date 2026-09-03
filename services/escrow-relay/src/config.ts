export interface EscrowRelayConfig {
    privateKeys: Record<string, string>;
    relayAuthToken: string;
    postmarkServerToken: string;
    defaultFromDomain: string;
    allowedFromDomains: ReadonlySet<string>;
    messageStream?: string;
}

const requireEnv = (env: NodeJS.ProcessEnv, name: string): string => {
    const value = env[name]?.trim();

    if (!value) throw new Error(`Missing required environment variable: ${name}`);

    return value;
};

const parsePrivateKeys = (serialized: string): Record<string, string> => {
    let parsed: unknown;

    try {
        parsed = JSON.parse(serialized);
    } catch {
        throw new Error('ESCROW_RELAY_PRIVATE_KEYS_JSON must be valid JSON');
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('ESCROW_RELAY_PRIVATE_KEYS_JSON must be a key ID to private key map');
    }

    const privateKeys: Record<string, string> = {};

    for (const [keyId, privateKey] of Object.entries(parsed)) {
        if (!/^[A-Za-z0-9._-]{1,128}$/.test(keyId) || typeof privateKey !== 'string') {
            throw new Error('ESCROW_RELAY_PRIVATE_KEYS_JSON contains an invalid key entry');
        }

        const normalizedPrivateKey = privateKey.trim();

        if (!normalizedPrivateKey) {
            throw new Error('ESCROW_RELAY_PRIVATE_KEYS_JSON contains an empty private key');
        }

        privateKeys[keyId] = normalizedPrivateKey;
    }

    if (Object.keys(privateKeys).length === 0) {
        throw new Error('ESCROW_RELAY_PRIVATE_KEYS_JSON must contain at least one private key');
    }

    return privateKeys;
};

/** Load the relay's deliberately small environment-only configuration. */
export const loadEscrowRelayConfig = (env: NodeJS.ProcessEnv = process.env): EscrowRelayConfig => {
    const defaultFromDomain = requireEnv(env, 'POSTMARK_FROM_DOMAIN').toLowerCase();
    const configuredDomains = (env.ALLOWED_FROM_DOMAINS ?? '')
        .split(',')
        .map(domain => domain.trim().toLowerCase())
        .filter(Boolean);

    return {
        privateKeys: parsePrivateKeys(requireEnv(env, 'ESCROW_RELAY_PRIVATE_KEYS_JSON')),
        relayAuthToken: requireEnv(env, 'ESCROW_RELAY_AUTH_TOKEN'),
        postmarkServerToken: requireEnv(env, 'POSTMARK_SERVER_TOKEN'),
        defaultFromDomain,
        allowedFromDomains: new Set([defaultFromDomain, ...configuredDomains]),
        messageStream: env.POSTMARK_MESSAGE_STREAM?.trim() || undefined,
    };
};
