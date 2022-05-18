import { issue, issueUsingWalletSuite } from './issue';
import { verifyCredential } from './verifyCredential';
import { createVerifiablePresentation } from './createVerifiablePresentation';
import { verifyPresentation } from './verifyPresentation';

import { VCPluginMethods } from './types';
import { Plugin } from 'types/wallet';

export const VCPlugin: Plugin<'VC', VCPluginMethods> = {
    pluginMethods: {
        issue: async (_wallet, config) => issue(config),
        issueUsingWalletSuite: async (_wallet, config) => issueUsingWalletSuite(config),
        verifyCredential: async (_wallet, config) => verifyCredential(config),
        createVerifiablePresentation: async (_wallet, config) =>
            createVerifiablePresentation(config),
        verifyPresentation: async (_wallet, config) => verifyPresentation(config),
    },
    pluginConstants: {},
};
