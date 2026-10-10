import { describe, expect, it } from 'vitest';

import { buildStarterCode, buildStarterPrompt } from './starterKit';

describe('buildStarterPrompt', () => {
    it('describes the app and only the chosen features', () => {
        const prompt = buildStarterPrompt('a fractions quiz for kids.', ['credentials']);

        expect(prompt.startsWith('Build a fractions quiz for kids.')).toBe(true);
        expect(prompt).toContain('@learncard/partner-connect');
        expect(prompt).toContain('learnCard.sendCredential({ alias, template, templateData })');
        expect(prompt).not.toContain('requestConsent');
    });

    it('never asks for IDs or setup', () => {
        const prompt = buildStarterPrompt('', ['identity', 'consent', 'credentials']);

        expect(prompt).toContain('Build a small learning app.');
        expect(prompt).toContain('No setup or API keys are needed');
        expect(prompt).not.toMatch(/contractUri|boostUri|templateUri/);
        expect(prompt.indexOf('requestConsent')).toBeLessThan(
            prompt.indexOf('requestLearnerContext')
        );
    });
});

describe('buildStarterCode', () => {
    it('creates one client and adds a snippet per feature', () => {
        const code = buildStarterCode(['identity', 'progress']);

        expect(code).toContain('const learnCard = createPartnerConnect();');
        expect(code).toContain('learnCard.requestIdentity()');
        expect(code).toContain("learnCard.incrementCounter('points', 10)");
        expect(code).not.toContain('sendCredential');
    });
});
