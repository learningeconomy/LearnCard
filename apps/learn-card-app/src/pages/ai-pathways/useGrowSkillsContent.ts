import { useMemo } from 'react';

import {
    useAiInsightCredential,
    useAiPathways,
    useOccupationDetailsForKeyword,
    useTrainingProgramsByKeyword,
    useYouTubeSearch,
    type OccupationDetailsResponse,
    type TrainingProgram,
    type YouTubeVideo,
} from 'learn-card-base';

import {
    getAllKeywords,
    getFirstAvailableFieldOfStudy,
    getFirstAvailableKeywords,
} from './ai-pathway-careers/ai-pathway-careers.helpers';
import {
    filterCoursesByFieldOfStudy,
    normalizeSchoolPrograms,
} from './ai-pathway-courses/ai-pathway-courses.helpers';

export type GrowSkillsPathway = {
    title?: string;
    description?: string;
    skills?: string[];
    topicUri?: string;
    pathwayUri?: string;
    keywords?: {
        occupations?: string[];
        jobs?: string[];
        careers?: string[];
        fieldOfStudy?: string;
    };
};

export type GrowSkillsCourseProgram = TrainingProgram & {
    school?: {
        image_url?: string;
    };
    keyword?: string;
    courses?: unknown[];
    occupationDetails?: OccupationDetailsResponse | null;
};

export type GrowSkillsCard =
    | {
          type: 'ai-session';
          pathway: GrowSkillsPathway;
      }
    | {
          type: 'course';
          program: GrowSkillsCourseProgram;
      }
    | {
          type: 'media';
          occupation: OccupationDetailsResponse;
      }
    | {
          type: 'youtube-media';
          video: YouTubeVideo;
      };

type GrowSkillsContentParams = {
    searchQuery?: string;
};

export type GrowSkillsContentResult = {
    isLoading: boolean;
    emptyPathways: boolean;
    careerKeywords: string[] | null;
    fieldOfStudy: string;
    allKeywords: string[] | null;
    learningPathwaysData: GrowSkillsPathway[];
    schoolPrograms: GrowSkillsCourseProgram[];
    courses: any[];
    occupations: OccupationDetailsResponse[] | undefined;
    youtubeVideos: YouTubeVideo[];
    defaultCards: GrowSkillsCard[];
    searchSchoolPrograms: GrowSkillsCourseProgram[];
    searchOccupations: OccupationDetailsResponse[] | undefined;
    searchYouTubeVideos: YouTubeVideo[];
    searchCards: GrowSkillsCard[];
    cards: GrowSkillsCard[];
};

const mergeMediaItems = (
    media: OccupationDetailsResponse[],
    youtubeVideos: YouTubeVideo[]
): GrowSkillsCard[] => {
    const merged: GrowSkillsCard[] = [];
    const maxLength = Math.max(media.length, youtubeVideos.length);

    for (let index = 0; index < maxLength; index += 1) {
        const mediaItem = media[index];
        if (mediaItem) {
            merged.push({ type: 'media', occupation: mediaItem });
        }

        const youtubeVideo = youtubeVideos[index];
        if (youtubeVideo) {
            merged.push({ type: 'youtube-media', video: youtubeVideo });
        }
    }

    return merged;
};

const interleaveGrowSkillsCards = ({
    aiSessions,
    courses,
    media,
    youtubeVideos,
}: {
    aiSessions: GrowSkillsPathway[];
    courses: GrowSkillsCourseProgram[];
    media: OccupationDetailsResponse[];
    youtubeVideos: YouTubeVideo[];
}): GrowSkillsCard[] => {
    const mixedCards: GrowSkillsCard[] = [];
    const mergedMedia = mergeMediaItems(media, youtubeVideos);
    const maxLength = Math.max(aiSessions.length, courses.length, mergedMedia.length);

    for (let index = 0; index < maxLength; index += 1) {
        const aiSession = aiSessions[index];
        if (aiSession) {
            mixedCards.push({
                type: 'ai-session',
                pathway: aiSession,
            });
        }

        const course = courses[index];
        if (course) {
            mixedCards.push({
                type: 'course',
                program: course,
            });
        }

        const mediaItem = mergedMedia[index];
        if (mediaItem) {
            mixedCards.push(mediaItem);
        }
    }

    return mixedCards;
};

// const dummyLearningPathwaysData: GrowSkillsPathway[] = [
//     {
//         title: 'Adding & Subtracting Fractions',
//         description:
//             'Learn how to add and subtract fractions with like and unlike denominators through guided practice.',
//         skills: ['Fraction Calculation', 'Equivalent Fractions', 'Number Sense'],
//         topicUri: 'dummy-topic-fractions',
//         pathwayUri: 'dummy-pathway-fractions',
//         keywords: {
//             occupations: ['elementary school teacher', 'math tutor', 'education assistant'],
//             jobs: ['fractions', 'arithmetic', 'math practice'],
//             careers: ['math instruction', 'basic mathematics'],
//             fieldOfStudy: 'Mathematics',
//         },
//     },
//     {
//         title: 'Introduction to Digital Literacy',
//         description:
//             'Build confidence using common tools, organizing files, and staying safe online.',
//         skills: ['Computer Basics', 'File Management', 'Online Safety'],
//         topicUri: 'dummy-topic-digital-literacy',
//         pathwayUri: 'dummy-pathway-digital-literacy',
//         keywords: {
//             occupations: ['office assistant', 'administrative assistant', 'customer support'],
//             jobs: ['digital literacy', 'computer skills', 'technology basics'],
//             careers: ['technology skills', 'workplace productivity'],
//             fieldOfStudy: 'Information Technology',
//         },
//     },
//     {
//         title: 'Getting Started with Financial Planning',
//         description: 'Learn simple ways to budget, save, and make smart everyday money decisions.',
//         skills: ['Budgeting', 'Saving', 'Goal Setting'],
//         topicUri: 'dummy-topic-financial-planning',
//         pathwayUri: 'dummy-pathway-financial-planning',
//         keywords: {
//             occupations: ['bank teller', 'bookkeeper', 'financial counselor'],
//             jobs: ['budgeting', 'personal finance', 'money management'],
//             careers: ['financial literacy', 'consumer math'],
//             fieldOfStudy: 'Business',
//         },
//     },
// ];

export const useGrowSkillsContent = ({
    searchQuery = '',
}: GrowSkillsContentParams = {}): GrowSkillsContentResult => {
    const trimmedSearchQuery = searchQuery.trim();

    const { data: aiInsightCredential, isLoading: fetchAiInsightCredentialLoading } =
        useAiInsightCredential();
    const { data: learningPathwaysData = [], isLoading: fetchPathwaysLoading } = useAiPathways();
    // const resolvedLearningPathwaysData =
    //     learningPathwaysData && learningPathwaysData.length > 0
    //         ? learningPathwaysData
    //         : dummyLearningPathwaysData;

    const strongestAreaInterest = aiInsightCredential?.insights?.strongestArea;

    const careerKeywords = useMemo<string[] | null>(() => {
        let keywords: string[] | null = null;
        const insightKeywords = strongestAreaInterest?.keywords?.occupations;

        if (insightKeywords?.length) {
            keywords = insightKeywords;
        }

        if (learningPathwaysData && learningPathwaysData.length > 0) {
            keywords = keywords || getFirstAvailableKeywords(learningPathwaysData || []);
        }

        return keywords;
    }, [learningPathwaysData, strongestAreaInterest]);

    const fieldOfStudy = useMemo<string>(() => {
        const insightFieldOfStudy = strongestAreaInterest?.keywords?.fieldOfStudy;

        if (insightFieldOfStudy) return insightFieldOfStudy;

        if (learningPathwaysData && learningPathwaysData.length > 0) {
            return getFirstAvailableFieldOfStudy(learningPathwaysData || []);
        }

        return '';
    }, [learningPathwaysData, strongestAreaInterest]);

    const allKeywords = useMemo<string[] | null>(() => {
        const pathwayKeywords = getAllKeywords(learningPathwaysData || []);

        if (pathwayKeywords.length > 0) return pathwayKeywords;

        return careerKeywords;
    }, [careerKeywords, learningPathwaysData]);

    const { data: trainingPrograms, isLoading: fetchTrainingProgramsLoading } =
        useTrainingProgramsByKeyword({
            keywords: allKeywords?.length ? allKeywords : null,
        });

    const schoolPrograms = useMemo<GrowSkillsCourseProgram[]>(() => {
        return trainingPrograms?.length ? normalizeSchoolPrograms(trainingPrograms) : [];
    }, [trainingPrograms]);

    const courses = useMemo<any[]>(() => {
        return schoolPrograms?.length
            ? filterCoursesByFieldOfStudy(schoolPrograms, fieldOfStudy)
            : [];
    }, [schoolPrograms, fieldOfStudy]);

    const { data: occupations, isLoading: fetchOccupationsLoading } =
        useOccupationDetailsForKeyword(careerKeywords?.[0] || '');

    const { data: youtubeVideos = [], isLoading: fetchYouTubeLoading } = useYouTubeSearch(
        careerKeywords?.[0] || ''
    );

    const defaultCards = useMemo<GrowSkillsCard[]>(
        () =>
            interleaveGrowSkillsCards({
                aiSessions: learningPathwaysData || [],
                courses: schoolPrograms || [],
                media: occupations || [],
                youtubeVideos,
            }),
        [occupations, learningPathwaysData, schoolPrograms, youtubeVideos]
    );

    const searchKeywords = trimmedSearchQuery ? [trimmedSearchQuery] : null;
    const { data: searchTrainingPrograms, isLoading: fetchSearchTrainingProgramsLoading } =
        useTrainingProgramsByKeyword({
            keywords: searchKeywords,
        });

    const searchSchoolPrograms = useMemo<GrowSkillsCourseProgram[]>(() => {
        return searchTrainingPrograms?.length
            ? normalizeSchoolPrograms(searchTrainingPrograms)
            : [];
    }, [searchTrainingPrograms]);

    const { data: searchOccupations, isLoading: fetchSearchOccupationsLoading } =
        useOccupationDetailsForKeyword(trimmedSearchQuery);

    const { data: searchYouTubeVideos = [], isLoading: fetchSearchYouTubeLoading } =
        useYouTubeSearch(trimmedSearchQuery);

    const searchCards = useMemo<GrowSkillsCard[]>(
        () =>
            interleaveGrowSkillsCards({
                aiSessions: learningPathwaysData || [],
                courses: searchSchoolPrograms || [],
                media: searchOccupations || [],
                youtubeVideos: searchYouTubeVideos,
            }),
        [learningPathwaysData, searchOccupations, searchSchoolPrograms, searchYouTubeVideos]
    );

    const cards = trimmedSearchQuery ? searchCards : defaultCards;

    const isLoading =
        fetchAiInsightCredentialLoading ||
        fetchPathwaysLoading ||
        fetchTrainingProgramsLoading ||
        fetchOccupationsLoading ||
        fetchYouTubeLoading ||
        fetchSearchTrainingProgramsLoading ||
        fetchSearchOccupationsLoading ||
        fetchSearchYouTubeLoading;

    const emptyPathways =
        !isLoading &&
        !occupations &&
        courses?.length === 0 &&
        schoolPrograms.length === 0 &&
        learningPathwaysData.length === 0;

    return {
        isLoading,
        emptyPathways,
        careerKeywords,
        fieldOfStudy,
        allKeywords,
        learningPathwaysData: learningPathwaysData || [],
        schoolPrograms,
        courses,
        occupations,
        youtubeVideos,
        defaultCards,
        searchSchoolPrograms,
        searchOccupations,
        searchYouTubeVideos,
        searchCards,
        cards,
    };
};
