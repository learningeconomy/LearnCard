import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';

test.describe('Network authentication @mocked', () => {
    test('refills challenges for every SDK batch size on both services', async ({ page }) => {
        await installNetwork(page);
        await page.route('**/mock-auth-harness.html', route =>
            route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Auth</title>' })
        );
        await page.goto('/mock-auth-harness.html');

        // The SDK randomizes refills from 93 through 98. The HAR only recorded
        // 94, 96 and 97, so other sizes used to abort during account setup.
        const results = await page.evaluate(async () => {
            const refills: { amount: number; status: number; challenges: string[] }[] = [];
            for (const port of [4000, 4100]) {
                for (const amount of [93, 94, 95, 96, 97, 98, 93]) {
                    const response = await fetch(
                        `http://localhost:${port}/trpc/utilities.getChallenges?batch=1`,
                        {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ 0: JSON.stringify({ amount }) }),
                        }
                    );
                    const payload = await response.json();
                    refills.push({
                        amount,
                        status: response.status,
                        challenges: payload[0].result.data,
                    });
                }
            }
            return refills;
        });

        for (const { amount, status, challenges } of results) {
            expect(status).toBe(200);
            expect(challenges).toHaveLength(amount);
            expect(challenges.every(challenge => typeof challenge === 'string')).toBe(true);
        }
        const challenges = results.flatMap(result => result.challenges);
        expect(new Set(challenges).size).toBe(challenges.length);
    });
});
