import type { CryptoPluginType } from './types';

import crypto from './crypto';

export * from './types';

/**
 * @group Plugins
 */
export const CryptoPlugin: CryptoPluginType = {
    name: 'Crypto',
    displayName: 'Crypto Plugin',
    description: 'Exposes a standardized, isomorphic Crypto object',
    methods: {
        crypto: () => crypto,
    },
};
