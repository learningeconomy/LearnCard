import ScoutNewsDefaultData from './scoutnewsdefault.json';

export type ScoutNewsItem = {
    author: string;
    last_update_date: string;
    node_id: string;
    path: string;
    preview_image: string;
    preview_text: string;
    publish_date: string;
    tags: string;
    title: string;
};

export type ScoutNewsQueryResult = {
    data: ScoutNewsItem[];
    pager: { pages: number; current_page: number };
};

// Keep bundled initial data subject to the same pagination type contract.
const scoutNewsFallback: ScoutNewsQueryResult = ScoutNewsDefaultData;

export const getScoutNewsEndpoint = (isNative: boolean, tenantDomain: string): string =>
    isNative ? `https://${tenantDomain}/api/scout-news` : '/api/scout-news';

export const scoutNewsQueryOptions = (endpoint: string) => ({
    queryKey: ['useFetchScoutNews', endpoint],
    queryFn: async (): Promise<ScoutNewsQueryResult> => {
        const response = await fetch(endpoint, { credentials: 'omit' });
        if (!response.ok) throw new Error(`Scout news request failed (${response.status})`);

        const news = await response.json();
        if (
            !Array.isArray(news?.data) ||
            !Number.isFinite(news?.pager?.pages) ||
            !Number.isFinite(news?.pager?.current_page) ||
            !news.data.every(
                (item: unknown) =>
                    item !== null &&
                    typeof item === 'object' &&
                    ['node_id', 'title', 'path', 'publish_date', 'tags'].every(
                        key => typeof (item as Record<string, unknown>)[key] === 'string'
                    )
            )
        ) {
            throw new Error('Invalid Scout news response');
        }
        return news;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    initialData: scoutNewsFallback,
    // Bundled fallback is immediately stale, so the first visit fetches live news.
    initialDataUpdatedAt: 0,
});
