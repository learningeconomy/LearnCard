import { useMemo } from 'react';

import {
    useAiInsightCredential,
    useAiPathways,
    useOccupationDetailsForKeyword,
    useTrainingProgramsByKeyword,
    type OccupationDetailsResponse,
    type TrainingProgram,
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
    defaultCards: GrowSkillsCard[];
    searchSchoolPrograms: GrowSkillsCourseProgram[];
    searchOccupations: OccupationDetailsResponse[] | undefined;
    searchCards: GrowSkillsCard[];
    cards: GrowSkillsCard[];
};

const interleaveGrowSkillsCards = ({
    aiSessions,
    courses,
    media,
}: {
    aiSessions: GrowSkillsPathway[];
    courses: GrowSkillsCourseProgram[];
    media: OccupationDetailsResponse[];
}): GrowSkillsCard[] => {
    const mixedCards: GrowSkillsCard[] = [];
    const maxLength = Math.max(aiSessions.length, courses.length, media.length);

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

        const mediaItem = media[index];
        if (mediaItem) {
            mixedCards.push({
                type: 'media',
                occupation: mediaItem,
            });
        }
    }

    return mixedCards;
};

const dummyLearningPathwaysData: GrowSkillsPathway[] = [
    {
        title: 'Adding & Subtracting Fractions',
        description:
            'Learn how to add and subtract fractions with like and unlike denominators through guided practice.',
        skills: ['Fraction Calculation', 'Equivalent Fractions', 'Number Sense'],
        topicUri: 'dummy-topic-fractions',
        pathwayUri: 'dummy-pathway-fractions',
        keywords: {
            occupations: ['elementary school teacher', 'math tutor', 'education assistant'],
            jobs: ['fractions', 'arithmetic', 'math practice'],
            careers: ['math instruction', 'basic mathematics'],
            fieldOfStudy: 'Mathematics',
        },
    },
    {
        title: 'Introduction to Digital Literacy',
        description:
            'Build confidence using common tools, organizing files, and staying safe online.',
        skills: ['Computer Basics', 'File Management', 'Online Safety'],
        topicUri: 'dummy-topic-digital-literacy',
        pathwayUri: 'dummy-pathway-digital-literacy',
        keywords: {
            occupations: ['office assistant', 'administrative assistant', 'customer support'],
            jobs: ['digital literacy', 'computer skills', 'technology basics'],
            careers: ['technology skills', 'workplace productivity'],
            fieldOfStudy: 'Information Technology',
        },
    },
    {
        title: 'Getting Started with Financial Planning',
        description: 'Learn simple ways to budget, save, and make smart everyday money decisions.',
        skills: ['Budgeting', 'Saving', 'Goal Setting'],
        topicUri: 'dummy-topic-financial-planning',
        pathwayUri: 'dummy-pathway-financial-planning',
        keywords: {
            occupations: ['bank teller', 'bookkeeper', 'financial counselor'],
            jobs: ['budgeting', 'personal finance', 'money management'],
            careers: ['financial literacy', 'consumer math'],
            fieldOfStudy: 'Business',
        },
    },
];

export const useGrowSkillsContent = ({
    searchQuery = '',
}: GrowSkillsContentParams = {}): GrowSkillsContentResult => {
    const trimmedSearchQuery = searchQuery.trim();

    const { data: aiInsightCredential, isLoading: fetchAiInsightCredentialLoading } =
        useAiInsightCredential();
    const { data: learningPathwaysData, isLoading: fetchPathwaysLoading } = useAiPathways();
    const resolvedLearningPathwaysData =
        learningPathwaysData && learningPathwaysData.length > 0
            ? learningPathwaysData
            : dummyLearningPathwaysData;

    const strongestAreaInterest = aiInsightCredential?.insights?.strongestArea;

    const careerKeywords = useMemo<string[] | null>(() => {
        let keywords: string[] | null = null;
        const insightKeywords = strongestAreaInterest?.keywords?.occupations;

        if (insightKeywords?.length) {
            keywords = insightKeywords;
        }

        if (resolvedLearningPathwaysData && resolvedLearningPathwaysData.length > 0) {
            keywords = keywords || getFirstAvailableKeywords(resolvedLearningPathwaysData || []);
        }

        return keywords;
    }, [resolvedLearningPathwaysData, strongestAreaInterest]);

    const fieldOfStudy = useMemo<string>(() => {
        const insightFieldOfStudy = strongestAreaInterest?.keywords?.fieldOfStudy;

        if (insightFieldOfStudy) return insightFieldOfStudy;

        if (resolvedLearningPathwaysData && resolvedLearningPathwaysData.length > 0) {
            return getFirstAvailableFieldOfStudy(resolvedLearningPathwaysData || []);
        }

        return '';
    }, [resolvedLearningPathwaysData, strongestAreaInterest]);

    const allKeywords = useMemo<string[] | null>(() => {
        const pathwayKeywords = getAllKeywords(resolvedLearningPathwaysData || []);

        if (pathwayKeywords.length > 0) return pathwayKeywords;

        return careerKeywords;
    }, [careerKeywords, resolvedLearningPathwaysData]);

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

    const defaultCards = useMemo<GrowSkillsCard[]>(
        () =>
            interleaveGrowSkillsCards({
                aiSessions: resolvedLearningPathwaysData || [],
                courses: schoolPrograms || [],
                media: occupations || [],
            }),
        [occupations, resolvedLearningPathwaysData, schoolPrograms]
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

    const searchCards = useMemo<GrowSkillsCard[]>(
        () =>
            interleaveGrowSkillsCards({
                aiSessions: resolvedLearningPathwaysData || [],
                courses: searchSchoolPrograms || [],
                media: searchOccupations || [],
            }),
        [resolvedLearningPathwaysData, searchOccupations, searchSchoolPrograms]
    );

    const cards = trimmedSearchQuery ? searchCards : defaultCards;

    const isLoading =
        fetchAiInsightCredentialLoading ||
        fetchPathwaysLoading ||
        fetchTrainingProgramsLoading ||
        fetchOccupationsLoading ||
        fetchSearchTrainingProgramsLoading ||
        fetchSearchOccupationsLoading;

    const emptyPathways =
        !isLoading &&
        !occupations &&
        courses?.length === 0 &&
        schoolPrograms.length === 0 &&
        resolvedLearningPathwaysData.length === 0;

    return {
        isLoading,
        emptyPathways,
        careerKeywords,
        fieldOfStudy,
        allKeywords,
        learningPathwaysData: resolvedLearningPathwaysData || [],
        schoolPrograms,
        courses,
        occupations,
        defaultCards,
        searchSchoolPrograms,
        searchOccupations,
        searchCards,
        cards,
    };
};
