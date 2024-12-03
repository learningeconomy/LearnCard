import { describe, test, expect } from 'vitest';

describe('Health checks', () => {
    test('LearnCard Network', async () => {
        const result = await fetch('http://localhost:4000/api/health-check');

        expect(result.status).toEqual(200);
    });

    test('LearnCloud', async () => {
        const result = await fetch('http://localhost:4100/api/health-check');

        expect(result.status).toEqual(200);
    });
});
