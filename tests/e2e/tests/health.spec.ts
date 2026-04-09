import { describe, test, expect } from 'vitest';
import { URLS } from './helpers/ports';

describe('Health checks', () => {
    test('LearnCard Network', async () => {
        const result = await fetch(URLS.brainHealthCheck);

        expect(result.status).toEqual(200);
    });

    test('LearnCloud', async () => {
        const result = await fetch(URLS.cloudHealthCheck);

        expect(result.status).toEqual(200);
    });

    test('LCA API', async () => {
        const result = await fetch(URLS.lcaApiHealthCheck);

        expect(result.status).toEqual(200);
    });
});
