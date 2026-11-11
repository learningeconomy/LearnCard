import { describe, expect, it } from 'vitest';

import {
    getAddressProblem,
    getLaunchSettingsError,
    getLaunchSummary,
    parseLaunchConfig,
} from './launchSettings';

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

describe('getAddressProblem', () => {
    it('spots addresses learners could never open', () => {
        expect(getAddressProblem('http://localhost:4321')).toBe('local');
        expect(getAddressProblem('http://127.0.0.1:3000')).toBe('local');
        expect(getAddressProblem('https://abc.lovableproject.com')).toBe('preview');
        expect(getAddressProblem('http://quiz.app')).toBe('insecure');
        expect(getAddressProblem('quiz')).toBe('invalid');
        expect(getAddressProblem('https://quiz.app')).toBeNull();
        expect(getAddressProblem('')).toBeNull();
    });

    it('blocks submitting with a local address', () => {
        expect(getLaunchSettingsError('EMBEDDED_IFRAME', { url: 'http://localhost:4321' })).toBe(
            'Use your public address to submit'
        );
    });
});
