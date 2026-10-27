import { OPEN_SYLLABUS_ANALYTICS_BASE_URL, OPEN_SYLLABUS_API_KEY } from '../../constants/env';

export type OpenSyllabusConfig = {
    apiKey: string;
    analyticsBaseUrl: string;
};

export const getOpenSyllabusConfig = (): OpenSyllabusConfig | null => {
    if (!OPEN_SYLLABUS_API_KEY) return null;

    return {
        apiKey: OPEN_SYLLABUS_API_KEY,
        analyticsBaseUrl: OPEN_SYLLABUS_ANALYTICS_BASE_URL,
    };
};

export const openSyllabusConfig = getOpenSyllabusConfig();

export function assertOpenSyllabusConfigured() {
    if (!openSyllabusConfig) {
        const err = new Error('OpenSyllabus integration not configured');
        (err as any).code = 'OPEN_SYLLABUS_NOT_CONFIGURED';
        throw err;
    }
}
