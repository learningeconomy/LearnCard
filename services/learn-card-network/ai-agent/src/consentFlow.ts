import { createHash } from 'node:crypto';

import type { ServiceConfig } from './config';
import {
    getAgentLearnCard,
    type AgentLearnCardConfig,
    type AgentNetworkWallet,
} from './helpers/learnCard.helpers';

export interface ConsentFlowContractInfo {
    uri: string;
    consentUrl: string;
    source: 'configured' | 'request' | 'created-development';
    created: boolean;
}

export interface ConsentedCredential {
    category: string;
    uri: string;
    content?: unknown;
    readError?: string;
}

export interface ConsentedUserDataRecord {
    date: string;
    contractUri: string;
    personal: Record<string, string>;
    credentials: ConsentedCredential[];
}

export interface ConsentedUserDataResult {
    did: string;
    contract: ConsentFlowContractInfo;
    records: ConsentedUserDataRecord[];
    summary: {
        recordCount: number;
        personalKeys: string[];
        credentialCount: number;
        hydratedCredentialCount: number;
    };
    paging: {
        pageSize: number;
        pagesRead: number;
        maxPages: number;
        hasMore: boolean;
        cursor?: string;
        incomplete: boolean;
    };
}

export interface ConsentFlowRuntime {
    getContractInfo: (contractUri?: string) => Promise<ConsentFlowContractInfo>;
    loadConsentedUserData: (input: {
        did: string;
        contractUri?: string;
    }) => Promise<ConsentedUserDataResult>;
}

export interface ConsentFlowRuntimeOptions {
    getWallet?: () => Promise<AgentNetworkWallet>;
}

type ConsentFlowDataPage = {
    records: Array<{
        date: string;
        contractUri: string;
        personal?: Record<string, string>;
        credentials?: Array<{ category: string; uri: string }>;
    }>;
    hasMore: boolean;
    cursor?: string;
};

const PROD_NETWORK_HOST = 'network.learncard.com';
const PROD_NETWORK_PATH = '/trpc';

const DEFAULT_DEVELOPMENT_CONTRACT = {
    contract: {
        read: {
            personal: {
                name: { required: false, defaultEnabled: true },
            },
            credentials: {
                categories: {
                    'Social Badge': { required: false, defaultEnabled: true },
                    Achievement: { required: false, defaultEnabled: true },
                    'Learning History': { required: false, defaultEnabled: true },
                    Accomplishment: { required: false, defaultEnabled: true },
                    Accommodation: { required: false, defaultEnabled: true },
                    'Work History': { required: false, defaultEnabled: true },
                    ID: { required: false, defaultEnabled: true },
                },
            },
        },
        write: {
            personal: {},
            credentials: {
                categories: {},
            },
        },
    },
    name: 'LearnCard AI Agent Development Contract',
    description: 'Development contract for sharing user context with the LearnCard AI agent.',
};

export const isProdNetworkUrl = (networkUrl?: string): boolean => {
    if (!networkUrl) return true;

    try {
        const url = new URL(networkUrl);

        return (
            url.hostname === PROD_NETWORK_HOST &&
            url.pathname.replace(/\/$/, '') === PROD_NETWORK_PATH
        );
    } catch {
        return networkUrl.includes(`${PROD_NETWORK_HOST}${PROD_NETWORK_PATH}`);
    }
};

const getContractIdFromUri = (uri: string): string | undefined => {
    const decodedUri = decodeURIComponent(uri);
    const parts = decodedUri.split(':');
    const contractIndex = parts.indexOf('contract');

    if (contractIndex === -1) return undefined;

    return parts.slice(contractIndex + 1).join(':') || undefined;
};

const buildConsentUrl = (appUrl: string, contractUri: string): string => {
    const url = new URL('/consent-flow', appUrl);
    url.searchParams.set('uri', contractUri);

    return url.toString();
};

const normalizeUri = (uri: string): string => {
    try {
        return decodeURIComponent(uri);
    } catch {
        return uri;
    }
};

const isSameUri = (a: string, b: string): boolean => normalizeUri(a) === normalizeUri(b);

const getDevelopmentAgentProfileId = async (wallet: AgentNetworkWallet): Promise<string> => {
    const did = await wallet.id.did();
    const hash = createHash('sha256').update(did).digest('hex').slice(0, 24);

    return `ai-agent-${hash}`;
};

const ensureDevelopmentAgentProfile = async (wallet: AgentNetworkWallet): Promise<void> => {
    const existingProfile = await wallet.invoke.getProfile();

    if (existingProfile) return;

    const profileId = await getDevelopmentAgentProfileId(wallet);

    try {
        await wallet.invoke.createServiceProfile({
            profileId,
            displayName: 'LearnCard AI Agent',
            shortBio: 'Development service profile for ConsentFlow testing.',
            bio: 'Development service profile for the LearnCard AI agent.',
            type: 'service',
            profileVisibility: 'private',
            allowConnectionRequests: 'invite_only',
        });
    } catch (error) {
        const profileAfterCreateAttempt = await wallet.invoke.getProfile();

        if (profileAfterCreateAttempt) return;

        throw error;
    }
};

const readCredentialContent = async (wallet: AgentNetworkWallet, uri: string): Promise<unknown> => {
    const readPlane = (wallet as unknown as { read?: { get?: unknown } }).read;
    const get = readPlane?.get;

    if (typeof get !== 'function') {
        throw new Error('Wallet read.get is not available.');
    }

    return (get as (uri: string) => Promise<unknown>).call(readPlane, uri);
};

const hydrateCredentials = async (
    wallet: AgentNetworkWallet,
    credentials: Array<{ category: string; uri: string }>,
    readLimit: number,
    alreadyRead: number
): Promise<{ credentials: ConsentedCredential[]; readCount: number }> => {
    let readCount = alreadyRead;

    const hydratedCredentials = await Promise.all(
        credentials.map(async credential => {
            if (readCount >= readLimit) return credential;

            readCount += 1;

            try {
                return {
                    ...credential,
                    content: await readCredentialContent(wallet, credential.uri),
                };
            } catch (error) {
                return {
                    ...credential,
                    readError:
                        error instanceof Error ? error.message : 'Could not read credential.',
                };
            }
        })
    );

    return { credentials: hydratedCredentials, readCount };
};

export const createConsentFlowRuntime = (
    config: ServiceConfig,
    walletConfig: AgentLearnCardConfig = {
        seed: config.walletSeed,
        cloudUrl: config.cloudUrl,
        networkUrl: config.networkUrl,
    },
    options: ConsentFlowRuntimeOptions = {}
): ConsentFlowRuntime => {
    let developmentContractPromise: Promise<ConsentFlowContractInfo> | undefined;

    const getWallet =
        options.getWallet ??
        (async (): Promise<AgentNetworkWallet> => getAgentLearnCard(walletConfig));

    const getContractInfo = async (contractUri?: string): Promise<ConsentFlowContractInfo> => {
        if (contractUri) {
            return {
                uri: contractUri,
                consentUrl: buildConsentUrl(config.consentFlowAppUrl, contractUri),
                source: 'request',
                created: false,
            };
        }

        if (config.consentFlowContractUri) {
            return {
                uri: config.consentFlowContractUri,
                consentUrl: buildConsentUrl(
                    config.consentFlowAppUrl,
                    config.consentFlowContractUri
                ),
                source: 'configured',
                created: false,
            };
        }

        if (isProdNetworkUrl(config.networkUrl)) {
            throw new Error(
                'AI_AGENT_CONSENT_FLOW_CONTRACT_URI must be set when using the production LearnCard Network.'
            );
        }

        if (!developmentContractPromise) {
            developmentContractPromise = (async () => {
                const wallet = await getWallet();
                await ensureDevelopmentAgentProfile(wallet);
                const uri = await wallet.invoke.createContract(DEFAULT_DEVELOPMENT_CONTRACT);

                return {
                    uri,
                    consentUrl: buildConsentUrl(config.consentFlowAppUrl, uri),
                    source: 'created-development' as const,
                    created: true,
                };
            })();
        }

        return developmentContractPromise;
    };

    const loadConsentedUserData = async ({
        did,
        contractUri,
    }: {
        did: string;
        contractUri?: string;
    }): Promise<ConsentedUserDataResult> => {
        const wallet = await getWallet();
        const contract = await getContractInfo(contractUri);
        const contractId = getContractIdFromUri(contract.uri);
        const records: ConsentedUserDataRecord[] = [];
        const personalKeys = new Set<string>();
        let credentialCount = 0;
        let hydratedCredentialCount = 0;
        let cursor: string | undefined;
        let hasMore = false;
        let pagesRead = 0;

        do {
            pagesRead += 1;

            const query = contractId ? { id: contractId } : undefined;
            const page = (await wallet.invoke.getConsentFlowDataForDid(did, {
                limit: config.consentFlowDataPageSize,
                cursor,
                ...(query ? { query } : {}),
            })) as ConsentFlowDataPage;

            hasMore = page.hasMore;
            cursor = page.cursor;

            for (const record of page.records) {
                if (!isSameUri(record.contractUri, contract.uri)) continue;

                const credentials = record.credentials ?? [];
                const hydrated = await hydrateCredentials(
                    wallet,
                    credentials,
                    config.consentFlowCredentialReadLimit,
                    hydratedCredentialCount
                );
                hydratedCredentialCount = hydrated.readCount;
                credentialCount += credentials.length;

                for (const key of Object.keys(record.personal ?? {})) personalKeys.add(key);

                records.push({
                    date: record.date,
                    contractUri: record.contractUri,
                    personal: record.personal ?? {},
                    credentials: hydrated.credentials,
                });
            }
        } while (hasMore && cursor && pagesRead < config.consentFlowDataMaxPages);

        return {
            did,
            contract,
            records,
            summary: {
                recordCount: records.length,
                personalKeys: [...personalKeys].sort((a, b) => a.localeCompare(b)),
                credentialCount,
                hydratedCredentialCount,
            },
            paging: {
                pageSize: config.consentFlowDataPageSize,
                pagesRead,
                maxPages: config.consentFlowDataMaxPages,
                hasMore,
                cursor,
                incomplete: hasMore && pagesRead >= config.consentFlowDataMaxPages,
            },
        };
    };

    return {
        getContractInfo,
        loadConsentedUserData,
    };
};
