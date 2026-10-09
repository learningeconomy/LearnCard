import { expect, type Page, type Response } from '@playwright/test';
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
    const proceduresFor = (response: Response) =>
        decodeURIComponent(new URL(response.url()).pathname).split('/trpc/')[1]?.split(',');
    const isProfileResponse = (response: Response) =>
        !!proceduresFor(response)?.includes('profile.getProfile');
    let observedProfile: Response | undefined;
    const observeProfile = (response: Response) => {
        if (isProfileResponse(response)) observedProfile = response;
    };
    // Observe boot/cache-populating reads too. Start the timeout only after
    // sign-in, rather than letting a cold Vite load exhaust it beforehand.
    page.on('response', observeProfile);
    try {
        await page.goto(`/developer/sign-in?${params}`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('textbox').fill(options.seed ?? TEST_USER_SEED);

        const destination = new URL(path, page.url());
        await Promise.all([
            page.waitForURL(
                url =>
                    url.pathname === destination.pathname &&
                    url.search === destination.search &&
                    url.hash === destination.hash,
                { timeout, waitUntil: 'domcontentloaded' }
            ),
            page.getByRole('button', { name: /^(Sign in|Sign out and switch)$/ }).click(),
        ]);
        const profileResponse =
            observedProfile ?? (await page.waitForResponse(isProfileResponse, { timeout }));

        // HTTP success can contain null or a tRPC error. Check the exact profile
        // at its position in the comma-joined batch, not just the status code.
        expect(profileResponse.ok(), 'Mock profile lookup must succeed').toBe(true);
        const payload = await profileResponse.json();
        const result = Array.isArray(payload)
            ? payload[proceduresFor(profileResponse)!.indexOf('profile.getProfile')]
            : payload;
        expect(
            result?.result?.data?.profileId,
            'Mock login must return the requested profile'
        ).toBe(options.profileId);
    } finally {
        page.off('response', observeProfile);
    }
};
