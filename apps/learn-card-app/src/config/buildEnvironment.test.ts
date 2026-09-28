import { describe, expect, it } from 'vitest';

import { parseLearnCardAppEnvironment } from './buildEnvironment';
import { environment as buildEnvironment } from './environment';

describe('LearnCard App build environment', () => {
    it('keeps development flags disabled for staging builds', () => {
        const environment = parseLearnCardAppEnvironment(
            { MODE: 'staging' },
            'test environment',
            'build'
        );

        expect(environment).toMatchObject({
            DEV: false,
            PROD: true,
            VITE_CREDENTIAL_REFRESH_LOCAL_QA: false,
        });
    });

    it('enables development flags for the Vite dev server', () => {
        const environment = parseLearnCardAppEnvironment(
            { MODE: 'development' },
            'test environment',
            'serve'
        );

        expect(environment).toMatchObject({
            DEV: true,
            PROD: false,
            VITE_CREDENTIAL_REFRESH_LOCAL_QA: true,
        });
    });

    it('allows developers to opt out of local trust and refresh transport exceptions', () => {
        expect(
            parseLearnCardAppEnvironment(
                { MODE: 'development', VITE_CREDENTIAL_REFRESH_LOCAL_QA: 'false' },
                'test',
                'serve'
            ).VITE_CREDENTIAL_REFRESH_LOCAL_QA
        ).toBe(false);
    });

    it('cannot enable local exceptions in a build even with an explicit flag', () => {
        expect(
            parseLearnCardAppEnvironment(
                { MODE: 'development', VITE_CREDENTIAL_REFRESH_LOCAL_QA: 'true' },
                'test',
                'build'
            ).VITE_CREDENTIAL_REFRESH_LOCAL_QA
        ).toBe(false);
    });

    it('defines application build constants under Vitest', () => {
        expect(buildEnvironment).toMatchObject({ MODE: 'test', DEV: true, PROD: false });
        expect(__APP_VERSION__).toBe('0.0.0-test');
    });
});
