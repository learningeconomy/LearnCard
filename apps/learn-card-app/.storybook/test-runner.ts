import type { TestRunnerConfig } from '@storybook/test-runner';

/**
 * Many components animate in with `animate-fade-in-up` (0.5s, starts at
 * opacity:0). Play functions assert immediately, so mid-animation elements read
 * as `opacity:0` and fail `toBeVisible()`. Zeroing animation/transition
 * durations makes `forwards` animations jump to their final state before the
 * play function runs, keeping `toBeVisible()` meaningful.
 */
const config: TestRunnerConfig = {
    async preVisit(page) {
        await page.addStyleTag({
            content: `*, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }`,
        });
    },
};

export default config;
