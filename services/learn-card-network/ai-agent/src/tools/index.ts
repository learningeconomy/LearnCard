import type { AgentToolDefinition } from '../agent/types';
import { createLearnCardWalletTool } from './learnCardWallet';

export interface ToolRegistryConfig {
    walletSeed?: string;
    cloudUrl?: string;
    networkUrl?: string;
}

export const createTools = ({
    walletSeed,
    cloudUrl,
    networkUrl,
}: ToolRegistryConfig): AgentToolDefinition[] => [
    createLearnCardWalletTool({ seed: walletSeed, cloudUrl, networkUrl }),
];
