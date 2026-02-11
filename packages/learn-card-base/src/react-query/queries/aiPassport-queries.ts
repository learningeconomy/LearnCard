import { Boost } from '@learncard/types';
import { VC } from '@learncard/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { getOrFetchCredentialRecordForBoost } from 'learn-card-base/hooks/useGetCredentialRecordForBoost';
import useWallet from 'learn-card-base/hooks/useWallet';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { CredentialMetadata, LCR } from 'learn-card-base/types/credential-records';
import { CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';
import { getOrFetchResolvedCredential } from './vcQueries';
import { AiSession } from 'learn-card-base/types/ai-session';

export type AppStoreAppMetadata = {
    artistViewUrl: string;
    artworkUrl60: string;
    artworkUrl100: string;
    features: string[];
    supportedDevices: string[];
    advisories: string[];
    isGameCenterEnabled: boolean;
    kind: string;
    screenshotUrls: string[];
    ipadScreenshotUrls: string[];
    appletvScreenshotUrls: string[];
    artworkUrl512: string;
    trackCensoredName: string;
    trackViewUrl: string;
    contentAdvisoryRating: string;
    averageUserRating: number;
    minimumOsVersion: string;
    artistId: number;
    artistName: string;
    genres: string[];
    price: number;
    bundleId: string;
    releaseDate: string; // ISO date string
    genreIds: string[];
    trackId: number;
    trackName: string;
    primaryGenreName: string;
    primaryGenreId: number;
    isVppDeviceBasedLicensingEnabled: boolean;
    sellerName: string;
    currentVersionReleaseDate: string; // ISO date string
    releaseNotes: string;
    version: string;
    wrapperType: string;
    currency: string;
    description: string;
    userRatingCountForCurrentVersion: number;
    sellerUrl: string;
    languageCodesISO2A: string[];
    fileSizeBytes: string;
    formattedPrice: string;
    trackContentRating: string;
    averageUserRatingForCurrentVersion: number;
    userRatingCount: number;
};

export type ReviewAuthor = {
    name: string;
};

export type AppStoreAppReview = {
    id: { label: string };
    title: { label: string };
    content: { label: string };
    rating: { label: string };
    version: { label: string };
    voteCount: { label: string };
    author: ReviewAuthor;
    updated: { label: string };
};

export type ReviewFeed = {
    feed: {
        entry: AppStoreAppReview[]; // The first entry might be app info, and subsequent entries are reviews.
    };
};

export type AppStoreMetadataResponse = {
    resultCount: number;
    results: AppStoreAppMetadata[];
};

export const useGetAppMetadata = (appID: string) => {
    return useQuery<AppStoreAppMetadata, Error, AppStoreAppMetadata>({
        queryKey: ['appMetadata', appID],
        queryFn: async () => {
            const itunesUrl = `https://itunes.apple.com/lookup?id=${appID}`;
            const url = Capacitor.isNativePlatform()
                ? itunesUrl
                : `https://corsproxy.io/?key=${CORS_PROXY_API_KEY}&url=${itunesUrl}`;

            const response = await CapacitorHttp.get({ url });

            if (response.status < 200 || response.status >= 300) {
                throw new Error('Network response was not ok');
            }
            const data: AppStoreMetadataResponse =
                typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

            if (data.resultCount > 0) {
                return data.results[0];
            }
            throw new Error('No app found with the provided ID.');
        },
    });
};

export const useGetAppReviews = (appID: string) => {
    return useQuery<AppStoreAppReview[], Error>({
        queryKey: ['appReviews', appID],
        queryFn: async () => {
            const itunesUrl = `https://itunes.apple.com/rss/customerreviews/page=1/id=${appID}/sortBy=mostRecent/json`;
            const url = Capacitor.isNativePlatform()
                ? itunesUrl
                : `https://corsproxy.io/?key=${CORS_PROXY_API_KEY}&url=${itunesUrl}`;

            const response = await CapacitorHttp.get({ url });

            if (response.status < 200 || response.status >= 300) {
                throw new Error('Network response was not ok');
            }
            const data: ReviewFeed =
                typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

            const entries = data.feed.entry;

            // If there are no entries or just one (the metadata), throw an error
            if (!entries || entries.length <= 1) {
                throw new Error('No reviews found for the provided app ID.');
            }

            // Often the first entry is the app information, so we return the rest
            return entries.slice(1);
        },
    });
};

export const useGetEnrichedTopicsList = (credentials?: LCR[], enabled: boolean = true) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery<
        {
            topicRecord?: LCR;
            topicBoost?: Boost;
            topicVc?: VC;
            sessions?: Boost[];
        }[]
    >({
        queryKey: ['useGetEnrichedTopicsList', credentials, switchedDid ?? ''],
        queryFn: async () => {
            if (!credentials || credentials.length === 0) return [];
            const wallet = await initWallet();

            const enrichedRecords = await Promise.all(
                credentials.map(async record => {
                    const topicVc = await getOrFetchResolvedCredential(
                        record.uri,
                        initWallet,
                        queryClient
                    );

                    const boostUri = topicVc?.boostId;

                    const topicBoost = (await wallet.invoke.getBoost(boostUri)) as
                        | Boost
                        | undefined;

                    const sessions = (
                        await wallet.invoke.getBoostChildren(boostUri, {
                            query: {
                                category:
                                    categoryMetadata[CredentialCategoryEnum.aiSummary]
                                        .contractCredentialTypeOverride,
                            },
                            limit: 100,
                        })
                    )?.records;

                    return {
                        topicRecord: record,
                        topicBoost,
                        topicVc,
                        sessions,
                    };
                })
            );

            return enrichedRecords;
        },
        enabled: enabled && Boolean(credentials && credentials.length > 0),
    });
};

export const useGetEnrichedSession = (topicUri: string, enabled: boolean = true) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['useGetEnrichedSession', topicUri, switchedDid ?? ''],
        queryFn: async () => {
            if (!topicUri) return null;

            const wallet = await initWallet();

            const topicBoost = await wallet.invoke.getBoost(topicUri);
            const topicRecord = await getOrFetchCredentialRecordForBoost(
                topicUri,
                initWallet,
                queryClient
            );
            const topicVc = await getOrFetchResolvedCredential(
                topicRecord?.uri ?? '',
                initWallet,
                queryClient
            );

            const summaryBoosts = (
                await wallet?.invoke?.getBoostChildren(topicVc?.boostId, {
                    query: {
                        category:
                            categoryMetadata[CredentialCategoryEnum.aiSummary]
                                .contractCredentialTypeOverride,
                    },
                    limit: 100,
                })
            )?.records;

            const sessions = await Promise.all(
                summaryBoosts?.map(async boost => {
                    const record = await getOrFetchCredentialRecordForBoost(
                        boost.uri,
                        initWallet,
                        queryClient
                    );
                    const vc = (await getOrFetchResolvedCredential(
                        record?.uri ?? '',
                        initWallet,
                        queryClient
                    ))!;

                    return {
                        boost: await wallet.invoke.getBoost(boost.uri),
                        vc,
                        record,
                    } as AiSession;
                })
            );

            return {
                topicBoost,
                topicRecord,
                topicVc,
                sessions,
            };
        },
        enabled: enabled && Boolean(topicUri),
    });
};

export const useGetAllAiTopicCredentials = (enabled: boolean = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['aiTopicCredentials', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();
            const topics = await wallet.index.LearnCloud.get<CredentialMetadata>({
                category: CredentialCategoryEnum.aiTopic,
            });
            return topics;
        },
        enabled,
    });
};
