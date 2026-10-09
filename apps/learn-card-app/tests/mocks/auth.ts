import { expect, type Page } from '@playwright/test';
import { TEST_USER_SEED } from '../constants';

/**
 * Sign in against the profile supplied by installNetwork()/typed mock overrides.
 * Mocked tests require that profile to exist; they never create it through the
 * optional onboarding modal. Keep the real-backend helper's fallback separate.
 */
export const signInMockUser = async (
    page: Page,
    options: { profileId: string; path?: string; seed?: string },
    timeout = 30_000
) => {
    const path = options.path === '/' ? '/wallet' : (options.path ?? '/wallet');
    const params = new URLSearchParams({ profileId: options.profileId, next: path });
    await page.goto(`/developer/sign-in?${params}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox').fill(options.seed ?? TEST_USER_SEED);

    const destination = new URL(path, page.url());
    const [profileResponse] = await Promise.all([
        // Arm this after the sign-in page is ready, so a cold Vite load does
        // not consume the profile timeout before authentication even starts.
        page.waitForResponse(
            response => {
                const procedures = decodeURIComponent(new URL(response.url()).pathname)
                    .split('/trpc/')[1]
                    ?.split(',');
                return !!procedures?.includes('profile.getProfile');
            },
            { timeout }
        ),
        page.waitForURL(
            url =>
                url.pathname === destination.pathname &&
                url.search === destination.search &&
                url.hash === destination.hash,
            { timeout, waitUntil: 'domcontentloaded' }
        ),
        page.getByRole('button', { name: /^(Sign in|Sign out and switch)$/ }).click(),
    ]);

    // A successful HTTP response alone can contain null or a tRPC error. Verify
    // the exact profile, including its position in a comma-joined batch.
    expect(profileResponse.ok(), 'Mock profile lookup must succeed').toBe(true);
    const procedures = decodeURIComponent(new URL(profileResponse.url()).pathname)
        .split('/trpc/')[1]
        .split(',');
    const payload = await profileResponse.json();
    const result = Array.isArray(payload)
        ? payload[procedures.indexOf('profile.getProfile')]
        : payload;
    expect(result?.result?.data?.profileId, 'Mock login must return the requested profile').toBe(
        options.profileId
    );
};
