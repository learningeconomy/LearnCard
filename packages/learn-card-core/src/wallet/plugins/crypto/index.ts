import { CryptoPluginType } from './types';

import crypto from '@wallet/base/crypto';

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
