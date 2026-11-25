import { afterEach, describe, expect, it } from 'vitest';
import { buildContractUpdatePreview } from '@learncard/helpers';
import type { ConsentFlowContractScope } from '@learncard/types';
import { mDynamic } from '../../i18n/mDynamic';
import { setLocale } from '../../paraglide/runtime.js';
import en from '../../../public/locales/en/translation.json';
import es from '../../../public/locales/es/translation.json';
import fr from '../../../public/locales/fr/translation.json';
import ar from '../../../public/locales/ar/translation.json';

// Exercise the compiled message registry: i18next interprets underscores as context separators.
const categories: Record<string, keyof typeof en.consentUpdate.scope> = {
    Transcript: 'transcripts',
    Certificate: 'certificates',
    Achievement: 'achievements',
    Skill: 'skills',
    'Work History': 'workHistory',
    'Learning History': 'learningHistory',
    ID: 'ids',
    'Social Badge': 'socialBadges',
    Membership: 'memberships',
    Accomplishment: 'accomplishments',
    Experiences: 'experiences',
    Accommodation: 'accommodations',
    Family: 'family',
    Qualifications: 'qualifications',
    Goals: 'goals',
    'Professional Title': 'professionalTitle',
    'Role Experience': 'roleExperience',
    'Work Experience': 'workExperience',
    'Pay Rate': 'payRate',
    'Work Life Balance': 'workLifeBalance',
    'Job Stability': 'jobStability',
    'Self-Assigned Skills': 'selfAssignedSkills',
    'ai-summary': 'aiSummaries',
    'ai-topic': 'aiTopics',
    'ai-assessment': 'aiAssessments',
    'AI Insight': 'aiInsights',
    'learning-pathway': 'learningPathways',
};
const personal: Record<string, keyof typeof en.consentUpdate.scope> = {
    Name: 'name',
    Email: 'email',
    Image: 'profilePhoto',
    'Profile Image': 'profilePhoto',
    'Profile Photo': 'profilePhoto',
};
const preview = (type: ConsentFlowContractScope['type'], key: string, localized: boolean) =>
    buildContractUpdatePreview({
        name: 'Example app',
        kind: 'expanded_optional',
        diff: { added: [{ area: 'read', type, key, required: false }], removed: [], changed: [] },
        ...(localized ? { translate: mDynamic } : {}),
    }).rows[0];

afterEach(() => setLocale('en', { reload: false }));

describe('compiled contract category translations', () => {
    it.each([
        ['en', en],
        ['es', es],
        ['fr', fr],
        ['ar', ar],
    ] as const)('resolves known scope labels and descriptions in %s', (locale, catalog) => {
        setLocale(locale, { reload: false });
        for (const [type, scopes] of [
            ['credential', categories],
            ['personal', personal],
        ] as const) {
            for (const [key, copyKey] of Object.entries(scopes)) {
                const copy = catalog.consentUpdate.scope[copyKey];
                expect(preview(type, key, true), `${locale}: ${key}`).toMatchObject({
                    label: copy.label,
                    subtitle: copy.description,
                });
                if (locale === 'en') {
                    expect(preview(type, key, false), `server fallback: ${key}`).toMatchObject({
                        label: copy.label,
                        subtitle: copy.description,
                    });
                }
            }
        }
    });
});
