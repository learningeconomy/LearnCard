import { describe, expect, it } from 'vitest';

import { parseLearnCardAppEnvironment } from './buildEnvironment';

describe('LearnCard App build environment', () => {
    it('keeps development flags disabled for staging builds', () => {
        const environment = parseLearnCardAppEnvironment(
            { MODE: 'staging' },
            'test environment',
            'build'
        );

        expect(environment).toMatchObject({ DEV: false, PROD: true });
    });

    it('enables development flags for the Vite dev server', () => {
        const environment = parseLearnCardAppEnvironment(
            { MODE: 'development' },
            'test environment',
            'serve'
        );

        expect(environment).toMatchObject({ DEV: true, PROD: false });
    });
});
