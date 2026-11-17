import { describe, expect, it } from 'vitest';
import { requestProfileFields } from '@learncard/types';
import {
    profileSchemasValidator,
    resolveProfileField,
    validProfileAnswer,
} from 'learn-card-base/config/profileFields';
import local from '../../../environments/vetpass/config.local.json';
import staging from '../../../environments/vetpass/config.staging.json';

describe.each([
    ['local', local],
    ['staging', staging],
] as const)('VetPass %s military profile', (_stage, config) => {
    const schemas = profileSchemasValidator.parse(config.verifiableDataSchemas);
    const fields = ['branch', 'disabilityStatus', 'gender', 'birthDate'];
    it('requests the four pilot fields independently and leaves each optional by default', () => {
        const categories = requestProfileFields('vetpass', 'military-profile', schemas);
        expect(Object.keys(categories).sort()).toEqual(
            fields.map(field => `VerifiableData:vetpass:military-profile:${field}`).sort()
        );
        for (const field of fields) {
            const category = `VerifiableData:vetpass:military-profile:${field}`;
            expect(requestProfileFields('vetpass', 'military-profile', schemas, [field])).toEqual({
                [category]: { required: false },
            });
            expect(resolveProfileField(category, 'vetpass', schemas)).toBeDefined();
        }
    });
    it('accepts calendar dates and rejects an impossible birth date', () => {
        const field = schemas['military-profile']!.fields.birthDate!;
        expect(validProfileAnswer(field, '2000-02-29')).toBe(true);
        expect(validProfileAnswer(field, '2001-02-29')).toBe(false);
    });
});
