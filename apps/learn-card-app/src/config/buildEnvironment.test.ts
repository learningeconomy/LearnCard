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

    it('defines application build constants under Vitest', () => {
        expect(buildEnvironment).toMatchObject({ MODE: 'test', DEV: false, PROD: false });
        expect(__APP_VERSION__).toBe('0.0.0-test');
    });
});
