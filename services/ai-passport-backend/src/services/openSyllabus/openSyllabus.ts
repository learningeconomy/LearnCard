import axios, { type AxiosError } from 'axios';

import type {
    SyllabiResponse,
    InstitutionsResponse,
    TitlesResponse,
} from '../../helpers/openSyllabus.helpers';

import { getOpenSyllabusConfig } from './openSyllabusConfig';

const openSyllabusConfig = getOpenSyllabusConfig();

export type OpenSyllabusCoursesParams = {
    schoolName: string;
    courseCode?: string;
    courseTitle?: string;
    limit?: number;
};

const openSyllabusApi = axios.create({
    baseURL: openSyllabusConfig?.analyticsBaseUrl,
    headers: {
        Authorization: `Api-Key ${openSyllabusConfig?.apiKey ?? ''}`,
        'Content-Type': 'application/json',
    },
    timeout: 8000,
});

// Retry logic with basic exponential backoff.
openSyllabusApi.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
        const { config }: any = error;
        if (!config || config.__retryCount >= 3) throw error;

        config.__retryCount = (config.__retryCount || 0) + 1;
        const delay = 2 ** config.__retryCount * 200;
        await new Promise(res => setTimeout(res, delay));
        return openSyllabusApi(config);
    }
);

// Generic request handler.
export const openSyllabusRequest = async <ResponseBody>(
    endpoint: string,
    params: Record<string, any> = {}
): Promise<ResponseBody> => {
    try {
        const { data } = await openSyllabusApi.get(endpoint, { params });

        return data;
    } catch (error: any) {
        const status = error?.response?.status;
        console.error('❌ OpenSyllabus API Error:', error?.message || error);
        if (status === 404) throw new Error('No results found for your query.', { cause: error });
        if (status === 401) throw new Error('Invalid or expired API key.', { cause: error });
        if (status === 500)
            throw new Error('OpenSyllabus service error. Try again later.', {
                cause: error,
            });
        throw new Error('Unknown error calling OpenSyllabus API.', {
            cause: error,
        });
    }
};

// Fetch institutions.
export const fetchInstitutions = async () => openSyllabusRequest<InstitutionsResponse>('/schools');

// Fetch syllabi.
export const fetchSyllabi = async (opts: OpenSyllabusCoursesParams) =>
    openSyllabusRequest<SyllabiResponse>('/syllabi', {
        institution_query: opts?.schoolName,
        syllabus_code_query: opts?.courseCode,
        syllabus_title_query: opts?.courseTitle,
        size: opts?.limit || 1,
    });

// Fetch assigned titles/books.
export const fetchTitles = async (opts: OpenSyllabusCoursesParams) =>
    openSyllabusRequest<TitlesResponse>('/titles', {
        institution_query: opts?.schoolName,
        syllabus_code_query: opts?.courseCode,
        syllabus_title_query: opts?.courseTitle,
        size: opts?.limit || 1,
    });
