import { randomBytes } from 'node:crypto';
import { test as base } from './mocked-test';

export interface TestActor {
    seed: string;
    profileId: string;
}

interface IsolatedFixtures {
    actors: { learner: TestActor; recipient: TestActor; issuer: TestActor };
}

/**
 * Real-backend tests with fresh identities for every test attempt. Browser and
 * SDK helpers must use the same actor. Data lives until the stack is torn down;
 * never call delete-all while another worker may be using that stack.
 */
export const test = base.extend<IsolatedFixtures>({
    storageState: { cookies: [], origins: [] },
    actors: async ({ browserName }, provide, testInfo) => {
        const id = randomBytes(8).toString('hex');
        const actor = (role: string): TestActor => ({
            seed: randomBytes(32).toString('hex'),
            profileId: `e2e-${browserName[0]}-${testInfo.parallelIndex}-${testInfo.retry}-${id}-${role}`,
        });
        await provide({
            learner: actor('learner'),
            recipient: actor('recipient'),
            issuer: actor('issuer'),
        });
    },
});

export { expect } from '@playwright/test';
