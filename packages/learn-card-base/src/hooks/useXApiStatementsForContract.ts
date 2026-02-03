import { useInfiniteQuery } from '@tanstack/react-query';
import { useWallet, useGetDid, useCurrentUser } from 'learn-card-base';

const XAPI_CONTRACT_URI_EXTENSION = 'https://learncard.com/xapi/extensions/contractUri';

export type XAPIStatement = {
    id?: string;
    actor: {
        objectType?: string;
        name?: string;
        account?: {
            homePage: string;
            name: string;
        };
    };
    verb: {
        id: string;
        display?: {
            'en-US'?: string;
            [key: string]: string | undefined;
        };
    };
    object: {
        id: string;
        objectType?: string;
        definition?: {
            name?: { 'en-US'?: string; [key: string]: string | undefined };
            description?: { 'en-US'?: string; [key: string]: string | undefined };
            type?: string;
        };
    };
    context?: {
        extensions?: {
            [XAPI_CONTRACT_URI_EXTENSION]?: string;
            [key: string]: any;
        };
        [key: string]: any;
    };
    timestamp?: string;
    stored?: string;
    result?: {
        score?: {
            scaled?: number;
            raw?: number;
            min?: number;
            max?: number;
        };
        success?: boolean;
        completion?: boolean;
        response?: string;
        duration?: string;
        extensions?: Record<string, any>;
    };
    [key: string]: any;
};

export type XAPIStatementsResponse = {
    statements: XAPIStatement[];
    more?: string;
};

export const useXApiStatementsForContract = (contractUri: string) => {
    const { initWallet } = useWallet();
    const { data: currentUserDidKey } = useGetDid('key');
    const currentUser = useCurrentUser();

    return useInfiniteQuery({
        queryKey: ['useXApiStatementsForContract', currentUserDidKey, contractUri],
        queryFn: async ({ pageParam }): Promise<XAPIStatementsResponse> => {
            const wallet = await initWallet();
            if (!wallet) throw new Error('Wallet is not initialized yet.');

            const actor = {
                account: { homePage: 'https://www.w3.org/TR/did-core/', name: currentUserDidKey },
                name: currentUser?.name,
            };

            const params = new URLSearchParams({
                agent: JSON.stringify(actor),
            });
            const url = `https://cloud.learncard.com${pageParam || `/xapi/statements?${params}`}`;

            const vpToken = (await wallet.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': vpToken || '',
                },
            });

            if (!response.ok)
                throw new Error(`Failed to fetch xAPI statements: ${response.status}`);

            const data: XAPIStatementsResponse = await response.json();

            // Filter statements by contract URI
            const filteredStatements = data.statements.filter(
                statement =>
                    statement.context?.extensions?.[XAPI_CONTRACT_URI_EXTENSION] === contractUri
            );

            return {
                statements: filteredStatements,
                more: data.more,
            };
        },
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => lastPage?.more || undefined,
        enabled: !!currentUserDidKey && !!contractUri,
    });
};
