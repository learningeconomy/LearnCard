import type { AgentToolDefinition } from '../agent/types';
import {
    createBraveWebSearchProvider,
    createMockWebSearchProvider,
    createWebSearchTool,
} from './webSearch';
import type { WebSearchProviderName, WebSearchSafeSearch } from './webSearch';
import { createLearnCardWalletTool } from './learnCardWallet';

export interface ToolRegistryConfig {
    walletSeed?: string;
    cloudUrl?: string;
    networkUrl?: string;
    webSearchProvider?: WebSearchProviderName | 'none';
    braveSearchApiKey?: string;
    webSearchDefaultLimit?: number;
    webSearchMaxLimit?: number;
    webSearchCountry?: string;
    webSearchSearchLang?: string;
    webSearchSafeSearch?: WebSearchSafeSearch;
}

const createConfiguredWebSearchTool = ({
    webSearchProvider,
    braveSearchApiKey,
    webSearchDefaultLimit,
    webSearchMaxLimit,
    webSearchCountry,
    webSearchSearchLang,
    webSearchSafeSearch,
}: ToolRegistryConfig): AgentToolDefinition | undefined => {
    const provider =
        webSearchProvider === 'brave' && braveSearchApiKey
            ? createBraveWebSearchProvider({ apiKey: braveSearchApiKey })
            : webSearchProvider === 'mock'
            ? createMockWebSearchProvider()
            : undefined;

    if (!provider) return undefined;

    return createWebSearchTool({
        provider,
        defaultLimit: webSearchDefaultLimit,
        maxLimit: webSearchMaxLimit,
        defaults: {
            country: webSearchCountry,
            searchLang: webSearchSearchLang,
            safeSearch: webSearchSafeSearch,
        },
    });
};

export const createTools = (config: ToolRegistryConfig): AgentToolDefinition[] => {
    const tools = [
        createLearnCardWalletTool({
            seed: config.walletSeed,
            cloudUrl: config.cloudUrl,
            networkUrl: config.networkUrl,
        }),
    ];
    const webSearchTool = createConfiguredWebSearchTool(config);

    if (webSearchTool) tools.push(webSearchTool);

    return tools;
};
