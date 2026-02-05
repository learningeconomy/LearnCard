import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';

import type { OccupationDetailsResponse } from '../../types/careerOneStop';
import { useWallet } from 'learn-card-base';

import { LEARNCARD_AI_URL } from 'learn-card-base';

const fetchOccupationDetailsForKeyword = async (
    keyword: string
): Promise<OccupationDetailsResponse[]> => {
    const res = await fetch(`${LEARNCARD_AI_URL}/insights/occupations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch occupation details');
    }

    return res.json();
};

export const useOccupationDetailsForKeyword = (keyword: string) => {
    return useQuery({
        queryKey: ['occupation-details', keyword],
        queryFn: async () => {
            return fetchOccupationDetailsForKeyword(keyword);
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
    const res = await fetch(`${LEARNCARD_AI_URL}/insights/salaries`, {
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
    const res = await fetch(`${LEARNCARD_AI_URL}/insights/training-programs`, {
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
    const res = await fetch(`${LEARNCARD_AI_URL}/insights/courses`, {
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
    const res = await fetch(`${LEARNCARD_AI_URL}/insights/video`, {
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
 * 1. Takes an array of keywords and optional fieldOfStudy
 * 2. Fetches occupation details for each keyword (Career One Stop API)
 * 3. Extracts ONET titles from occupation results
 * 4. Fetches training programs for first 3 ONET titles (Career One Stop API)
 * 5. Extracts unique school names from training programs
 * 6. Fetches syllabus courses for each unique school (Open Syllabus API)
 * 7. Filters syllabus courses by fieldOfStudy
 * 8. Combines training programs with filtered syllabus courses
 *
 * @param keywords - Array of keywords to search for
 * @param fieldOfStudy - Optional field of study to filter syllabus courses
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
                .map(keyword => fetchOccupationDetailsForKeyword(keyword));

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
                    combinedResults.map(
                        // shuffle to get different schools each time
                        (result: any) => _.shuffle(result?.SchoolPrograms)?.[0]?.SchoolName
                    )
                ),
            ].filter(Boolean);

            // Step 7: Fetch syllabus courses for each unique school
            const syllabusPromises = uniqueSchoolNames.map(schoolName =>
                fetchOpenSyllabusCoursesBySchool(schoolName)
            );

            // Add error handling for syllabus fetch
            const syllabusResults = await Promise.allSettled(syllabusPromises);

            // Step 8: Combine training programs with syllabus courses filtered by fieldOfStudy
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
    });
};
