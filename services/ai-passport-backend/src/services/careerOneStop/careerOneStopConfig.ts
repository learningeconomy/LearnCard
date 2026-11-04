import { CAREER_ONE_STOP_CONFIG } from '../../constants/env';

export type CareerOneStopConfig = {
    userId: string;
    apiKey: string;
};

export const getCareerOneStopConfig = (): CareerOneStopConfig | null => {
    const raw = CAREER_ONE_STOP_CONFIG;

    if (!raw) return null;

    const [userId, apiKey] = raw.split(':');

    if (!userId || !apiKey) {
        throw new Error('Invalid CAREER_ONE_STOP_CONFIG format. Expected USER_ID:API_KEY');
    }

    return { userId, apiKey };
};

export const careerOneStopConfig = getCareerOneStopConfig();

export function assertCareerOneStopConfigured() {
    if (!careerOneStopConfig) {
        const err = new Error('CareerOneStop integration not configured');
        (err as any).code = 'CAREER_ONE_STOP_NOT_CONFIGURED';
        throw err;
    }
}
