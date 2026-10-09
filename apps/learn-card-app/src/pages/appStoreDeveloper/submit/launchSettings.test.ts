import { describe, expect, it } from 'vitest';

import { getLaunchSettingsError, getLaunchSummary, parseLaunchConfig } from './launchSettings';

describe('getLaunchSummary', () => {
    it('names the type in plain words with its address', () => {
        expect(getLaunchSummary('DIRECT_LINK', { url: 'https://quiz.app' })).toBe(
            'Opens in a new tab · https://quiz.app'
        );
        expect(getLaunchSummary('AI_TUTOR', { aiTutorUrl: 'https://tutor.app' })).toBe(
            'AI tutor · https://tutor.app'
        );
        expect(getLaunchSummary('SERVER_HEADLESS', {})).toBe('Runs on a server');
    });
});

describe('getLaunchSettingsError', () => {
    it("asks for each type's required setting", () => {
        expect(getLaunchSettingsError('DIRECT_LINK', {})).toBe('Add a link to submit');
        expect(getLaunchSettingsError('AI_TUTOR', {})).toBe("Add your tutor's address to submit");
        expect(getLaunchSettingsError('SERVER_HEADLESS', {})).toBe(
            'Add your server address to submit'
        );
        expect(getLaunchSettingsError('CONSENT_REDIRECT', { contractUri: 'lc:c' })).toBe(
            'Add where people go next to submit'
        );
        expect(getLaunchSettingsError('DIRECT_LINK', { url: 'https://quiz.app' })).toBeNull();
    });
});

describe('parseLaunchConfig', () => {
    it('tolerates empty or broken settings', () => {
        expect(parseLaunchConfig(undefined)).toEqual({});
        expect(parseLaunchConfig('not json')).toEqual({});
        expect(parseLaunchConfig('{"url":"https://a.app"}')).toEqual({ url: 'https://a.app' });
    });
});
