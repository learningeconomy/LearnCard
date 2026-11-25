/**
 * Pathways Provider - Aggregator Pattern Implementation
 *
 * This module implements a provider pattern that aggregates multiple external
 * data sources (CareerOneStop, OpenSyllabus, YouTube) into a unified interface
 * for learning pathway resource discovery.
 *
 * Architecture:
 * - Individual providers implement PathwaysResourceProvider interface
 * - createPathwaysProvider() creates an aggregator with capability-based routing
 * - Each capability routes to the appropriate provider by provider ID
 */

import { careerOneStopProvider } from '../careerOneStop/careerOneStopProvider';
import { openSyllabusProvider } from '../openSyllabus/openSyllabusProvider';
import { youtubeProvider } from '../youtube/youtubeProvider';

import { PathwaysProviderEnum } from './pathwaysProvider.types';

import type { YouTubeVideo } from '../youtube/youtubeService';
import type {
    OccupationDetailsParams,
    CareerOneStopSalaryParams,
    CareerOneStopTrainingProgramsParams,
} from '../careerOneStop/careerOneStop';
import type { CareerOneStopVideo } from '../../constants/careerOneStop';
import type { OpenSyllabusCoursesParams } from '../openSyllabus/openSyllabus';

/** Default provider instances registered at startup */
const defaultProviders = [careerOneStopProvider, openSyllabusProvider, youtubeProvider];

/**
 * Runtime status of a provider, including enabled state and any error reason.
 * Used for health checks and diagnostics.
 */
type ProviderStatus = {
    id: PathwaysProviderEnum;
    enabled: boolean;
    reason?: string;
};

/**
 * Interface that all pathway resource providers must implement.
 *
 * Capabilities are optional (using ?) to allow providers to support
 * only the resource types they provide. Each capability maps to a
 * specific external API or service.
 */
export type PathwaysResourceProvider = {
    id: PathwaysProviderEnum;
    /** Returns true if provider is properly configured and available */
    isEnabled: () => boolean;
    /** CareerOneStop: Get occupation details by keyword */
    getOccupationDetails?: (params: OccupationDetailsParams) => Promise<unknown>;
    /** CareerOneStop: Get salary data for occupations by location */
    getSalaries?: (params: CareerOneStopSalaryParams) => Promise<unknown>;
    /** CareerOneStop: Get training programs for occupations */
    getTrainingPrograms?: (params: CareerOneStopTrainingProgramsParams) => Promise<unknown>;
    /** CareerOneStop: Get a specific video by code */
    getVideo?: (videoCode: string) => CareerOneStopVideo | null;
    /** OpenSyllabus: Get university courses and syllabi */
    getCourses?: (params: OpenSyllabusCoursesParams) => Promise<unknown>;
    /** YouTube: Search TED/TEDx videos by keyword */
    searchVideos?: (keyword: string) => Promise<YouTubeVideo[]>;
};

/**
 * Get the runtime status of a single provider.
 * Safely handles errors from isEnabled() checks.
 *
 * @param provider - The provider to check
 * @returns ProviderStatus with enabled flag and optional error reason
 */
const getProviderStatus = (provider: PathwaysResourceProvider): ProviderStatus => {
    try {
        const enabled = provider.isEnabled();
        return {
            id: provider.id,
            enabled,
            reason: enabled ? undefined : 'Provider is not configured',
        };
    } catch (error) {
        return {
            id: provider.id,
            enabled: false,
            reason: error instanceof Error ? error.message : 'Provider is not configured',
        };
    }
};

/**
 * Factory function that creates a pathways provider aggregator.
 *
 * The aggregator provides a unified interface to multiple external data sources.
 * It uses capability-based routing to delegate calls to the appropriate provider.
 *
 * @param providers - Array of provider instances (defaults to all registered providers)
 * @returns Object with methods for each resource capability
 *
 * Example:
 * ```ts
 * const pathways = createPathwaysProvider();
 * const videos = await pathways.searchYouTubeVideos("software engineer");
 * const courses = await pathways.getCourses({ institution: "MIT" });
 * ```
 */
export const createPathwaysProvider = (
    providers: PathwaysResourceProvider[] = defaultProviders
) => {
    /**
     * Find a provider by its ID.
     * @throws Error if provider is not registered
     */
    const getProvider = (id: PathwaysProviderEnum): PathwaysResourceProvider => {
        const provider = providers.find(candidate => candidate.id === id);
        if (!provider) throw new Error(`Pathways provider not registered: ${id}`);
        return provider;
    };

    /**
     * Get a typed capability function from a specific provider.
     * Uses generic type parameters for type-safe parameter and result typing.
     *
     * @param providerId - Which provider to route to
     * @param capability - Method name on the provider
     * @throws Error if provider doesn't exist or doesn't support the capability
     */
    const getCapability = <Params extends unknown[], Result>(
        providerId: PathwaysProviderEnum,
        capability: keyof PathwaysResourceProvider
    ): ((...params: Params) => Result) => {
        const handler = getProvider(providerId)[capability];
        if (typeof handler !== 'function') {
            throw new Error(`Pathways provider ${providerId} does not support ${capability}`);
        }

        return handler as (...params: Params) => Result;
    };

    return {
        /** Get status of all registered providers for health monitoring */
        getProviderStatuses: (): ProviderStatus[] =>
            providers.map(provider => getProviderStatus(provider)),

        /** Get occupation details from CareerOneStop by keyword */
        getOccupationDetails: (params: OccupationDetailsParams) => {
            const getOccupationDetails = getCapability<[OccupationDetailsParams], Promise<unknown>>(
                PathwaysProviderEnum.CareerOneStop,
                'getOccupationDetails'
            );
            return getOccupationDetails(params);
        },

        /** Get salary comparison data from CareerOneStop */
        getSalaries: (params: CareerOneStopSalaryParams) => {
            const getSalaries = getCapability<[CareerOneStopSalaryParams], Promise<unknown>>(
                PathwaysProviderEnum.CareerOneStop,
                'getSalaries'
            );
            return getSalaries(params);
        },

        /** Get training programs from CareerOneStop by keyword/location */
        getTrainingPrograms: (params: CareerOneStopTrainingProgramsParams) => {
            const getTrainingPrograms = getCapability<
                [CareerOneStopTrainingProgramsParams],
                Promise<unknown>
            >(PathwaysProviderEnum.CareerOneStop, 'getTrainingPrograms');
            return getTrainingPrograms(params);
        },

        /** Get a specific career video from CareerOneStop by video code */
        getCareerOneStopVideo: (videoCode: string) => {
            const getVideo = getCapability<[string], CareerOneStopVideo | null>(
                PathwaysProviderEnum.CareerOneStop,
                'getVideo'
            );
            return getVideo(videoCode);
        },

        /** Get university courses and syllabi from OpenSyllabus */
        getCourses: (params: OpenSyllabusCoursesParams) => {
            const getCourses = getCapability<[OpenSyllabusCoursesParams], Promise<unknown>>(
                PathwaysProviderEnum.OpenSyllabus,
                'getCourses'
            );
            return getCourses(params);
        },

        /** Search TED/TEDx videos from YouTube by keyword */
        searchYouTubeVideos: (keyword: string) => {
            const searchVideos = getCapability<[string], Promise<YouTubeVideo[]>>(
                PathwaysProviderEnum.YouTube,
                'searchVideos'
            );
            return searchVideos(keyword);
        },
    };
};

/** Singleton instance of the pathways provider with default providers registered */
export const pathwaysProvider = createPathwaysProvider();
