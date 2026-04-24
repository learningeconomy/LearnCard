import { useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';

import type { CareerOneStopOccupation, OccupationDetailsResponse } from '../../types/careerOneStop';
import { useWallet } from 'learn-card-base';

import { networkStore } from '../../stores/NetworkStore';

export const fetchOccupationDetailsForKeyword = async ({
    keyword,
    limit,
    topNDetails,
}: {
    keyword: string;
    limit?: number;
    topNDetails?: number;
}): Promise<OccupationDetailsResponse[]> => {
    const res = await fetch(`${networkStore.get.aiServiceUrl()}/insights/occupations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword, limit, topNDetails }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch occupation details');
    }

    return res.json();
};

export const useOccupationSuggestionsForKeyword = (keyword: string) => {
    return useQuery({
        queryKey: ['occupation-suggestions', keyword],
        queryFn: async () => {
            return fetchOccupationDetailsForKeyword({ keyword });
        },
        enabled: keyword.length >= 2,
        staleTime: 1000 * 60 * 5,
    });
};

export const useOccupationDetailsForKeyword = (
    keyword: string,
    limit?: number,
    topNDetails?: number
) => {
    return useQuery({
        queryKey: ['occupation-details', keyword, limit, topNDetails],
        queryFn: async () => {
            return fetchOccupationDetailsForKeyword({ keyword, limit, topNDetails });
        },
        enabled: Boolean(keyword),
    });
};

const fetchSalariesForKeyword = async ({
    keyword,
    locations,
}: {
    keyword: string;
    locations: string[];
}) => {
    const res = await fetch(`${networkStore.get.aiServiceUrl()}/insights/salaries`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            keyword,
            locations,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch salary data');
    }

    const data = await res.json();

    return data;
};

export const useSalariesForKeyword = ({ keyword }: { keyword: string | null }) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['occupation-salaries', keyword],
        queryFn: async () => {
            if (!keyword) {
                throw new Error('Keyword is required');
            }

            const locations = ['CA', 'NY', 'WA', 'MA', 'NJ', 'FL', 'TX'];

            const wallet = await initWallet();

            return fetchSalariesForKeyword({
                keyword,
                locations,
            });
        },
        enabled: Boolean(keyword),
    });
};

const fetchTrainingProgramsByKeyword = async (keyword: string): Promise<any> => {
    const res = await fetch(`${networkStore.get.aiServiceUrl()}/insights/training-programs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch training programs');
    }

    return res.json();
};

const fetchOpenSyllabusCoursesBySchool = async (schoolName: string): Promise<any> => {
    const res = await fetch(`${networkStore.get.aiServiceUrl()}/insights/courses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schoolName, limit: 100 }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch training programs');
    }

    return res.json();
};

export const fetchCareerOneStopVideo = async (videoCode: string): Promise<any> => {
    const res = await fetch(`${networkStore.get.aiServiceUrl()}/insights/video`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoCode }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch training programs');
    }

    return res.json();
};

export const useCareerOneStopVideo = (videoCode: string | null) => {
    return useQuery({
        queryKey: ['career-one-stop-video', videoCode],
        queryFn: async () => {
            if (!videoCode) {
                throw new Error('Video code is required');
            }
            return fetchCareerOneStopVideo(videoCode);
        },
        enabled: Boolean(videoCode),
    });
};

/**
 * Hook for fetching and enriching training programs data
 *
 * Data Flow:
 * 1. Takes an array of keywords
 * 2. Fetches occupation details for each keyword (Career One Stop API)
 * 3. Extracts ONET titles from occupation results
 * 4. Fetches training programs for first 3 ONET titles (Career One Stop API)
 * 5. Extracts unique school names from training programs
 * 6. Fetches syllabus courses for each unique school (Open Syllabus API)
 * 7. Combines training programs with syllabus courses
 *
 * @param keywords - Array of keywords to search for
 * @returns Enriched training programs with syllabus courses
 */
export const useTrainingProgramsByKeyword = ({ keywords }: { keywords: string[] | null }) => {
    return useQuery({
        queryKey: ['training-programs', keywords],
        queryFn: async () => {
            if (!keywords || keywords.length === 0) {
                throw new Error('Keywords are required');
            }

            // Step 1-2: Fetch occupation details for each keyword
            const occupationPromises = keywords
                .slice(0, 3)
                .map(keyword => fetchOccupationDetailsForKeyword({ keyword }));

            const occupationResults = await Promise.all(occupationPromises);

            // Step 3: Extract ONET titles from the results
            const allOnetTitles = occupationResults.flatMap(occupations =>
                occupations.map(occupation => occupation.OnetTitle)
            );

            // Step 4: Fetch training programs for first 3 ONET titles
            const onetTitlesToFetch = allOnetTitles.slice(0, 3);
            const trainingPromises = onetTitlesToFetch.map(onetTitle =>
                fetchTrainingProgramsByKeyword(onetTitle)
            );

            const trainingResults = await Promise.all(trainingPromises);

            // Step 5: Combine training program results with occupation details and keyword used
            const combinedResults = trainingResults.map((result: any, index: number) => ({
                ...result,
                keyword: onetTitlesToFetch[index],
                occupationDetails: occupationResults?.[0]?.[index] || null, // Keep occupation details for keyword context
            }));

            // Step 6: Extract unique school names from combined results
            const uniqueSchoolNames = [
                ...new Set(
                    combinedResults.map((result: any) => result?.SchoolPrograms?.[0]?.SchoolName)
                ),
            ].filter(Boolean);

            // Step 7: Fetch syllabus courses for each unique school
            const syllabusPromises = uniqueSchoolNames.map(schoolName =>
                fetchOpenSyllabusCoursesBySchool(schoolName)
            );

            // Add error handling for syllabus fetch
            const syllabusResults = await Promise.allSettled(syllabusPromises);

            // Step 8: Combine training programs with syllabus courses
            return combinedResults
                .map((result: any, index: number) => ({
                    ...result,
                    syllabusCourses:
                        syllabusResults[index]?.status === 'fulfilled'
                            ? syllabusResults[index]?.value?.syllabi
                            : [], // Fallback to empty array if syllabus fetch failed
                }))
                .flat();
        },
        enabled: Boolean(keywords && keywords.length > 0),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
};

export interface YouTubeVideo {
    videoId: string;
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnailUrl: string;
    url: string;
}

export const searchYouTubeVideos = async (keyword: string): Promise<YouTubeVideo[]> => {
    const url = new URL('/api/youtube/search', networkStore.get.aiServiceUrl());
    url.searchParams.set('keyword', keyword);

    const response = await fetch(url.toString(), {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Failed to search videos: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error('Invalid response: expected an array of videos');
    }

    const validatedVideos = data.filter((item: any): item is YouTubeVideo => {
        return (
            typeof item === 'object' &&
            item !== null &&
            typeof item.videoId === 'string' &&
            typeof item.title === 'string' &&
            typeof item.description === 'string' &&
            typeof item.channelTitle === 'string' &&
            typeof item.publishedAt === 'string' &&
            typeof item.thumbnailUrl === 'string' &&
            typeof item.url === 'string'
        );
    });

    if (validatedVideos.length === 0 && data.length > 0) {
        throw new Error('Invalid response: no valid video objects found');
    }

    return validatedVideos;
};

interface UseYouTubeSearchOptions {
    enabled?: boolean;
    staleTime?: number;
}

export function useYouTubeSearch(keyword: string, options: UseYouTubeSearchOptions = {}) {
    const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

    return useQuery<YouTubeVideo[], Error>({
        queryKey: ['youtube-search', keyword],
        queryFn: () => searchYouTubeVideos(keyword),
        enabled: enabled && keyword.trim().length > 0,
        staleTime,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error) => {
            if (error.message.includes('required') || error.message.includes('not configured')) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

export function useRefreshYouTubeSearch() {
    const queryClient = useQueryClient();

    return (keyword: string) => {
        queryClient.invalidateQueries({
            queryKey: ['youtube-search', keyword],
        });
    };
}
