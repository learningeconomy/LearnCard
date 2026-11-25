import { CAREER_ONE_STOP_VIDEOS, CareerOneStopVideo } from '../../constants/careerOneStop';
import type {
    CareerOneStopOccupation,
    OccupationDetailsOptions,
    OccupationDetailsResponse,
} from '../../helpers/careerOneStop.helpers';
import { getCareerOneStopConfig } from './careerOneStopConfig';

const careerOneStopBaseUrl = 'https://api.careeronestop.org/v1';

export type OccupationDetailsParams = {
    keyword: string;
    limit?: number;
    topNDetails?: number;
};

export const getOccupationsByKeyword = async ({
    keyword,
    dataLevelOnly = 'N',
    startRecord = 0,
    limitRecord = 20,
    datasettype = 'onet',
    searchby = 'title',
}: {
    keyword: string;
    dataLevelOnly?: 'Y' | 'N';
    startRecord?: number;
    limitRecord?: number;
    datasettype?: string;
    searchby?: string;
}): Promise<CareerOneStopOccupation[]> => {
    const config = getCareerOneStopConfig();

    if (!config) {
        throw new Error('CareerOneStop API is not configured');
    }

    const { userId, apiKey } = config;
    // Encode keyword for URL
    const encoded = encodeURIComponent(keyword);
    // Build base path
    const base = `${careerOneStopBaseUrl}/occupation/${userId}/${encoded}/${dataLevelOnly}/${startRecord}/${limitRecord}`;
    // Build query params
    const params = new URLSearchParams({
        datasettype,
        searchby,
    });
    const url = `${base}?${params.toString()}`;
    const res = await fetch(url, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`CareerOneStop error: ${res.status} — ${text}`);
    }
    const data = await res.json();

    return data?.OccupationList ?? [];
};

const getOccupationDetails = async ({
    keyword,
    location = 'US',
    options = {},
}: {
    keyword: string; // e.g. "software developer"
    location: string; // e.g. "CA" or "US"
    options?: OccupationDetailsOptions;
}): Promise<OccupationDetailsResponse | null> => {
    const { userId, apiKey } = getCareerOneStopConfig()!;

    const baseUrl = `${careerOneStopBaseUrl}/occupation/${encodeURIComponent(
        userId
    )}/${encodeURIComponent(keyword)}/${encodeURIComponent(location)}`;

    const params = new URLSearchParams();

    // Convert boolean flags → "true"/"false"
    Object.entries(options).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
            params.set(key, String(value));
        }
    });

    const url = params.toString().length > 0 ? `${baseUrl}?${params.toString()}` : baseUrl;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`CareerOneStop error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const occupationDetails = data?.OccupationDetail?.[0] ?? null;

    return occupationDetails;
};

export type CareerOneStopSalaryParams = {
    keyword: string;
    locations: string[];
    sortBy?: 'Annual' | 'Hourly';
    sortColumns?: number;
    sortOrder?: number;
    enableMetaData?: boolean;
};

export const getOccupationDetailsForKeyword = async (
    careerKeyword: string,
    limit: number = 10,
    topNDetails: number = 3
): Promise<OccupationDetailsResponse[]> => {
    const occupationsList = await getOccupationsByKeyword({
        keyword: careerKeyword,
        limitRecord: limit,
    });

    const occupationOnetTitles = occupationsList.map(o => o?.OnetTitle).slice(0, topNDetails);

    const settled = await Promise.allSettled(
        occupationOnetTitles.map(title =>
            getOccupationDetails({
                keyword: title,
                location: 'US',
                options: {
                    training: true,
                    interest: true,
                    videos: true,
                    tasks: true,
                    dwas: true,
                    wages: true,
                    alternateOnetTitles: true,
                    projectedEmployment: true,
                    ooh: true,
                    stateLMILinks: true,
                    relatedOnetTitles: true,
                    skills: true,
                    knowledge: true,
                    ability: true,
                    trainingPrograms: true,
                    industryEmpPattern: true,
                    toolsAndTechnology: true,
                    workValues: true,
                    enableMetaData: true,
                },
            })
        )
    );

    return settled
        .filter(
            (r): r is PromiseFulfilledResult<OccupationDetailsResponse | null> =>
                r.status === 'fulfilled'
        )
        .map(r => r.value)
        .filter((v): v is OccupationDetailsResponse => v !== null);
};

export const getSalariesByKeywordCompare = async ({
    keyword,
    locations,
    sortBy = 'Annual',
    sortColumns = 0,
    sortOrder = 0,
    enableMetaData = true,
}: CareerOneStopSalaryParams) => {
    const config = getCareerOneStopConfig();

    if (!config) {
        throw new Error('CareerOneStop API is not configured');
    }

    const { userId, apiKey } = config;

    if (!keyword.trim()) {
        throw new Error('Keyword is required');
    }

    if (!locations.length) {
        throw new Error('At least one location is required');
    }

    const params = new URLSearchParams({
        keyword,
        location: locations.join('|'), // CA|NY|TX
        sortColumns: String(sortColumns),
        sortOrder: String(sortOrder),
        sortBy,
        enableMetaData: String(enableMetaData),
    });

    const url = `${careerOneStopBaseUrl}/comparesalaries/${userId}/wageocc?${params.toString()}`;

    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`CareerOneStop error ${res.status}: ${text}`);
    }

    return res.json();
};

export type CareerOneStopTrainingProgramsParams = {
    keyword: string;
    location?: string;
    radius?: number;
    occupation?: string;
    programName?: string;
    programLength?: string;
    state?: string;
    region?: string;
    sortColumns?: string;
    sortDirections?: 'ASC' | 'DESC' | '0';
    startRecord?: number;
    limitRecord?: number;
};

export const getCareerOneStopVideo = (videoCode: string): CareerOneStopVideo | null => {
    const video = CAREER_ONE_STOP_VIDEOS.find(careerVideo => careerVideo.VideoCode === videoCode);

    return video ?? null;
};

export const getTrainingProgramsByKeyword = async ({
    keyword,
    location = '0',
    radius = 25,
    occupation = '0',
    programName = '0',
    programLength = '0',
    state = '0',
    region = '0',
    sortColumns = '0',
    sortDirections = '0',
    startRecord = 0,
    limitRecord = 10,
}: CareerOneStopTrainingProgramsParams) => {
    const config = getCareerOneStopConfig();

    if (!config) {
        throw new Error('CareerOneStop API is not configured');
    }

    const { userId, apiKey } = config;

    if (!keyword.trim()) {
        throw new Error('Keyword is required');
    }

    const url = `${careerOneStopBaseUrl}/training/${userId}/${encodeURIComponent(
        keyword
    )}/${encodeURIComponent(location)}/${radius}/${occupation}/${programName}/${programLength}/${state}/${region}/${sortColumns}/${sortDirections}/${startRecord}/${limitRecord}`;

    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`CareerOneStop error ${res.status}: ${text}`);
    }

    return res.json();
};
